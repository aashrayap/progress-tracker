import { NextResponse } from "next/server";
import { readDailySignals, readReflections } from "../../lib/csv";
import { resolveTimeframeWindow } from "../../lib/timeframe";

interface DeepWorkSession {
  date: string;
  durationMin: number;
  topic: string;
  category: string;
  notes: string;
}

function parseDuration(notes: string): number {
  const m = notes.match(/(\d+)\s*min/i);
  return m ? parseInt(m[1], 10) : 0;
}

function parseTopic(notes: string): string {
  const parts = notes.split("-");
  if (parts.length < 2) return notes.trim();
  return parts.slice(1).join("-").trim();
}

function inferCategory(topic: string): string {
  const t = topic.toLowerCase();
  if (t.includes("read") || t.includes("book") || t.includes("chapter")) return "reading";
  if (t.includes("design") || t.includes("ux") || t.includes("ui")) return "design";
  if (t.includes("plan") || t.includes("strategy")) return "planning";
  if (t.includes("meeting") || t.includes("review")) return "coordination";
  return "coding";
}

export async function GET(req: Request) {
  try {
    const signals = readDailySignals();
    const reflections = readReflections();
    const parsedRange = resolveTimeframeWindow(
      new URL(req.url).searchParams.get("range")
    );

    const sessions: DeepWorkSession[] = signals
      .filter((e) => e.signal === "deep_work" && e.value === "1")
      .map((e) => {
        const topic = parseTopic(e.context || "");
        const category = e.category?.trim() || inferCategory(topic);
        return {
          date: e.date,
          durationMin: parseDuration(e.context || ""),
          topic,
          category,
          notes: e.context || "",
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date));

    const inRange = sessions.filter(
      (s) => s.date >= parsedRange.startDate && s.date <= parsedRange.endDate
    );
    const totalMinutes = inRange.reduce((sum, s) => sum + s.durationMin, 0);
    const activeDays = new Set(inRange.map((s) => s.date)).size;

    const byCategory: Record<string, number> = {};
    for (const s of inRange) {
      byCategory[s.category] = (byCategory[s.category] || 0) + s.durationMin;
    }

    const categoryBreakdown = Object.entries(byCategory)
      .map(([category, minutes]) => ({
        category,
        minutes,
        pct: totalMinutes > 0 ? Math.round((minutes / totalMinutes) * 100) : 0,
      }))
      .sort((a, b) => b.minutes - a.minutes);

    const reflectionByDate = new Map(reflections.filter((r) => r.domain === "deep_work").map((r) => [r.date, r]));
    const recent = inRange.slice(0, 20).map((s) => ({
      ...s,
      reflection: reflectionByDate.get(s.date) || null,
    }));

    return NextResponse.json({
      range: parsedRange,
      stats: {
        totalMinutes,
        totalSessions: inRange.length,
        activeDays,
        avgSessionMin:
          inRange.length > 0 ? Math.round(totalMinutes / inRange.length) : 0,
        avgActiveDayMin:
          activeDays > 0 ? Math.round(totalMinutes / activeDays) : 0,
      },
      categoryBreakdown,
      recent,
    });
  } catch (e) {
    console.error("GET /api/deep-work error:", e);
    return NextResponse.json({ error: "Failed to read deep work data" }, { status: 500 });
  }
}
