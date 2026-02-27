import { NextRequest, NextResponse } from "next/server";
import { appendInbox, readInbox, updateInboxEntry, type InboxEntry } from "../../lib/csv";

function createCaptureId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `cap_${ts}_${rand}`;
}

export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get("status");
    let rows = readInbox().sort((a, b) => b.capturedAt.localeCompare(a.capturedAt));
    if (status) rows = rows.filter((r) => r.status === status);

    const counts = {
      total: rows.length,
      new: rows.filter((r) => r.status === "new").length,
      needsReview: rows.filter((r) => r.status === "needs_review").length,
      failed: rows.filter((r) => r.status === "failed").length,
    };

    return NextResponse.json({ rows, counts });
  } catch (e) {
    console.error("GET /api/inbox error:", e);
    return NextResponse.json({ error: "Failed to read inbox" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawText = String(body.rawText || "").trim();
    if (!rawText) {
      return NextResponse.json({ error: "rawText required" }, { status: 400 });
    }

    const entry: InboxEntry = {
      captureId: body.captureId || createCaptureId(),
      capturedAt: body.capturedAt || new Date().toISOString(),
      source: body.source || "chat",
      rawText,
      status: body.status || "new",
      suggestedDestination: body.suggestedDestination || "",
      normalizedText: body.normalizedText || "",
      error: body.error || "",
    };
    appendInbox([entry]);
    return NextResponse.json(entry);
  } catch (e) {
    console.error("POST /api/inbox error:", e);
    return NextResponse.json({ error: "Failed to write inbox entry" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const captureId = String(body.captureId || "");
    if (!captureId) {
      return NextResponse.json({ error: "captureId required" }, { status: 400 });
    }

    const updates = {
      status: body.status,
      suggestedDestination: body.suggestedDestination,
      normalizedText: body.normalizedText,
      error: body.error,
    };
    updateInboxEntry(captureId, updates);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("PATCH /api/inbox error:", e);
    return NextResponse.json({ error: "Failed to update inbox entry" }, { status: 500 });
  }
}

