import { NextResponse } from "next/server";
import { readDailySignals, readReflections } from "../../lib/csv";
import type { ReflectionEntry } from "../../lib/csv";

interface MindEntry {
  date: string;
  trigger: string;
  thought: string;
  action: string;
  circumstance: string;
  category: string;
  source: string;
}

function parseContext(context: string): { thought: string; action: string; circumstance: string } {
  const result = { thought: "", action: "", circumstance: "" };
  if (!context) return result;
  const segments = context.split("|");
  for (const seg of segments) {
    const colonIdx = seg.indexOf(":");
    if (colonIdx === -1) continue;
    const key = seg.slice(0, colonIdx).trim().toLowerCase();
    const val = seg.slice(colonIdx + 1).trim();
    if (key === "thought") result.thought = val;
    else if (key === "action") result.action = val;
    else if (key === "circumstance") result.circumstance = val;
  }
  return result;
}

export async function GET() {
  try {
    const signals = readDailySignals();
    const mindSignals = signals
      .filter((s) => s.signal === "mind")
      .map((s) => {
        const parsed = parseContext(s.context || "");
        return {
          date: s.date,
          trigger: s.value,
          thought: parsed.thought,
          action: parsed.action,
          circumstance: parsed.circumstance,
          category: s.category || "",
          source: s.source || "",
        } satisfies MindEntry;
      })
      .sort((a, b) => b.date.localeCompare(a.date));

    const reflections: ReflectionEntry[] = readReflections()
      .filter((r) => r.domain === "mental" || r.domain === "addiction" || r.domain === "health" || r.domain === "personal_growth")
      .filter((r) => r.archived !== "1")
      .sort((a, b) => b.date.localeCompare(a.date));

    return NextResponse.json({ entries: mindSignals, reflections });
  } catch (e) {
    console.error("GET /api/mind error:", e);
    return NextResponse.json({ error: "Failed to read mind data" }, { status: 500 });
  }
}
