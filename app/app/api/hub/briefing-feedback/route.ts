import { NextResponse } from "next/server";
import { appendBriefingFeedback, readBriefing } from "../../../lib/csv";
import { todayStr } from "../../../lib/utils";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { rating, text } = body as { rating: string; text?: string };

    if (rating !== "good" && rating !== "bad") {
      return NextResponse.json({ error: "rating must be 'good' or 'bad'" }, { status: 400 });
    }

    const briefing = readBriefing();
    const state = briefing?.state || "unknown";
    const briefingHash = briefing?.input_hash || "";

    appendBriefingFeedback({
      date: todayStr(),
      state,
      rating,
      feedback_text: text || "",
      briefing_hash: briefingHash,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("POST /api/hub/briefing-feedback error:", e);
    return NextResponse.json({ error: "Failed to save feedback" }, { status: 500 });
  }
}
