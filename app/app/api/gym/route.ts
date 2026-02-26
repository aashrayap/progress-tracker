import { NextResponse } from "next/server";
import { readLog, getNextWorkout } from "../../lib/csv";

export async function GET() {
  const log = readLog();
  const next = getNextWorkout(log);
  const gymDays = log
    .filter((e) => e.metric === "gym" && e.value === "1")
    .sort((a, b) => b.date.localeCompare(a.date));

  return NextResponse.json({
    nextWorkout: next,
    lastGymDate: gymDays[0]?.date ?? null,
    lastGymNotes: gymDays[0]?.notes ?? null,
  });
}
