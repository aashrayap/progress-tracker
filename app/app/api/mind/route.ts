import { NextResponse } from "next/server";
import { readMindLoops, appendMindLoop } from "../../lib/csv";
import { todayStr, daysAgoStr } from "../../lib/utils";
import type { MindLoopEntry } from "../../lib/types";

const VALID_LENSES = ["CBT", "DBT", "IFS", "ACT", "somatic", ""];
const ITEM_LIMIT = 8;

interface CountStat {
  label: string;
  count: number;
}

interface LensStat {
  lens: string;
  count: number;
  avgRelief: number;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function round(value: number, precision = 1): number {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function splitMultiValueField(value: string): string[] {
  return value
    .split(/[+,/;|]/)
    .map((part) => normalize(part))
    .filter(Boolean);
}

function topCounts(values: string[], limit = ITEM_LIMIT): CountStat[] {
  const counts: Record<string, number> = {};
  for (const v of values) {
    counts[v] = (counts[v] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.label.localeCompare(b.label);
    })
    .slice(0, limit);
}

export async function GET() {
  try {
    const loops = readMindLoops();
    const today = todayStr();

    // Streak: consecutive days with at least one loop
    const datesWithLoops = new Set(loops.map((l) => l.date));
    let streak = 0;
    const checkDate = new Date(today + "T12:00:00");
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
    const last30d = loops.filter((l) => l.date >= thirtyDaysAgo);
    const totalSessions30d = last30d.length;

    // Recent sessions
    const recentLoops = loops
      .map((loop, idx) => ({ loop, idx }))
      .sort((a, b) => {
        const dateCmp = b.loop.date.localeCompare(a.loop.date);
        if (dateCmp !== 0) return dateCmp;
        return b.idx - a.idx;
      })
      .slice(0, 12)
      .map((entry) => entry.loop);

    // 7d summary + patterns
    const sevenDaysAgo = daysAgoStr(7);
    const last7d = loops.filter((l) => l.date >= sevenDaysAgo);

    let totalBefore = 0;
    let totalAfter = 0;
    let improved = 0;
    let unchanged = 0;
    let worsened = 0;
    const triggerTokens: string[] = [];
    const thoughtPatternTokens: string[] = [];
    const valueTargetTokens: string[] = [];
    const actionDeltas: Record<string, { action: string; deltas: number[] }> = {};
    const lensDeltas: Record<string, { lens: string; deltas: number[] }> = {};

    for (const l of last7d) {
      totalBefore += l.emotionBefore;
      totalAfter += l.emotionAfter;
      const relief = l.emotionBefore - l.emotionAfter;

      if (relief > 0) improved++;
      else if (relief < 0) worsened++;
      else unchanged++;

      triggerTokens.push(...splitMultiValueField(l.trigger));
      thoughtPatternTokens.push(...splitMultiValueField(l.thoughtPattern));
      valueTargetTokens.push(...splitMultiValueField(l.valueTarget));

      const action = l.updatedAction || l.autopilotAction;
      if (action.trim()) {
        const key = normalize(action);
        if (!actionDeltas[key]) {
          actionDeltas[key] = { action, deltas: [] };
        }
        actionDeltas[key].deltas.push(relief);
      }
    }

    for (const l of last30d) {
      const lens = l.lens.trim() || "unlabeled";
      const key = normalize(lens);
      if (!lensDeltas[key]) {
        lensDeltas[key] = { lens, deltas: [] };
      }
      lensDeltas[key].deltas.push(l.emotionBefore - l.emotionAfter);
    }

    const topTriggers = topCounts(triggerTokens).map((entry) => ({
      trigger: entry.label,
      count: entry.count,
    }));
    const topThoughtPatterns = topCounts(thoughtPatternTokens);
    const topValueTargets = topCounts(valueTargetTokens);

    const topActions = Object.entries(actionDeltas)
      .map(([, data]) => ({
        action: data.action.trim(),
        avgRelief: round(data.deltas.reduce((s, d) => s + d, 0) / data.deltas.length),
        count: data.deltas.length,
      }))
      .sort((a, b) => {
        if (b.avgRelief !== a.avgRelief) return b.avgRelief - a.avgRelief;
        return b.count - a.count;
      })
      .slice(0, ITEM_LIMIT);

    const lensBreakdown: LensStat[] = Object.entries(lensDeltas)
      .map(([, data]) => ({
        lens: data.lens,
        count: data.deltas.length,
        avgRelief: round(data.deltas.reduce((s, d) => s + d, 0) / data.deltas.length),
      }))
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return b.avgRelief - a.avgRelief;
      });

    const has7d = last7d.length > 0;
    const summary7d = {
      startDate: sevenDaysAgo,
      endDate: today,
      totalLoops: last7d.length,
      avgIntensityBefore: has7d ? round(totalBefore / last7d.length) : 0,
      avgIntensityAfter: has7d ? round(totalAfter / last7d.length) : 0,
      avgRelief: has7d ? round((totalBefore - totalAfter) / last7d.length) : 0,
      improved,
      unchanged,
      worsened,
    };

    return NextResponse.json({
      streak,
      totalSessions30d,
      summary7d,
      recentLoops,
      topTriggers,
      topActions,
      topThoughtPatterns,
      topValueTargets,
      lensBreakdown,
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
