import { NextResponse } from "next/server";
import { upsertPlanEntry, deletePlanEntry, readPlan, getTodaysPlan } from "../../lib/csv";

export async function GET() {
  const plan = readPlan();
  const today = getTodaysPlan(plan);
  return NextResponse.json(today);
}

export async function POST(request: Request) {
  const { date, start, end, item, done, notes } = await request.json();
  if (!date || start === undefined || end === undefined || !item) {
    return NextResponse.json({ error: "date, start, end, item required" }, { status: 400 });
  }
  upsertPlanEntry({ date, start, end, item, done: done ?? "", notes: notes ?? "" });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const { date, item } = await request.json();
  if (!date || !item) {
    return NextResponse.json({ error: "date and item required" }, { status: 400 });
  }
  deletePlanEntry(date, item);
  return NextResponse.json({ success: true });
}
