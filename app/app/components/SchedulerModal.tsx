"use client";

import { useState, useEffect, useCallback } from "react";
import { DragDropProvider } from "@dnd-kit/react";
import Timeline from "./Timeline";
import TodoList from "./TodoList";
import { config } from "../lib/config";
import { toDateStr } from "../lib/utils";
import type { Todo } from "../lib/types";

interface PlanItem {
  start: number;
  end: number;
  item: string;
  done: string;
  notes: string;
}

interface Props {
  initialPlan: PlanItem[];
  initialTodos: Todo[];
  onClose: () => void;
  onTodosChange?: (todos: Todo[]) => void;
}

interface DragEndEvent {
  canceled: boolean;
  operation: {
    source: { data?: Record<string, unknown> } | null;
    target: { data?: Record<string, unknown> } | null;
  };
}

export default function SchedulerModal({ initialPlan, initialTodos, onClose, onTodosChange }: Props) {
  const [plan, setPlan] = useState<PlanItem[]>(initialPlan);
  const [todos, setTodos] = useState<Todo[]>(initialTodos);
  const [todoPoolOpen, setTodoPoolOpen] = useState(false);
  const today = toDateStr(new Date());

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
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: today, ...entry }),
      });
      if (!res.ok) console.error("Failed to add plan item");
    },
    [today]
  );

  const movePlanItem = useCallback(
    async (item: string, newHour: number, duration: number, notes = "") => {
      const entry: PlanItem = { start: newHour, end: newHour + duration, item, done: "", notes };
      setPlan((prev) => prev.map((p) => (p.item === item ? entry : p)));
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: today, ...entry }),
      });
      if (!res.ok) console.error("Failed to move plan item");
    },
    [today]
  );

  const deletePlanItem = useCallback(
    async (item: string) => {
      setPlan((prev) => prev.filter((p) => p.item !== item));
      const res = await fetch("/api/plan", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: today, item }),
      });
      if (!res.ok) console.error("Failed to delete plan item");
    },
    [today]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      if (event.canceled) return;
      const { source, target } = event.operation;
      if (!target) return;

      const targetData = target.data as { type?: string; hour?: number } | undefined;
      if (targetData?.type !== "hour") return;

      const hour = typeof targetData.hour === "number" ? targetData.hour : 0;
      const sourceData = source?.data as { type?: string; item?: string; notes?: string; duration?: number } | undefined;

      if (sourceData?.type === "todo") {
        if (!sourceData.item) return;
        addPlanItem(sourceData.item, hour);
      } else if (sourceData?.type === "daily") {
        if (!sourceData.item) return;
        addPlanItem(sourceData.item, hour, 1, sourceData.notes || "");
      } else if (sourceData?.type === "plan") {
        if (!sourceData.item) return;
        movePlanItem(sourceData.item, hour, sourceData.duration || 1, sourceData.notes || "");
      }
    },
    [addPlanItem, movePlanItem]
  );

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">Plan Your Day</h2>
          <p className="text-xs text-zinc-400">{today}</p>
        </div>
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm bg-zinc-800 border border-white/20 rounded-xl text-zinc-400 hover:text-zinc-300 hover:border-zinc-600 transition-colors"
        >
          Done
        </button>
      </div>

      <DragDropProvider onDragEnd={handleDragEnd}>
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <Timeline plan={plan} onDeleteItem={deletePlanItem} />
          </div>
          {/* Mobile: collapsible toggle */}
          <button
            onClick={() => setTodoPoolOpen(!todoPoolOpen)}
            className="lg:hidden flex items-center justify-center gap-2 px-4 py-3 bg-zinc-900/60 backdrop-blur-md border-t border-white/10 text-sm text-zinc-400"
          >
            <span>{todoPoolOpen ? "Hide" : "Show"} Todos</span>
            <span className="text-xs text-zinc-600">{todos.filter(t => t.done === 0).length} pending</span>
          </button>
          <div className={`${todoPoolOpen ? "block" : "hidden"} lg:block`}>
            <TodoList
              todos={todos}
              onTodosChange={setTodos}
              dailyTasks={config.dailyTasks}
              scheduledItems={scheduledItems}
              draggable
              hideHeader
              className="w-full lg:w-[24rem] border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col bg-zinc-900/60 backdrop-blur-md/50 max-h-[50vh] lg:max-h-none overflow-y-auto"
            />
          </div>
        </div>
      </DragDropProvider>
    </div>
  );
}
