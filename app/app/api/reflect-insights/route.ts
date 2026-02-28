import { NextResponse } from "next/server";
import { readDailySignals, readReflections } from "../../lib/csv";
import { resolveTimeframeWindow } from "../../lib/timeframe";

type InsightType = "positive" | "warning" | "opportunity";

interface InsightItem {
  type: InsightType;
  title: string;
  message: string;
}

function parseDuration(notes: string): number {
  const m = notes.match(/(\d+)\s*min/i);
  return m ? parseInt(m[1], 10) : 0;
}

function buildDayMap(
  entries: ReturnType<typeof readDailySignals>
): Map<string, Map<string, string>> {
  const map = new Map<string, Map<string, string>>();
  const sorted = entries.slice().sort((a, b) => a.date.localeCompare(b.date));
  for (const e of sorted) {
    if (!map.has(e.date)) map.set(e.date, new Map());
    map.get(e.date)!.set(e.signal, e.value);
  }
  return map;
}

function countDays(
  dayMap: Map<string, Map<string, string>>,
  metric: string,
  value?: string
): number {
  let count = 0;
  for (const [, metrics] of dayMap) {
    const v = metrics.get(metric);
    if (v === undefined) continue;
    if (value === undefined || v === value) count++;
  }
  return count;
}

export async function GET(req: Request) {
  try {
    const range = resolveTimeframeWindow(
      new URL(req.url).searchParams.get("range")
    );
    const signals = readDailySignals().filter(
      (e) => e.date >= range.startDate && e.date <= range.endDate
    );
    const reflections = readReflections().filter(
      (r) => r.date >= range.startDate && r.date <= range.endDate
    );

    const dayMap = buildDayMap(signals);
    const trackedDays = dayMap.size;

    const deepWorkSignals = signals.filter(
      (e) => e.signal === "deep_work" && e.value === "1"
    );
    const deepWorkSessions = deepWorkSignals.length;
    const deepWorkMinutes = deepWorkSignals.reduce(
      (sum, s) => sum + parseDuration(s.context || ""),
      0
    );
    const deepWorkDays = new Set(deepWorkSignals.map((s) => s.date)).size;

    const gymTrackedDays = countDays(dayMap, "gym");
    const gymDoneDays = countDays(dayMap, "gym", "1");
    const gymRate =
      gymTrackedDays > 0 ? Math.round((gymDoneDays / gymTrackedDays) * 100) : 0;

    const sleepTrackedDays = countDays(dayMap, "sleep");
    const sleepDoneDays = countDays(dayMap, "sleep", "1");

    let relapseDays = 0;
    for (const [, metrics] of dayMap) {
      const weed = metrics.get("weed");
      const lol = metrics.get("lol");
      const poker = metrics.get("poker");
      if (weed === "0" || lol === "0" || poker === "0") relapseDays++;
    }

    const byDomainCounts: Record<string, number> = {};
    for (const r of reflections) {
      byDomainCounts[r.domain] = (byDomainCounts[r.domain] || 0) + 1;
    }
    const topDomain =
      Object.entries(byDomainCounts).sort((a, b) => b[1] - a[1])[0] || null;

    const lessonCounts: Record<string, number> = {};
    for (const r of reflections) {
      const lesson = r.lesson.trim().toLowerCase();
      if (!lesson) continue;
      lessonCounts[lesson] = (lessonCounts[lesson] || 0) + 1;
    }
    const topLesson =
      Object.entries(lessonCounts).sort((a, b) => b[1] - a[1])[0] || null;

    const insights: InsightItem[] = [];

    if (deepWorkSessions > 0) {
      insights.push({
        type: "positive",
        title: "Deep Work Output",
        message: `${deepWorkMinutes} minutes across ${deepWorkSessions} sessions (${deepWorkDays} active days).`,
      });
    }

    if (gymTrackedDays > 0) {
      if (gymRate >= 70) {
        insights.push({
          type: "positive",
          title: "Gym Consistency",
          message: `Gym completed ${gymDoneDays}/${gymTrackedDays} tracked days (${gymRate}%).`,
        });
      } else if (gymRate <= 40) {
        insights.push({
          type: "warning",
          title: "Gym Slippage",
          message: `Gym completion is ${gymRate}% in this window. Protect your training slots earlier in the day.`,
        });
      } else {
        insights.push({
          type: "opportunity",
          title: "Gym Opportunity",
          message: `Gym completion is ${gymRate}% (${gymDoneDays}/${gymTrackedDays}). One extra lift day this window materially changes momentum.`,
        });
      }
    }

    if (relapseDays >= 2) {
      insights.push({
        type: "warning",
        title: "Relapse Pressure",
        message: `${relapseDays} days in this window had a relapse signal. Add a pre-commit fallback plan for high-risk evenings.`,
      });
    }

    if (topLesson && topLesson[1] >= 2) {
      insights.push({
        type: "opportunity",
        title: "Recurring Lesson",
        message: `"${topLesson[0]}" appears ${topLesson[1]} times. Convert this into one non-negotiable rule for next week.`,
      });
    }

    if (insights.length === 0) {
      insights.push({
        type: "opportunity",
        title: "Need More Signal",
        message: "Not enough events in this timeframe to detect a strong pattern yet. Keep logging consistently.",
      });
    }

    return NextResponse.json({
      range,
      summary: {
        trackedDays,
        reflectionCount: reflections.length,
        deepWorkMinutes,
        deepWorkSessions,
        gymDoneDays,
        gymTrackedDays,
        sleepDoneDays,
        sleepTrackedDays,
        topDomain: topDomain
          ? { domain: topDomain[0], count: topDomain[1] }
          : null,
      },
      insights: insights.slice(0, 5),
    });
  } catch (e) {
    console.error("GET /api/reflect-insights error:", e);
    return NextResponse.json(
      { error: "Failed to build reflect insights" },
      { status: 500 }
    );
  }
}
