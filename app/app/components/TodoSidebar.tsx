"use client";

import { useState, useCallback } from "react";
import type { Todo } from "../lib/types";

interface Props {
  todos: Todo[];
  onTodosChange: (todos: Todo[]) => void;
  hideHeader?: boolean;
}

export default function TodoSidebar({ todos, onTodosChange, hideHeader }: Props) {
  const [input, setInput] = useState("");
  const [showDone, setShowDone] = useState(false);

  const incomplete = todos.filter((t) => t.done === 0);
  const completed = todos.filter((t) => t.done === 1);

  const addTodo = useCallback(
    async (item: string) => {
      const res = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item }),
      });
      if (!res.ok) throw new Error("Failed to create todo");
      const entry = await res.json();
      onTodosChange([...todos, entry]);
    },
    [todos, onTodosChange]
  );

  const toggleTodo = useCallback(
    async (id: number, done: boolean) => {
      onTodosChange(
        todos.map((t) => (t.id === id ? { ...t, done: done ? 1 : 0 } : t))
      );
      const res = await fetch("/api/todos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, done: done ? 1 : 0 }),
      });
      if (!res.ok) console.error("Failed to update todo");
    },
    [todos, onTodosChange]
  );

  const deleteTodo = useCallback(
    async (id: number) => {
      onTodosChange(todos.filter((t) => t.id !== id));
      const res = await fetch("/api/todos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) console.error("Failed to delete todo");
    },
    [todos, onTodosChange]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    addTodo(trimmed);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full">
      {!hideHeader && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-medium text-zinc-300">Todos</h2>
            {incomplete.length > 0 && (
              <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded-full">
                {incomplete.length}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {/* Add input */}
        <form onSubmit={handleSubmit} className="mb-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Add todo..."
            className="w-full px-3 py-1.5 text-sm bg-zinc-800/50 border border-white/10 rounded-xl text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-white/20"
          />
        </form>

        {/* Incomplete */}
        {incomplete.map((todo) => (
          <div
            key={todo.id}
            className="group flex items-center gap-2 px-2 py-2 rounded-xl hover:bg-zinc-800/50 transition-colors min-h-[44px]"
          >
            <button
              onClick={() => toggleTodo(todo.id, true)}
              className="w-6 h-6 rounded border border-white/20 flex items-center justify-center text-xs shrink-0 hover:border-zinc-500 transition-colors"
            />
            <span className="text-sm text-zinc-300 flex-1 truncate">
              {todo.item}
            </span>
            <button
              onClick={() => deleteTodo(todo.id)}
              className="text-zinc-700 hover:text-red-400 text-sm p-1 opacity-0 group-hover:opacity-100 transition-opacity min-w-[28px] min-h-[28px] flex items-center justify-center"
            >
              ✕
            </button>
          </div>
        ))}

        {incomplete.length === 0 && (
          <p className="text-xs text-zinc-600 py-4 text-center">
            No pending todos
          </p>
        )}

        {/* Completed (collapsible) */}
        {completed.length > 0 && (
          <div className="pt-3 mt-2 border-t border-white/5">
            <button
              onClick={() => setShowDone(!showDone)}
              className="flex items-center gap-1.5 text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors mb-1"
            >
              <span className="text-[10px]">{showDone ? "▼" : "▶"}</span>
              Done ({completed.length})
            </button>
            {showDone &&
              completed.map((todo) => (
                <div
                  key={todo.id}
                  className="group flex items-center gap-2 px-2 py-2 rounded-xl hover:bg-zinc-800/30 transition-colors min-h-[44px]"
                >
                  <button
                    onClick={() => toggleTodo(todo.id, false)}
                    className="w-6 h-6 rounded border border-green-800 flex items-center justify-center text-xs shrink-0 text-green-600"
                  >
                    ✓
                  </button>
                  <span className="text-sm text-zinc-600 line-through flex-1 truncate">
                    {todo.item}
                  </span>
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="text-zinc-700 hover:text-red-400 text-sm p-1 opacity-0 group-hover:opacity-100 transition-opacity min-w-[28px] min-h-[28px] flex items-center justify-center"
                  >
                    ✕
                  </button>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
