import { NextResponse } from "next/server";
import { readQuotes } from "../../lib/csv";

export async function GET() {
  try {
    const quotes = readQuotes();
    return NextResponse.json(quotes);
  } catch (err) {
    console.error("Failed to read quotes:", err);
    return NextResponse.json({ error: "Failed to read quotes" }, { status: 500 });
  }
}
