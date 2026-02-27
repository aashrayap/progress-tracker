import { NextResponse } from "next/server";
import { todayStr as todayLocal, daysAgoStr } from "../../lib/utils";
import { readDailySignals, readReflections } from "../../lib/csv";

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

export async function GET() {
  try {
    const signals = readDailySignals();
    const reflections = readReflections();
    const weekAgo = daysAgoStr(7);
    const today = todayLocal();

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

    const thisWeek = sessions.filter((s) => s.date >= weekAgo);
    const todaySessions = sessions.filter((s) => s.date === today);
    const weekMinutes = thisWeek.reduce((sum, s) => sum + s.durationMin, 0);
    const todayMinutes = todaySessions.reduce((sum, s) => sum + s.durationMin, 0);
    const weekDays = new Set(thisWeek.map((s) => s.date)).size;

    const byCategory: Record<string, number> = {};
    for (const s of thisWeek) {
      byCategory[s.category] = (byCategory[s.category] || 0) + s.durationMin;
    }

    const categoryBreakdown = Object.entries(byCategory)
      .map(([category, minutes]) => ({
        category,
        minutes,
        pct: weekMinutes > 0 ? Math.round((minutes / weekMinutes) * 100) : 0,
      }))
      .sort((a, b) => b.minutes - a.minutes);

    const reflectionByDate = new Map(reflections.filter((r) => r.domain === "deep_work").map((r) => [r.date, r]));
    const recent = sessions.slice(0, 20).map((s) => ({
      ...s,
      reflection: reflectionByDate.get(s.date) || null,
    }));

    return NextResponse.json({
      stats: {
        todayMinutes,
        todaySessions: todaySessions.length,
        weekMinutes,
        weekSessions: thisWeek.length,
        weekDays,
      },
      categoryBreakdown,
      recent,
    });
  } catch (e) {
    console.error("GET /api/deep-work error:", e);
    return NextResponse.json({ error: "Failed to read deep work data" }, { status: 500 });
  }
}
