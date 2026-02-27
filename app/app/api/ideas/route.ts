import { NextRequest, NextResponse } from "next/server";
import { appendIdea, readIdeas, updateIdea } from "../../lib/csv";

export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get("status");
    const domain = request.nextUrl.searchParams.get("domain");
    let rows = readIdeas().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (status) rows = rows.filter((r) => r.status === status);
    if (domain) rows = rows.filter((r) => r.domain === domain);
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
    if (!title) {
      return NextResponse.json({ error: "title required" }, { status: 400 });
    }
    const idea = appendIdea({
      title,
      details: String(body.details || "").trim(),
      domain: body.domain || "system",
      status: body.status || "inbox",
      source: body.source || "manual",
      captureId: body.captureId || "",
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
      status: body.status,
      domain: body.domain,
      source: body.source,
      captureId: body.captureId,
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("PATCH /api/ideas error:", e);
    return NextResponse.json({ error: "Failed to update idea" }, { status: 500 });
  }
}

