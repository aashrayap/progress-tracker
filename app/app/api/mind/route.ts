import { NextResponse } from "next/server";
import { readMindLoops, appendMindLoop } from "../../lib/csv";
import { todayStr, daysAgoStr } from "../../lib/utils";
import type { MindLoopEntry } from "../../lib/types";

const VALID_LENSES = ["CBT", "DBT", "IFS", "ACT", "somatic", ""];

export async function GET() {
  try {
    const loops = readMindLoops();
    const today = todayStr();

    // Streak: consecutive days with at least one loop
    const datesWithLoops = new Set(loops.map((l) => l.date));
    let streak = 0;
    let checkDate = new Date(today + "T12:00:00");
    while (true) {
      const ds = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, "0")}-${String(checkDate.getDate()).padStart(2, "0")}`;
      if (datesWithLoops.has(ds)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // 30d sessions
    const thirtyDaysAgo = daysAgoStr(30);
    const totalSessions30d = loops.filter((l) => l.date >= thirtyDaysAgo).length;

    // Recent 5
    const recentLoops = [...loops].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

    // 7d trigger frequency
    const sevenDaysAgo = daysAgoStr(7);
    const last7d = loops.filter((l) => l.date >= sevenDaysAgo);
    const triggerCounts: Record<string, number> = {};
    for (const l of last7d) {
      if (!l.trigger) continue;
      const key = l.trigger.toLowerCase().trim();
      triggerCounts[key] = (triggerCounts[key] || 0) + 1;
    }
    const topTriggers = Object.entries(triggerCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([trigger, count]) => ({ trigger, count }));

    // 7d top actions by avg emotion improvement
    const actionDeltas: Record<string, number[]> = {};
    for (const l of last7d) {
      const action = l.updatedAction || l.autopilotAction;
      if (!action) continue;
      const key = action.toLowerCase().trim();
      if (!actionDeltas[key]) actionDeltas[key] = [];
      actionDeltas[key].push(l.emotionAfter - l.emotionBefore);
    }
    const topActions = Object.entries(actionDeltas)
      .map(([action, deltas]) => ({
        action,
        avgDelta: deltas.reduce((s, d) => s + d, 0) / deltas.length,
        count: deltas.length,
      }))
      .sort((a, b) => b.avgDelta - a.avgDelta)
      .slice(0, 10);

    return NextResponse.json({
      streak,
      totalSessions30d,
      recentLoops,
      topTriggers,
      topActions,
    });
  } catch (e) {
    console.error("GET /api/mind error:", e);
    return NextResponse.json({ error: "Failed to read mind loops" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.date || !body.trigger) {
      return NextResponse.json({ error: "date and trigger are required" }, { status: 400 });
    }

    if (body.lens && !VALID_LENSES.includes(body.lens)) {
      return NextResponse.json(
        { error: `lens must be one of: ${VALID_LENSES.filter(Boolean).join(", ")}` },
        { status: 400 }
      );
    }

    const entry: MindLoopEntry = {
      date: body.date,
      trigger: body.trigger,
      autopilotAction: body.autopilotAction || "",
      updatedAction: body.updatedAction || "",
      response: body.response || "",
      lens: body.lens || "",
      emotionBefore: Number(body.emotionBefore) || 0,
      emotionAfter: Number(body.emotionAfter) || 0,
      bodySensation: body.bodySensation || "",
      thoughtPattern: body.thoughtPattern || "",
      valueTarget: body.valueTarget || "",
      source: body.source || "api",
      captureId: body.captureId || "",
    };

    appendMindLoop(entry);
    return NextResponse.json({ success: true, entry });
  } catch (e) {
    console.error("POST /api/mind error:", e);
    return NextResponse.json({ error: "Failed to save mind loop" }, { status: 500 });
  }
}
