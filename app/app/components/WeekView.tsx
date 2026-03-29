"use client";

import type { ZoomLevel, PlanEvent, HabitMap } from "../lib/types";
import { toDateStr } from "../lib/utils";
import { getWeekStart } from "../lib/date-utils";

interface Props {
  events: PlanEvent[];
  habits: HabitMap;
  focusDate: Date;
  onNavigate: (date: Date, zoom: ZoomLevel) => void;
}

const GRID_START = 6;  // 6am
const GRID_END = 22;   // 10pm
const GRID_HOURS = GRID_END - GRID_START;

function formatHour(h: number): string {
  const ampm = h >= 12 ? "p" : "a";
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour}${ampm}`;
}

export default function WeekView({ events, habits, focusDate, onNavigate }: Props) {
  const monday = getWeekStart(focusDate);
  const todayStr = toDateStr(new Date());

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <>
      {/* Mobile: original card layout */}
      <div className="sm:hidden grid grid-cols-1 gap-1.5">
        {days.map((day) => {
          const dateStr = toDateStr(day);
          const isToday = dateStr === todayStr;
          const dayEvents = events.filter((e) => e.date === dateStr);
          const dayHabits = habits[dateStr] || {};
          const timedEvents = dayEvents.filter((e) => !(e.start === 0 && e.end === 0));
          const doneCount = timedEvents.filter((e) => e.done === "1").length;

          return (
            <div
              key={dateStr}
              className={`rounded-xl border p-3 cursor-pointer hover:border-zinc-600 transition-colors flex items-center justify-between min-h-[56px] ${
                isToday
                  ? "bg-blue-500/5 border-blue-500/30"
                  : "bg-zinc-900/60 backdrop-blur-md border-white/10"
              }`}
              onClick={() => onNavigate(day, "day")}
            >
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-zinc-400">
                  {day.toLocaleDateString("en-US", { weekday: "short" })}
                </span>
                <span className={`text-sm font-medium ${isToday ? "text-blue-400" : "text-zinc-300"}`}>
                  {day.getDate()}
                </span>
                {timedEvents.length > 0 && (
                  <span className="text-[10px] text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded-full">
                    {doneCount}/{timedEvents.length}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop: time grid */}
      <div className="hidden sm:grid grid-cols-[auto_repeat(7,1fr)] gap-0 min-h-[calc(100vh-160px)] border border-white/10 rounded-xl overflow-hidden">
        {/* Header row */}
        <div className="border-b border-white/10 p-1" /> {/* time axis corner */}
        {days.map((day) => {
          const dateStr = toDateStr(day);
          const isToday = dateStr === todayStr;
          return (
            <div
              key={dateStr}
              className={`border-b border-l border-white/10 p-2 cursor-pointer hover:bg-zinc-800/30 ${
                isToday ? "bg-blue-500/5" : ""
              }`}
              onClick={() => onNavigate(day, "day")}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-zinc-400">
                  {day.toLocaleDateString("en-US", { weekday: "short" })}
                </span>
                <span className={`text-sm font-medium ${isToday ? "text-blue-400" : "text-zinc-300"}`}>
                  {day.getDate()}
                </span>
              </div>
            </div>
          );
        })}

        {/* Time grid body */}
        <div className="flex flex-col">
          {Array.from({ length: GRID_HOURS }, (_, i) => (
            <div
              key={i}
              className="h-10 flex items-start justify-end pr-1.5 pt-0.5 border-b border-white/5"
            >
              <span className="text-[10px] text-zinc-600">{formatHour(GRID_START + i)}</span>
            </div>
          ))}
        </div>
        {days.map((day) => {
          const dateStr = toDateStr(day);
          const isToday = dateStr === todayStr;
          const dayEvents = events.filter((e) => e.date === dateStr);
          const timedEvents = dayEvents
            .filter((e) => !(e.start === 0 && e.end === 0))
            .sort((a, b) => a.start - b.start);

          return (
            <div
              key={dateStr}
              className={`relative border-l border-white/10 ${isToday ? "bg-blue-500/[0.03]" : ""}`}
            >
              {/* Hour grid lines */}
              {Array.from({ length: GRID_HOURS }, (_, i) => (
                <div key={i} className="h-10 border-b border-white/5" />
              ))}

              {/* Event blocks — absolutely positioned */}
              {timedEvents.map((e, idx) => {
                const clampedStart = Math.max(e.start, GRID_START);
                const clampedEnd = Math.min(e.end, GRID_END);
                if (clampedStart >= clampedEnd) return null;
                const top = ((clampedStart - GRID_START) / GRID_HOURS) * 100;
                const height = ((clampedEnd - clampedStart) / GRID_HOURS) * 100;
                const isDone = e.done === "1";

                return (
                  <div
                    key={`${e.date}-${e.start}-${e.end}-${e.item}-${idx}`}
                    className={`absolute left-0.5 right-0.5 rounded px-1 py-0.5 overflow-hidden border ${
                      isDone
                        ? "bg-emerald-500/30 border-emerald-500/20"
                        : "bg-zinc-700 border-white/10"
                    }`}
                    style={{ top: `${top}%`, height: `${height}%`, minHeight: "16px" }}
                    title={e.item}
                  >
                    <span className={`text-[10px] leading-tight line-clamp-2 ${isDone ? "text-emerald-300" : "text-zinc-200"}`}>
                      {e.item}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </>
  );
}
