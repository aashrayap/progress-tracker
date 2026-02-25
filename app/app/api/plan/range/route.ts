import { NextRequest, NextResponse } from "next/server";
import { readPlan, readLog, getPlanForDateRange, getHabitsForDate } from "../../../lib/csv";

export async function GET(request: NextRequest) {
  const start = request.nextUrl.searchParams.get("start");
  const end = request.nextUrl.searchParams.get("end");

  if (!start || !end) {
    return NextResponse.json({ error: "start and end required" }, { status: 400 });
  }

  const plan = readPlan();
  const log = readLog();

  const events = getPlanForDateRange(plan, start, end);

  const dates = new Set(
    log.filter((e) => e.date >= start && e.date <= end).map((e) => e.date)
  );

  const habits: Record<string, Record<string, boolean>> = {};
  for (const date of dates) {
    const h = getHabitsForDate(log, date);
    if (Object.keys(h).length > 0) habits[date] = h;
  }

  return NextResponse.json({ events, habits });
}
