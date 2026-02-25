import { NextResponse } from "next/server";
import { readTodos, appendTodo, updateTodo, deleteTodo } from "../../lib/csv";

export async function GET() {
  return NextResponse.json(readTodos());
}

export async function POST(request: Request) {
  const { item } = await request.json();
  if (!item) return NextResponse.json({ error: "item required" }, { status: 400 });
  const entry = appendTodo(item);
  return NextResponse.json(entry);
}

export async function PUT(request: Request) {
  const { id, done, item } = await request.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  updateTodo(id, { done, item });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  deleteTodo(id);
  return NextResponse.json({ success: true });
}
