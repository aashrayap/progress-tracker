import { NextResponse } from "next/server";
import { readInbox } from "../../lib/csv";

export async function GET() {
  try {
    const inbox = readInbox();
    const ideas = inbox
      .filter((e) => e.suggestedDestination === "idea")
      .sort((a, b) => b.capturedAt.localeCompare(a.capturedAt));

    return NextResponse.json({ ideas });
  } catch (e) {
    console.error("GET /api/ideas error:", e);
    return NextResponse.json({ error: "Failed to load ideas" }, { status: 500 });
  }
}
