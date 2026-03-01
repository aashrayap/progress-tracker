import { NextResponse } from "next/server";
import { todayStr as todayLocal, daysAgoStr } from "../../lib/utils";
import { readReflections, archiveReflection } from "../../lib/csv";
import { resolveTimeframeWindow } from "../../lib/timeframe";

export async function GET(req: Request) {
  try {
    const reflections = readReflections().filter((r) => r.archived !== "1");
    const range = resolveTimeframeWindow(
      new URL(req.url).searchParams.get("range")
    );
    const today = todayLocal();
    const yesterday = daysAgoStr(1);
    const inRange = reflections.filter(
      (r) => r.date >= range.startDate && r.date <= range.endDate
    );

    const todayReflections = inRange.filter((r) => r.date === today);
    const yesterdayChanges = inRange.filter(
      (r) => r.date === yesterday && r.change.trim()
    );

    const byDomainCounts: Record<string, number> = {};
    for (const r of inRange) {
      byDomainCounts[r.domain] = (byDomainCounts[r.domain] || 0) + 1;
    }
    const byDomain = Object.entries(byDomainCounts)
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count);

    const lessonCounts: Record<string, number> = {};
    for (const r of inRange) {
      if (!r.lesson.trim()) continue;
      const key = r.lesson.toLowerCase().trim();
      lessonCounts[key] = (lessonCounts[key] || 0) + 1;
    }

    const patterns = Object.entries(lessonCounts)
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .map(([lesson, count]) => ({ lesson, count }));

    return NextResponse.json({
      range,
      total: inRange.length,
      today: todayReflections,
      byDomain,
      yesterdayChanges,
      recent: inRange
        .slice()
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 40),
      patterns,
    });
  } catch (e) {
    console.error("GET /api/reflections error:", e);
    return NextResponse.json({ error: "Failed to read reflections" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { date, domain, index } = await req.json();
    if (!date || !domain || index === undefined) {
      return NextResponse.json({ error: "date, domain, and index are required" }, { status: 400 });
    }
    archiveReflection(date, domain, index);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("PATCH /api/reflections error:", e);
    return NextResponse.json({ error: "Failed to archive reflection" }, { status: 500 });
  }
}
