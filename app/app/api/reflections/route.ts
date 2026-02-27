import { NextResponse } from "next/server";
import { todayStr as todayLocal, daysAgoStr } from "../../lib/utils";
import { appendReflection, readReflections } from "../../lib/csv";

const VALID_DOMAINS = new Set(["gym", "addiction", "deep_work", "eating", "sleep"]);

export async function GET() {
  try {
    const reflections = readReflections();
    const today = todayLocal();
    const weekAgo = daysAgoStr(7);
    const yesterday = daysAgoStr(1);

    const todayReflections = reflections.filter((r) => r.date === today);
    const weekReflections = reflections.filter((r) => r.date >= weekAgo);
    const yesterdayChanges = reflections.filter((r) => r.date === yesterday && r.change.trim());

    const lessonCounts: Record<string, number> = {};
    for (const r of reflections) {
      if (!r.lesson.trim()) continue;
      const key = r.lesson.toLowerCase().trim();
      lessonCounts[key] = (lessonCounts[key] || 0) + 1;
    }

    const patterns = Object.entries(lessonCounts)
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .map(([lesson, count]) => ({ lesson, count }));

    return NextResponse.json({
      today: todayReflections,
      week: { count: weekReflections.length },
      yesterdayChanges,
      recent: reflections.slice().reverse().slice(0, 30),
      patterns,
    });
  } catch (e) {
    console.error("GET /api/reflections error:", e);
    return NextResponse.json({ error: "Failed to read reflections" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { date, domain, win, lesson, change } = body;

    if (!date || !domain) {
      return NextResponse.json({ error: "date and domain are required" }, { status: 400 });
    }

    if (!VALID_DOMAINS.has(domain)) {
      return NextResponse.json({ error: "invalid domain" }, { status: 400 });
    }

    appendReflection({
      date,
      domain,
      win: win || "",
      lesson: lesson || "",
      change: change || "",
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("POST /api/reflections error:", e);
    return NextResponse.json({ error: "Failed to write reflection" }, { status: 500 });
  }
}
