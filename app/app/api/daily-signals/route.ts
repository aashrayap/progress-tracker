import { NextRequest, NextResponse } from "next/server";
import {
  appendDailySignals,
  readDailySignals,
  type DailySignalEntry,
} from "../../lib/csv";

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

    appendDailySignals(entries);
    return NextResponse.json({ success: true, added: entries.length });
  } catch (e) {
    console.error("POST /api/daily-signals error:", e);
    return NextResponse.json({ error: "Failed to write daily signals" }, { status: 500 });
  }
}

