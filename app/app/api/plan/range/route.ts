import { NextRequest, NextResponse } from "next/server";
import {
  readPlan,
  readDailySignals,
  getPlanForDateRange,
  getHabitsForDate,
} from "../../../lib/csv";

export async function GET(request: NextRequest) {
  try {
    const start = request.nextUrl.searchParams.get("start");
    const end = request.nextUrl.searchParams.get("end");

    if (!start || !end) {
      return NextResponse.json({ error: "start and end required" }, { status: 400 });
    }

    const plan = readPlan();
    const signals = readDailySignals();

    const events = getPlanForDateRange(plan, start, end);

    const dates = new Set(
      signals.filter((e) => e.date >= start && e.date <= end).map((e) => e.date)
    );

    const habits: Record<string, Record<string, boolean>> = {};
    for (const date of dates) {
      const h = getHabitsForDate(signals, date);
      if (Object.keys(h).length > 0) habits[date] = h;
    }

    return NextResponse.json({ events, habits });
  } catch (e) {
    console.error("GET /api/plan/range error:", e);
    return NextResponse.json({ error: "Failed to read plan data" }, { status: 500 });
  }
}
