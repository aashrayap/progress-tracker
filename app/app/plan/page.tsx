"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import YearView from "../components/YearView";
import MonthView from "../components/MonthView";
import WeekView from "../components/WeekView";
import DayView from "../components/DayView";
import TodoList from "../components/TodoList";
import type { ZoomLevel, PlanEvent, HabitMap, Todo } from "../lib/types";
import { toDateStr } from "../lib/utils";

function getMonday(d: Date): Date {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = date.getDay();
  date.setDate(date.getDate() - day + (day === 0 ? -6 : 1));
  return date;
}

function addDays(d: Date, n: number): Date {
  const date = new Date(d);
  date.setDate(date.getDate() + n);
  return date;
}

function getDateRange(zoom: ZoomLevel, focus: Date): { start: string; end: string } {
  switch (zoom) {
    case "year": {
      const y = focus.getFullYear();
      return { start: `${y}-01-01`, end: `${y}-12-31` };
    }
    case "month": {
      const y = focus.getFullYear();
      const m = focus.getMonth();
      const last = new Date(y, m + 1, 0);
      return {
        start: `${y}-${String(m + 1).padStart(2, "0")}-01`,
        end: toDateStr(last),
      };
    }
    case "week": {
      const mon = getMonday(focus);
      const sun = addDays(mon, 6);
      return { start: toDateStr(mon), end: toDateStr(sun) };
    }
    case "day":
      return { start: toDateStr(focus), end: toDateStr(focus) };
  }
}

export default function PlanPage() {
  const [zoom, setZoom] = useState<ZoomLevel>("day");
  const [focusDate, setFocusDate] = useState(() => new Date());
  const [data, setData] = useState<{ events: PlanEvent[]; habits: HabitMap } | null>(null);
  const [loading, setLoading] = useState(true);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const range = useMemo(() => getDateRange(zoom, focusDate), [zoom, focusDate]);

  const fetchData = useCallback(() => {
    fetch(`/api/plan/range?start=${range.start}&end=${range.end}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch plan");
        return res.json();
      })
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [range.start, range.end]);

  const fetchTodos = useCallback(() => {
    fetch("/api/todos")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch todos");
        return res.json();
      })
      .then((t) => setTodos(t))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  const navigate = useCallback(
    (direction: -1 | 1) => {
      setFocusDate((prev) => {
        const d = new Date(prev);
        switch (zoom) {
          case "year":
            d.setFullYear(d.getFullYear() + direction);
            break;
          case "month":
            d.setMonth(d.getMonth() + direction);
            break;
          case "week":
            d.setDate(d.getDate() + direction * 7);
            break;
          case "day":
            d.setDate(d.getDate() + direction);
            break;
        }
        return d;
      });
    },
    [zoom]
  );

  const handleZoom = useCallback((date: Date, level: ZoomLevel) => {
    setFocusDate(date);
    setZoom(level);
  }, []);

  const title = useMemo(() => {
    switch (zoom) {
      case "year":
        return String(focusDate.getFullYear());
      case "month":
        return focusDate.toLocaleString("en-US", { month: "long", year: "numeric" });
      case "week": {
        const mon = getMonday(focusDate);
        const sun = addDays(mon, 6);
        const fmt = (d: Date) =>
          d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        return `${fmt(mon)} – ${fmt(sun)}, ${mon.getFullYear()}`;
      }
      case "day":
        return focusDate.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        });
    }
  }, [zoom, focusDate]);

  const breadcrumbs = useMemo(() => {
    const items: { label: string; level: ZoomLevel }[] = [];
    items.push({ label: String(focusDate.getFullYear()), level: "year" });
    if (zoom !== "year") {
      items.push({
        label: focusDate.toLocaleString("en-US", { month: "short" }),
        level: "month",
      });
    }
    if (zoom === "week" || zoom === "day") {
      const mon = getMonday(focusDate);
      const fmt = (d: Date) =>
        d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      items.push({ label: `Week of ${fmt(mon)}`, level: "week" });
    }
    if (zoom === "day") {
      items.push({
        label: focusDate.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        }),
        level: "day",
      });
    }
    return items;
  }, [zoom, focusDate]);

  const incompleteCount = todos.filter((t) => t.done === 0).length;

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <div className="p-4 sm:p-6">
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1 text-sm mb-2">
            {breadcrumbs.map((bc, i) => (
              <span key={bc.level} className="flex items-center gap-1">
                {i > 0 && <span className="text-zinc-700">/</span>}
                <button
                  onClick={() => handleZoom(focusDate, bc.level)}
                  className={
                    i === breadcrumbs.length - 1
                      ? "text-zinc-300"
                      : "text-zinc-400 hover:text-zinc-300"
                  }
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
                onClick={() => handleZoom(new Date(), "day")}
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
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <p className="text-zinc-400">Loading...</p>
              </div>
            ) : data ? (
              <>
                {zoom === "year" && (
                  <YearView
                    events={data.events}
                    habits={data.habits}
                    focusDate={focusDate}
                    onNavigate={handleZoom}
                  />
                )}
                {zoom === "month" && (
                  <MonthView
                    events={data.events}
                    habits={data.habits}
                    focusDate={focusDate}
                    onNavigate={handleZoom}
                  />
                )}
                {zoom === "week" && (
                  <WeekView
                    events={data.events}
                    habits={data.habits}
                    focusDate={focusDate}
                    onNavigate={handleZoom}
                  />
                )}
                {zoom === "day" && (
                  <DayView
                    events={data.events}
                    habits={data.habits}
                    focusDate={focusDate}
                    onRefresh={() => { fetchData(); fetchTodos(); }}
                    todos={todos}
                    onTodosChange={setTodos}
                  />
                )}
              </>
            ) : (
              <div className="flex items-center justify-center py-20">
                <p className="text-red-400">Failed to load data</p>
              </div>
            )}
          </div>
        </div>
      {/* Todos slide-out panel */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div
        className={`fixed right-0 top-0 bottom-0 w-[40rem] max-w-[95vw] bg-zinc-900/60 backdrop-blur-md border-l border-white/10 z-50 flex flex-col transform transition-transform ${
          sidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <span className="text-sm font-medium text-zinc-300">Todos</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-zinc-400 hover:text-zinc-300 text-sm"
          >
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
