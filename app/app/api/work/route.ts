import { NextResponse } from "next/server";
import { readReflections, appendReflection, readLog } from "../../lib/csv";

export async function GET() {
  try {
    const reflections = readReflections();
    const log = readLog();

    const today = new Date().toISOString().split("T")[0];
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    const todayReflections = reflections.filter((r) => r.date === today);
    const weekReflections = reflections.filter((r) => r.date >= weekAgo);
    const yesterdayChanges = reflections.filter((r) => r.date === yesterday && r.change.trim());

    // Deep work frequency from log.csv
    const deepWorkDays = log.filter(
      (e) => e.metric === "deep_work" && e.value === "1" && e.date >= weekAgo
    ).length;

    // Recurring lessons (same lesson text appearing 2+ times)
    const lessonCounts: Record<string, number> = {};
    for (const r of reflections) {
      if (r.lesson.trim()) {
        const key = r.lesson.toLowerCase().trim();
        lessonCounts[key] = (lessonCounts[key] || 0) + 1;
      }
    }
    const patterns = Object.entries(lessonCounts)
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .map(([lesson, count]) => ({ lesson, count }));

    return NextResponse.json({
      today: todayReflections,
      week: { count: weekReflections.length, deepWorkDays },
      yesterdayChanges,
      recent: reflections.slice().reverse().slice(0, 20),
      patterns,
    });
  } catch {
    return NextResponse.json({ error: "Failed to read reflections" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { date, domain, win, lesson, change } = body;

    if (!date || !domain) {
      return NextResponse.json(
        { error: "date and domain are required" },
        { status: 400 }
      );
    }

    appendReflection({
      date,
      domain,
      win: win || "",
      lesson: lesson || "",
      change: change || "",
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to log reflection" }, { status: 500 });
  }
}
