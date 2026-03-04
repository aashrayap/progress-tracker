import { NextRequest, NextResponse } from "next/server";
import { readResources, addResource } from "../../lib/csv";

export async function GET() {
  try {
    const resources = readResources();
    return NextResponse.json(resources);
  } catch (err) {
    console.error("Failed to read resources:", err);
    return NextResponse.json({ error: "Failed to read resources" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, author, type, domain, status, notes } = body;
    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }
    addResource({
      title,
      author: author || "",
      type: type || "book",
      domain: domain || "",
      status: status || "unread",
      notes: notes || "",
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Failed to add resource:", err);
    return NextResponse.json({ error: "Failed to add resource" }, { status: 500 });
  }
}
