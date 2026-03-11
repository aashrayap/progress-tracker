import { NextResponse } from "next/server";
import { readVision } from "../../lib/csv";

export async function GET() {
  const data = readVision();
  if (!data) return NextResponse.json({ error: "vision not found" }, { status: 404 });
  return NextResponse.json(data);
}
