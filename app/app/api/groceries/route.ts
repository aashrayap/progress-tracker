import { NextResponse } from "next/server";
import {
  readGroceries,
  appendGrocery,
  updateGrocery,
  deleteGrocery,
  clearDoneGroceries,
} from "../../lib/csv";
import type { GroceryEntry } from "../../lib/types";

const SECTION_ORDER = [
  "produce",
  "bakery",
  "deli",
  "meat",
  "dairy",
  "frozen",
  "beverages",
  "canned",
  "pasta_rice",
  "baking",
  "cereal",
  "snacks",
  "condiments",
  "household",
  "health",
];

function groupBySection(items: GroceryEntry[]) {
  const bySection: Record<string, GroceryEntry[]> = {};
  for (const item of items) {
    const key = item.section || "other";
    if (!bySection[key]) bySection[key] = [];
    bySection[key].push(item);
  }

  const orderedSections = [
    ...SECTION_ORDER.filter((s) => bySection[s]),
    ...Object.keys(bySection).filter((s) => !SECTION_ORDER.includes(s)),
  ];

  return orderedSections.map((name) => ({ name, items: bySection[name] }));
}

export async function GET() {
  try {
    const items = readGroceries();
    const sections = groupBySection(items);
    const totalItems = items.length;
    const doneItems = items.filter((i) => i.done === 1).length;
    return NextResponse.json({ sections, totalItems, doneItems });
  } catch (e) {
    console.error("GET /api/groceries error:", e);
    return NextResponse.json({ error: "Failed to read groceries" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { item, section } = await request.json();
    if (!item || typeof item !== "string" || !item.trim()) {
      return NextResponse.json({ error: "item required" }, { status: 400 });
    }
    const entry = appendGrocery(item.trim(), section?.trim() || "other");
    return NextResponse.json(entry);
  } catch (e) {
    console.error("POST /api/groceries error:", e);
    return NextResponse.json({ error: "Failed to add grocery" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { item, done } = await request.json();
    if (!item) return NextResponse.json({ error: "item required" }, { status: 400 });
    updateGrocery(item, { done });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("PUT /api/groceries error:", e);
    return NextResponse.json({ error: "Failed to update grocery" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    if (body.clear) {
      clearDoneGroceries();
    } else if (body.item) {
      deleteGrocery(body.item);
    } else {
      return NextResponse.json({ error: "item or clear required" }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("DELETE /api/groceries error:", e);
    return NextResponse.json({ error: "Failed to delete grocery" }, { status: 500 });
  }
}
