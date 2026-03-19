import { NextResponse } from "next/server";
import { readVision, writeVision } from "../../lib/csv";
import type { VisionData } from "../../lib/types";

export async function GET() {
  const data = readVision();
  if (!data) return NextResponse.json({ error: "vision not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function PUT(req: Request) {
  const body = await req.json();
  if (!body.identityScript || typeof body.antiVision !== "string" || !Array.isArray(body.domains)) {
    return NextResponse.json({ error: "invalid vision data" }, { status: 400 });
  }
  writeVision(body as VisionData);
  return NextResponse.json(body);
}
