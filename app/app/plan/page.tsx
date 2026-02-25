"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import YearView from "../components/YearView";
import MonthView from "../components/MonthView";
import WeekView from "../components/WeekView";
import DayView from "../components/DayView";

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

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-6xl mx-auto p-6">
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
            ◄
          </button>
          <h1 className="text-xl font-semibold flex-1">{title}</h1>
          <button
            onClick={() => navigate(1)}
            className="px-3 py-1.5 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 text-sm"
          >
            ►
          </button>
          <button
            onClick={() => handleZoom(new Date(), "week")}
            className="px-3 py-1.5 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 text-sm"
          >
            Today
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
                onRefresh={fetchData}
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
  );
}
