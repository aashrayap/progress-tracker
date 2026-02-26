"use client";

import { useState } from "react";
import TodoItem from "./TodoItem";
import DailyTaskItem from "./DailyTaskItem";
import type { Todo } from "../lib/types";

interface DailyTask {
  id: string;
  label: string;
  placeholder?: string;
}

interface Props {
  todos: Todo[];
  dailyTasks: DailyTask[];
  scheduledItems: string[];
  onAdd: (item: string) => void;
  onToggle: (id: number, done: boolean) => void;
  onDelete: (id: number) => void;
}

export default function TodoPool({ todos, dailyTasks, scheduledItems, onAdd, onToggle, onDelete }: Props) {
  const [input, setInput] = useState("");

  const incomplete = todos.filter((t) => t.done === 0);
  const completed = todos.filter((t) => t.done === 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setInput("");
  };

  return (
    <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-zinc-800 flex flex-col bg-zinc-900/50 max-h-[50vh] lg:max-h-none overflow-y-auto">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Daily Tasks */}
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

        {/* Todos */}
        <div>
          <p className="text-xs text-zinc-600 uppercase mb-2">Todos</p>
          <form onSubmit={handleSubmit} className="flex gap-2 mb-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Add todo..."
              className="flex-1 px-3 py-1.5 text-sm bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
            />
            <button
              type="submit"
              className="px-3 py-1.5 text-sm bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-400 hover:text-zinc-300 hover:border-zinc-600"
            >
              +
            </button>
          </form>
          <p className="text-[10px] text-zinc-700 mb-2">Drag onto timeline to schedule</p>
          {incomplete.map((todo) => (
            <TodoItem
              key={todo.id}
              id={todo.id}
              item={todo.item}
              done={false}
              onToggle={onToggle}
              onDelete={onDelete}
            />
          ))}

          {incomplete.length === 0 && (
            <p className="text-sm text-zinc-600 py-2 text-center">No todos</p>
          )}

          {completed.length > 0 && (
            <>
              <div className="pt-4 pb-1">
                <p className="text-xs text-zinc-600 uppercase">Completed</p>
              </div>
              {completed.map((todo) => (
                <TodoItem
                  key={todo.id}
                  id={todo.id}
                  item={todo.item}
                  done={true}
                  onToggle={onToggle}
                  onDelete={onDelete}
                />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
