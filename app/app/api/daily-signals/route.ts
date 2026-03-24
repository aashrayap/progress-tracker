import { NextRequest, NextResponse } from "next/server";
import {
  readDailySignals,
  deleteDailySignal,
  type DailySignalEntry,
} from "../../lib/csv";
import { writeAndSideEffect } from "../../lib/router";

export async function GET(request: NextRequest) {
  try {
    const start = request.nextUrl.searchParams.get("start");
    const end = request.nextUrl.searchParams.get("end");
    const signal = request.nextUrl.searchParams.get("signal");

    let rows = readDailySignals();
    if (start) rows = rows.filter((r) => r.date >= start);
    if (end) rows = rows.filter((r) => r.date <= end);
    if (signal) rows = rows.filter((r) => r.signal === signal);

    return NextResponse.json(rows);
  } catch (e) {
    console.error("GET /api/daily-signals error:", e);
    return NextResponse.json({ error: "Failed to read daily signals" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const entries: DailySignalEntry[] = body.entries;
    if (!Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json({ error: "entries must be a non-empty array" }, { status: 400 });
    }

    for (const entry of entries) {
      if (!entry.date || !entry.signal || entry.value === undefined) {
        return NextResponse.json(
          { error: "Each entry must have date, signal, and value" },
          { status: 400 }
        );
      }
    }

    const result = writeAndSideEffect("signal", entries);
    return NextResponse.json({ success: true, added: entries.length, sideEffects: result.sideEffects });
  } catch (e) {
    console.error("POST /api/daily-signals error:", e);
    return NextResponse.json({ error: "Failed to write daily signals" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const date = request.nextUrl.searchParams.get("date");
    const signal = request.nextUrl.searchParams.get("signal");
    if (!date || !signal) {
      return NextResponse.json({ error: "date and signal are required" }, { status: 400 });
    }
    deleteDailySignal(date, signal);
    return NextResponse.json({ success: true, deleted: signal });
  } catch (e) {
    console.error("DELETE /api/daily-signals error:", e);
    return NextResponse.json({ error: "Failed to delete signal" }, { status: 500 });
  }
}

