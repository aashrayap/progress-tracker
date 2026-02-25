"use client";

import { useState, useEffect, useCallback } from "react";
import { DragDropProvider } from "@dnd-kit/react";
import Timeline from "./Timeline";
import TodoPool from "./TodoPool";
import { config } from "../lib/config";

interface PlanItem {
  start: number;
  end: number;
  item: string;
  done: string;
  notes: string;
}

interface Todo {
  id: number;
  item: string;
  done: number;
  created: string;
}

interface Props {
  initialPlan: PlanItem[];
  initialTodos: Todo[];
  onClose: () => void;
  onTodosChange?: (todos: Todo[]) => void;
}

export default function SchedulerModal({ initialPlan, initialTodos, onClose, onTodosChange }: Props) {
  const [plan, setPlan] = useState<PlanItem[]>(initialPlan);
  const [todos, setTodos] = useState<Todo[]>(initialTodos);
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    onTodosChange?.(todos);
  }, [todos, onTodosChange]);

  const scheduledItems = plan.map((p) => p.item);

  const addPlanItem = useCallback(
    async (item: string, hour: number, duration = 1, notes = "") => {
      const entry: PlanItem = { start: hour, end: hour + duration, item, done: "", notes };
      setPlan((prev) => [...prev.filter((p) => p.item !== item), entry]);
      await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: today, ...entry }),
      });
    },
    [today]
  );

  const movePlanItem = useCallback(
    async (item: string, newHour: number, duration: number, notes = "") => {
      const entry: PlanItem = { start: newHour, end: newHour + duration, item, done: "", notes };
      setPlan((prev) => prev.map((p) => (p.item === item ? entry : p)));
      await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: today, ...entry }),
      });
    },
    [today]
  );

  const deletePlanItem = useCallback(
    async (item: string) => {
      setPlan((prev) => prev.filter((p) => p.item !== item));
      await fetch("/api/plan", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: today, item }),
      });
    },
    [today]
  );

  const addTodo = useCallback(async (item: string) => {
    const res = await fetch("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item }),
    });
    const entry = await res.json();
    setTodos((prev) => [...prev, entry]);
  }, []);

  const toggleTodo = useCallback(async (id: number, done: boolean) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: done ? 1 : 0 } : t)));
    await fetch("/api/todos", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, done: done ? 1 : 0 }),
    });
  }, []);

  const deleteTodo = useCallback(async (id: number) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
    await fetch("/api/todos", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }, []);

  const handleDragEnd = useCallback(
    (event: any) => {
      if (event.canceled) return;
      const { source, target } = event.operation;
      if (!target) return;

      const targetData = target.data;
      if (targetData?.type !== "hour") return;

      const hour: number = targetData.hour;
      const sourceData = source.data;

      if (sourceData?.type === "todo") {
        addPlanItem(sourceData.item, hour);
      } else if (sourceData?.type === "daily") {
        addPlanItem(sourceData.item, hour, 1, sourceData.notes || "");
      } else if (sourceData?.type === "plan") {
        movePlanItem(sourceData.item, hour, sourceData.duration || 1, sourceData.notes || "");
      }
    },
    [addPlanItem, movePlanItem]
  );

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">Plan Your Day</h2>
          <p className="text-xs text-zinc-500">{today}</p>
        </div>
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-400 hover:text-zinc-300 hover:border-zinc-600 transition-colors"
        >
          Done
        </button>
      </div>

      <DragDropProvider onDragEnd={handleDragEnd}>
        <div className="flex flex-1 overflow-hidden">
          <Timeline plan={plan} onDeleteItem={deletePlanItem} />
          <TodoPool
            todos={todos}
            dailyTasks={config.dailyTasks}
            scheduledItems={scheduledItems}
            onAdd={addTodo}
            onToggle={toggleTodo}
            onDelete={deleteTodo}
          />
        </div>
      </DragDropProvider>
    </div>
  );
}
