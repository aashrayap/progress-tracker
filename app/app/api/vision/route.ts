import { NextResponse } from "next/server";
import { buildVisionData } from "../../lib/vision";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = buildVisionData();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Failed to build vision data:", err);
    return NextResponse.json(
      { error: "Failed to build vision data" },
      { status: 500 }
    );
  }
}
