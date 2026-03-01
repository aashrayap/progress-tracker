"use client";

import { useState, useCallback } from "react";
import DailyTaskItem from "./DailyTaskItem";
import TodoItem from "./TodoItem";
import type { DailyTaskConfig, Todo } from "../lib/types";

interface TodoListProps {
  todos: Todo[];
  onTodosChange: (todos: Todo[]) => void;
  hideHeader?: boolean;
  dailyTasks?: DailyTaskConfig[];
  scheduledItems?: string[];
  draggable?: boolean;
  className?: string;
}

export default function TodoList({
  todos,
  onTodosChange,
  hideHeader = false,
  dailyTasks,
  scheduledItems = [],
  draggable = false,
  className,
}: TodoListProps) {
  const [input, setInput] = useState("");
  const [showDone, setShowDone] = useState(false);

  const incomplete = todos.filter((todo) => todo.done === 0);
  const completed = todos.filter((todo) => todo.done === 1);

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
        todos.map((todo) => (todo.id === id ? { ...todo, done: done ? 1 : 0 } : todo))
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
      onTodosChange(todos.filter((todo) => todo.id !== id));
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
    <div className={className || "flex flex-col h-full"}>
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

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {draggable && dailyTasks && dailyTasks.length > 0 && (
          <div>
            <p className="text-xs text-zinc-600 uppercase mb-2">Daily Tasks</p>
            <div className="space-y-1.5">
              {dailyTasks.map((task) => (
                <DailyTaskItem
                  key={task.id}
                  id={task.id}
                  label={task.label}
                  placeholder={task.placeholder}
                  scheduled={scheduledItems.includes(task.label)}
                />
              ))}
            </div>
          </div>
        )}

        <div>
          {draggable && (
            <p className="text-xs text-zinc-600 uppercase mb-2">Todos</p>
          )}
          <form onSubmit={handleSubmit} className={draggable ? "flex gap-2 mb-2" : "mb-3"}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Add todo..."
              className="flex-1 px-3 py-1.5 text-sm bg-zinc-800/50 border border-white/10 rounded-xl text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-white/20"
            />
            {draggable && (
              <button
                type="submit"
                className="px-3 py-1.5 text-sm bg-zinc-800 border border-white/20 rounded-xl text-zinc-400 hover:text-zinc-300 hover:border-zinc-600"
              >
                +
              </button>
            )}
          </form>
          {draggable && (
            <p className="text-[10px] text-zinc-700 mb-2">Drag onto timeline to schedule</p>
          )}

          {incomplete.map((todo) =>
            draggable ? (
              <TodoItem
                key={todo.id}
                id={todo.id}
                item={todo.item}
                done={false}
                onToggle={toggleTodo}
                onDelete={deleteTodo}
              />
            ) : (
              <div
                key={todo.id}
                className="group flex items-center gap-2 px-2 py-2 rounded-xl hover:bg-zinc-800/50 transition-colors min-h-[44px]"
              >
                <button
                  onClick={() => toggleTodo(todo.id, true)}
                  className="w-6 h-6 rounded border border-white/20 flex items-center justify-center text-xs shrink-0 hover:border-zinc-500 transition-colors"
                />
                <span className="text-sm text-zinc-300 flex-1">
                  {todo.item}
                </span>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="text-zinc-700 hover:text-red-400 text-sm p-1 opacity-0 group-hover:opacity-100 transition-opacity min-w-[28px] min-h-[28px] flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
            )
          )}

          {incomplete.length === 0 && (
            <p className="text-xs text-zinc-600 py-4 text-center">No pending todos</p>
          )}

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
                completed.map((todo) =>
                  draggable ? (
                    <TodoItem
                      key={todo.id}
                      id={todo.id}
                      item={todo.item}
                      done={true}
                      onToggle={toggleTodo}
                      onDelete={deleteTodo}
                    />
                  ) : (
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
                      <span className="text-sm text-zinc-600 line-through flex-1">
                        {todo.item}
                      </span>
                      <button
                        onClick={() => deleteTodo(todo.id)}
                        className="text-zinc-700 hover:text-red-400 text-sm p-1 opacity-0 group-hover:opacity-100 transition-opacity min-w-[28px] min-h-[28px] flex items-center justify-center"
                      >
                        ✕
                      </button>
                    </div>
                  )
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
