import { NextRequest, NextResponse } from "next/server";
import { appendIdea, readIdeas, updateIdea } from "../../lib/csv";
import { resolveTimeframeWindow } from "../../lib/timeframe";
import { toDateStr } from "../../lib/utils";

type IdeaStatus = "inbox" | "archived";
type IdeaDomain = "app" | "health" | "life" | "system";

function normalizeStatus(raw: unknown): IdeaStatus {
  return String(raw || "").toLowerCase() === "archived" ? "archived" : "inbox";
}

function normalizeDomain(raw: unknown): IdeaDomain {
  const value = String(raw || "").toLowerCase();
  if (value === "app" || value === "health" || value === "life" || value === "system") {
    return value;
  }
  return "system";
}

export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get("status");
    const domain = request.nextUrl.searchParams.get("domain");
    const rangeKey = request.nextUrl.searchParams.get("range");
    let rows = readIdeas().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (status) rows = rows.filter((r) => r.status === status);
    if (domain) rows = rows.filter((r) => r.domain === domain);
    if (rangeKey) {
      const range = resolveTimeframeWindow(rangeKey);
      rows = rows.filter((r) => {
        const createdDate = toDateStr(new Date(r.createdAt));
        return createdDate >= range.startDate && createdDate <= range.endDate;
      });
    }
    return NextResponse.json(rows);
  } catch (e) {
    console.error("GET /api/ideas error:", e);
    return NextResponse.json({ error: "Failed to read ideas" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const title = String(body.title || "").trim();
    const captureId = String(body.captureId || "").trim();
    if (!title) {
      return NextResponse.json({ error: "title required" }, { status: 400 });
    }

    if (captureId) {
      const existing = readIdeas().find((idea) => idea.captureId === captureId);
      if (existing) {
        return NextResponse.json(existing);
      }
    }

    const idea = appendIdea({
      title,
      details: String(body.details || "").trim(),
      domain: normalizeDomain(body.domain),
      status: normalizeStatus(body.status),
      source: body.source || "manual",
      captureId,
    });
    return NextResponse.json(idea);
  } catch (e) {
    console.error("POST /api/ideas error:", e);
    return NextResponse.json({ error: "Failed to create idea" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const id = Number(body.id);
    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    updateIdea(id, {
      title: body.title,
      details: body.details,
      status: body.status === undefined ? undefined : normalizeStatus(body.status),
      domain: body.domain === undefined ? undefined : normalizeDomain(body.domain),
      source: body.source,
      captureId: body.captureId,
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("PATCH /api/ideas error:", e);
    return NextResponse.json({ error: "Failed to update idea" }, { status: 500 });
  }
}
