"use client";

import { Suspense, useMemo } from "react";
import { PlanProvider, usePlan } from "./PlanProvider";
import TodoList from "../components/TodoList";
import { getWeekStart } from "../lib/date-utils";

function addDays(d: Date, n: number): Date {
  const date = new Date(d);
  date.setDate(date.getDate() + n);
  return date;
}

function PlanShell({ children }: { children: React.ReactNode }) {
  const { zoom, focusDate, navigate, goTo, todos, setTodos, sidebarOpen, setSidebarOpen } = usePlan();

  const title = useMemo(() => {
    switch (zoom) {
      case "year": return String(focusDate.getFullYear());
      case "month": return focusDate.toLocaleString("en-US", { month: "long", year: "numeric" });
      case "week": {
        const mon = getWeekStart(focusDate);
        const sun = addDays(mon, 6);
        const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        return `${fmt(mon)} \u2013 ${fmt(sun)}, ${mon.getFullYear()}`;
      }
      case "day": return focusDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    }
  }, [zoom, focusDate]);

  const breadcrumbs = useMemo(() => {
    const items: { label: string; level: typeof zoom }[] = [];
    items.push({ label: String(focusDate.getFullYear()), level: "year" });
    if (zoom !== "year") {
      items.push({ label: focusDate.toLocaleString("en-US", { month: "short" }), level: "month" });
    }
    if (zoom === "week" || zoom === "day") {
      const mon = getWeekStart(focusDate);
      const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      items.push({ label: `Week of ${fmt(mon)}`, level: "week" });
    }
    if (zoom === "day") {
      items.push({
        label: focusDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
        level: "day",
      });
    }
    return items;
  }, [zoom, focusDate]);

  const incompleteCount = todos.filter((t) => t.done === 0).length;

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <div className="p-4 sm:p-6">
        <div className={zoom === "year" ? "" : "max-w-6xl mx-auto"}>
          {/* Breadcrumb */}
          <div className="flex items-center gap-1 text-sm mb-2">
            {breadcrumbs.map((bc, i) => (
              <span key={bc.level} className="flex items-center gap-1">
                {i > 0 && <span className="text-zinc-700">/</span>}
                <button
                  onClick={() => goTo(focusDate, bc.level)}
                  className={i === breadcrumbs.length - 1 ? "text-zinc-300" : "text-zinc-400 hover:text-zinc-300"}
                >
                  {bc.label}
                </button>
              </span>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-2 sm:gap-3 mb-6">
            <div className="flex items-center">
              <button
                onClick={() => navigate(-1)}
                className="px-3 py-2 rounded-l bg-zinc-900/60 backdrop-blur-md border border-white/10 hover:border-white/20 text-zinc-400 text-sm min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                ◀
              </button>
              <button
                onClick={() => navigate(1)}
                className="px-3 py-2 rounded-r bg-zinc-900/60 backdrop-blur-md border border-l-0 border-white/10 hover:border-white/20 text-zinc-400 text-sm min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                ▶
              </button>
            </div>
            <h1 className="text-lg sm:text-xl font-semibold flex-1 truncate">{title}</h1>
            <button
              onClick={() => goTo(new Date(), "day")}
              className="px-3 py-2 rounded bg-zinc-900/60 backdrop-blur-md border border-white/10 hover:border-white/20 text-zinc-400 text-sm min-h-[44px]"
            >
              Today
            </button>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="px-3 py-2 rounded bg-zinc-900/60 backdrop-blur-md border border-white/10 hover:border-white/20 text-zinc-400 text-sm relative min-h-[44px]"
            >
              Todos
              {incompleteCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {incompleteCount}
                </span>
              )}
            </button>
          </div>

          {/* Content */}
          {children}
        </div>
      </div>

      {/* Todos slide-out panel */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setSidebarOpen(false)} />
      )}
      <div
        className={`fixed right-0 top-0 bottom-0 w-[40rem] max-w-[95vw] bg-zinc-900/60 backdrop-blur-md border-l border-white/10 z-50 flex flex-col transform transition-transform ${
          sidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <span className="text-sm font-medium text-zinc-300">Todos</span>
          <button onClick={() => setSidebarOpen(false)} className="text-zinc-400 hover:text-zinc-300 text-sm">
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <TodoList todos={todos} onTodosChange={setTodos} hideHeader />
        </div>
      </div>
    </div>
  );
}

export default function PlanLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center">
          <p className="text-zinc-400">Loading...</p>
        </div>
      }
    >
      <PlanProvider>
        <PlanShell>{children}</PlanShell>
      </PlanProvider>
    </Suspense>
  );
}
