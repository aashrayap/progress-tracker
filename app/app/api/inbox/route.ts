import { NextRequest, NextResponse } from "next/server";
import { appendInbox, readInbox, updateInboxEntry, type InboxEntry } from "../../lib/csv";
import { routeInboxEntry } from "../../lib/inbox-pipeline";

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

    const current = readInbox().find((row) => row.captureId === captureId);
    if (!current) {
      return NextResponse.json({ error: "capture not found" }, { status: 404 });
    }

    const nextStatus = body.status as InboxEntry["status"] | undefined;
    const nextDestination =
      body.suggestedDestination !== undefined
        ? String(body.suggestedDestination || "")
        : current.suggestedDestination;
    const nextNormalizedText =
      body.normalizedText !== undefined
        ? String(body.normalizedText || "")
        : current.normalizedText;

    // Accept means "materialize to destination and close inbox item".
    if (nextStatus === "accepted") {
      const candidate: InboxEntry = {
        ...current,
        status: "accepted",
        suggestedDestination: nextDestination,
        normalizedText: nextNormalizedText,
      };
      const routed = routeInboxEntry(candidate, nextDestination);

      if (!routed.ok) {
        updateInboxEntry(captureId, {
          status: "needs_review",
          suggestedDestination: nextDestination,
          normalizedText: nextNormalizedText,
          error: routed.reason || "Routing failed",
        });
        return NextResponse.json(
          { error: routed.reason || "Routing failed", destination: routed.destination },
          { status: 422 }
        );
      }

      updateInboxEntry(captureId, {
        status: "archived",
        suggestedDestination: routed.destination,
        normalizedText: nextNormalizedText,
        error: "",
      });

      return NextResponse.json({
        success: true,
        routed: true,
        destination: routed.destination,
        created: routed.created,
        note: routed.reason || "",
      });
    }

    const updates = {
      status: nextStatus,
      suggestedDestination: nextDestination,
      normalizedText: nextNormalizedText,
      error: body.error,
    };
    updateInboxEntry(captureId, updates);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("PATCH /api/inbox error:", e);
    return NextResponse.json({ error: "Failed to update inbox entry" }, { status: 500 });
  }
}
