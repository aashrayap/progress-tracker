"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import YearView from "../components/YearView";
import MonthView from "../components/MonthView";
import WeekView from "../components/WeekView";
import DayView from "../components/DayView";
import TodoSidebar from "../components/TodoSidebar";

export type ZoomLevel = "year" | "month" | "week" | "day";

export interface PlanEvent {
  date: string;
  start: number;
  end: number;
  item: string;
  done: string;
  notes: string;
}

export type HabitMap = Record<string, Record<string, boolean>>;

export interface Todo {
  id: number;
  item: string;
  done: number;
  created: string;
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

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
  const [zoom, setZoom] = useState<ZoomLevel>("week");
  const [focusDate, setFocusDate] = useState(() => new Date());
  const [data, setData] = useState<{ events: PlanEvent[]; habits: HabitMap } | null>(null);
  const [loading, setLoading] = useState(true);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const range = useMemo(() => getDateRange(zoom, focusDate), [zoom, focusDate]);

  const fetchData = useCallback(() => {
    setLoading(true);
    fetch(`/api/plan/range?start=${range.start}&end=${range.end}`)
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [range.start, range.end]);

  const fetchTodos = useCallback(() => {
    fetch("/api/todos")
      .then((res) => res.json())
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="flex h-screen">
        {/* Main content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto p-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1 text-sm mb-2">
              <a href="/" className="text-zinc-500 hover:text-zinc-300">
                Dashboard
              </a>
              {breadcrumbs.map((bc, i) => (
                <span key={bc.level} className="flex items-center gap-1">
                  <span className="text-zinc-700">/</span>
                  <button
                    onClick={() => handleZoom(focusDate, bc.level)}
                    className={
                      i === breadcrumbs.length - 1
                        ? "text-zinc-300"
                        : "text-zinc-500 hover:text-zinc-300"
                    }
                  >
                    {bc.label}
                  </button>
                </span>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => navigate(-1)}
                className="px-3 py-1.5 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 text-sm"
              >
                &#9668;
              </button>
              <h1 className="text-xl font-semibold flex-1">{title}</h1>
              <button
                onClick={() => navigate(1)}
                className="px-3 py-1.5 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 text-sm"
              >
                &#9658;
              </button>
              <button
                onClick={() => handleZoom(new Date(), "week")}
                className="px-3 py-1.5 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 text-sm"
              >
                Today
              </button>
              {/* Mobile sidebar toggle */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden px-3 py-1.5 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 text-sm relative"
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
                <p className="text-zinc-500">Loading...</p>
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

        {/* Desktop sidebar — always visible */}
        <div className="hidden lg:flex w-72 border-l border-zinc-800 bg-zinc-900/30 flex-col">
          <TodoSidebar todos={todos} onTodosChange={setTodos} />
        </div>

        {/* Mobile sidebar — slide-out overlay */}
        {sidebarOpen && (
          <>
            <div
              className="lg:hidden fixed inset-0 bg-black/50 z-40"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="lg:hidden fixed right-0 top-0 bottom-0 w-80 bg-zinc-900 border-l border-zinc-800 z-50 flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                <span className="text-sm font-medium text-zinc-300">Todos</span>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="text-zinc-500 hover:text-zinc-300 text-sm"
                >
                  x
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <TodoSidebar todos={todos} onTodosChange={setTodos} hideHeader />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
