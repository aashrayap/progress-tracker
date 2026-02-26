import { NextResponse } from "next/server";
import { readTodos, appendTodo, updateTodo, deleteTodo } from "../../lib/csv";

export async function GET() {
  try {
    return NextResponse.json(readTodos());
  } catch (e) {
    console.error("GET /api/todos error:", e);
    return NextResponse.json({ error: "Failed to read todos" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { item } = await request.json();
    if (!item || typeof item !== "string" || !item.trim()) {
      return NextResponse.json({ error: "item required (non-empty string)" }, { status: 400 });
    }
    const entry = appendTodo(item.trim());
    return NextResponse.json(entry);
  } catch (e) {
    console.error("POST /api/todos error:", e);
    return NextResponse.json({ error: "Failed to create todo" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, done, item } = await request.json();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    updateTodo(id, { done, item });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("PUT /api/todos error:", e);
    return NextResponse.json({ error: "Failed to update todo" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    deleteTodo(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("DELETE /api/todos error:", e);
    return NextResponse.json({ error: "Failed to delete todo" }, { status: 500 });
  }
}
