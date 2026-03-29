"use client";

import { createContext, useContext, useState, useEffect, useMemo, useCallback, type ReactNode } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import type { PlanEvent, HabitMap, Todo, ZoomLevel } from "../lib/types";
import { toDateStr } from "../lib/utils";
import { getWeekStart } from "../lib/date-utils";

interface PlanContextType {
  zoom: ZoomLevel;
  focusDate: Date;
  events: PlanEvent[];
  habits: HabitMap;
  todos: Todo[];
  setTodos: (todos: Todo[]) => void;
  loading: boolean;
  goTo: (date: Date, zoom: ZoomLevel) => void;
  navigate: (direction: -1 | 1) => void;
  refresh: () => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const PlanContext = createContext<PlanContextType | null>(null);

export function usePlan() {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error("usePlan must be within PlanProvider");
  return ctx;
}

function zoomFromPath(pathname: string): ZoomLevel {
  if (pathname.endsWith("/year")) return "year";
  if (pathname.endsWith("/month")) return "month";
  if (pathname.endsWith("/week")) return "week";
  return "day";
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
      const mon = getWeekStart(focus);
      const sun = addDays(mon, 6);
      return { start: toDateStr(mon), end: toDateStr(sun) };
    }
    case "day":
      return { start: toDateStr(focus), end: toDateStr(focus) };
  }
}

export function PlanProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const zoom = zoomFromPath(pathname);
  const focusDate = useMemo(() => {
    const d = searchParams.get("d");
    if (d) {
      const parsed = new Date(d + "T00:00:00");
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  }, [searchParams]);

  const [data, setData] = useState<{ events: PlanEvent[]; habits: HabitMap }>({ events: [], habits: {} });
  const [loading, setLoading] = useState(true);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const range = useMemo(() => getDateRange(zoom, focusDate), [zoom, focusDate]);

  const fetchData = useCallback(() => {
    setLoading(true);
    fetch(`/api/plan/range?start=${range.start}&end=${range.end}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch plan");
        return res.json();
      })
      .then((d) => { setData(d); setLoading(false); })
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

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchTodos(); }, [fetchTodos]);

  const goTo = useCallback((date: Date, level: ZoomLevel) => {
    router.push(`/plan/${level}?d=${toDateStr(date)}`);
  }, [router]);

  const navigate = useCallback((direction: -1 | 1) => {
    const d = new Date(focusDate);
    switch (zoom) {
      case "year": d.setFullYear(d.getFullYear() + direction); break;
      case "month": d.setMonth(d.getMonth() + direction); break;
      case "week": d.setDate(d.getDate() + direction * 7); break;
      case "day": d.setDate(d.getDate() + direction); break;
    }
    router.push(`/plan/${zoom}?d=${toDateStr(d)}`);
  }, [focusDate, zoom, router]);

  const refresh = useCallback(() => { fetchData(); fetchTodos(); }, [fetchData, fetchTodos]);

  return (
    <PlanContext.Provider value={{
      zoom, focusDate, events: data.events, habits: data.habits,
      todos, setTodos, loading, goTo, navigate, refresh,
      sidebarOpen, setSidebarOpen,
    }}>
      {children}
    </PlanContext.Provider>
  );
}
