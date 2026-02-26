import { NextResponse } from "next/server";
import { upsertPlanEntry, deletePlanEntry } from "../../lib/csv";

export async function POST(request: Request) {
  try {
    const { date, start, end, item, done, notes } = await request.json();
    if (!date || start === undefined || end === undefined || !item) {
      return NextResponse.json({ error: "date, start, end, item required" }, { status: 400 });
    }
    upsertPlanEntry({ date, start, end, item, done: done ?? "", notes: notes ?? "" });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("POST /api/plan error:", e);
    return NextResponse.json({ error: "Failed to save plan entry" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { date, item } = await request.json();
    if (!date || !item) {
      return NextResponse.json({ error: "date and item required" }, { status: 400 });
    }
    deletePlanEntry(date, item);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("DELETE /api/plan error:", e);
    return NextResponse.json({ error: "Failed to delete plan entry" }, { status: 500 });
  }
}
