import { NextResponse } from "next/server";
import { readVision, writeVision } from "../../lib/csv";
import type { VisionData, VisionDomain } from "../../lib/types";

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

export async function PATCH(req: Request) {
  const patch = await req.json();
  const current = readVision();
  if (!current) return NextResponse.json({ error: "vision not found" }, { status: 404 });

  // Deep merge domains by id
  if (patch.domains && Array.isArray(patch.domains)) {
    for (const patchDomain of patch.domains) {
      const existing = current.domains.find((d: VisionDomain) => d.id === patchDomain.id);
      if (existing) {
        Object.assign(existing, patchDomain);
      }
    }
    delete patch.domains;
  }

  // Shallow merge remaining top-level keys
  const merged = { ...current, ...patch };
  writeVision(merged as VisionData);
  return NextResponse.json(merged);
}
