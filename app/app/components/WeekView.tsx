"use client";

import type { ZoomLevel, PlanEvent, HabitMap } from "../lib/types";
import { toDateStr, formatTime } from "../lib/utils";

interface Props {
  events: PlanEvent[];
  habits: HabitMap;
  focusDate: Date;
  onNavigate: (date: Date, zoom: ZoomLevel) => void;
}

function getMonday(d: Date): Date {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = date.getDay();
  date.setDate(date.getDate() - day + (day === 0 ? -6 : 1));
  return date;
}

const HABIT_LABELS: Record<string, string> = {
  weed: "W",
  lol: "L",
  poker: "P",
  gym: "G",
  sleep: "S",
  meditate: "M",
  deep_work: "D",
  ate_clean: "E",
};

const HABIT_KEYS = Object.keys(HABIT_LABELS);

export default function WeekView({ events, habits, focusDate, onNavigate }: Props) {
  const monday = getMonday(focusDate);
  const todayStr = toDateStr(new Date());

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-7 gap-1.5 sm:min-h-[calc(100vh-160px)]">
      {days.map((day) => {
        const dateStr = toDateStr(day);
        const isToday = dateStr === todayStr;
        const dayEvents = events.filter((e) => e.date === dateStr);
        const dayHabits = habits[dateStr] || {};
        const timedEvents = dayEvents
          .filter((e) => !(e.start === 0 && e.end === 0))
          .sort((a, b) => a.start - b.start);
        const allDayEvents = dayEvents.filter((e) => e.start === 0 && e.end === 0);
        const doneCount = timedEvents.filter((e) => e.done === "1").length;

        return (
          <div
            key={dateStr}
            className={`rounded-lg border p-3 sm:p-2 cursor-pointer hover:border-zinc-600 transition-colors flex flex-col min-h-[56px] ${
              isToday
                ? "bg-blue-500/5 border-blue-500/30"
                : "bg-zinc-900 border-zinc-800"
            }`}
            onClick={() => onNavigate(day, "day")}
          >
            {/* Day header */}
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-zinc-500">
                  {day.toLocaleDateString("en-US", { weekday: "short" })}
                </span>
                <span
                  className={`text-sm font-medium ${
                    isToday ? "text-blue-400" : "text-zinc-300"
                  }`}
                >
                  {day.getDate()}
                </span>
                {/* Mobile: event count badge */}
                {timedEvents.length > 0 && (
                  <span className="sm:hidden text-[10px] text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded-full">
                    {doneCount}/{timedEvents.length}
                  </span>
                )}
              </div>
              {/* Habit dots */}
              {Object.keys(dayHabits).length > 0 && (
                <div className="flex gap-1 sm:gap-0.5">
                  {HABIT_KEYS.map((key) => {
                    if (dayHabits[key] === undefined) return null;
                    const isGood = dayHabits[key];
                    return (
                      <span
                        key={key}
                        className={`w-5 h-5 sm:w-3 sm:h-3 rounded-full text-[9px] sm:text-[7px] flex items-center justify-center font-bold ${
                          isGood
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                        title={`${key}: ${isGood ? "done" : "missed"}`}
                      >
                        {HABIT_LABELS[key]}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* All-day events */}
            {allDayEvents.map((e, idx) => (
              <div
                key={`${e.date}-${e.start}-${e.end}-${e.item}-${idx}`}
                className="text-[11px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 mb-1 truncate"
              >
                {e.item}
              </div>
            ))}

            {/* Timed events — hidden on mobile, shown on desktop */}
            <div className="hidden sm:block space-y-0.5 flex-1">
              {timedEvents.map((e, idx) => (
                <div key={`${e.date}-${e.start}-${e.end}-${e.item}-${idx}`} className="text-[11px] leading-tight">
                  <span className="text-zinc-600">{formatTime(e.start)}</span>
                  <span
                    className={`ml-1 ${
                      e.done === "1"
                        ? "text-zinc-600 line-through"
                        : "text-zinc-300"
                    }`}
                  >
                    {e.item}
                  </span>
                </div>
              ))}
            </div>

            {/* Day stats footer — desktop only */}
            {timedEvents.length > 0 && (
              <div className="hidden sm:block mt-auto pt-1 border-t border-zinc-800/50">
                <span className="text-[10px] text-zinc-600">
                  {doneCount}/{timedEvents.length} done
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
