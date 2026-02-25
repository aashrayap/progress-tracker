"use client";

import type { ZoomLevel, PlanEvent, HabitMap } from "../plan/page";

interface Props {
  events: PlanEvent[];
  habits: HabitMap;
  focusDate: Date;
  onNavigate: (date: Date, zoom: ZoomLevel) => void;
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

function formatTime(t: number): string {
  const hour = Math.floor(t);
  const min = t % 1 === 0.5 ? ":30" : "";
  const ampm = hour >= 12 ? "p" : "a";
  const h = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${h}${min}${ampm}`;
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
    <div className="grid grid-cols-7 gap-1.5" style={{ minHeight: "calc(100vh - 160px)" }}>
      {days.map((day) => {
        const dateStr = toDateStr(day);
        const isToday = dateStr === todayStr;
        const dayEvents = events.filter((e) => e.date === dateStr);
        const dayHabits = habits[dateStr] || {};
        const timedEvents = dayEvents
          .filter((e) => !(e.start === 0 && e.end === 0))
          .sort((a, b) => a.start - b.start);
        const allDayEvents = dayEvents.filter((e) => e.start === 0 && e.end === 0);

        return (
          <div
            key={dateStr}
            className={`rounded-lg border p-2 cursor-pointer hover:border-zinc-600 transition-colors flex flex-col ${
              isToday
                ? "bg-blue-500/5 border-blue-500/30"
                : "bg-zinc-900 border-zinc-800"
            }`}
            onClick={() => onNavigate(day, "day")}
          >
            {/* Day header */}
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-[11px] text-zinc-500">
                  {day.toLocaleDateString("en-US", { weekday: "short" })}
                </span>
                <span
                  className={`ml-1 text-sm font-medium ${
                    isToday ? "text-blue-400" : "text-zinc-300"
                  }`}
                >
                  {day.getDate()}
                </span>
              </div>
              {/* Compact habit summary */}
              {Object.keys(dayHabits).length > 0 && (
                <div className="flex gap-0.5">
                  {HABIT_KEYS.map((key) => {
                    if (dayHabits[key] === undefined) return null;
                    const isGood = dayHabits[key];
                    return (
                      <span
                        key={key}
                        className={`w-3 h-3 rounded-full text-[7px] flex items-center justify-center font-bold ${
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
            {allDayEvents.map((e) => (
              <div
                key={e.item}
                className="text-[11px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 mb-1 truncate"
              >
                {e.item}
              </div>
            ))}

            {/* Timed events — fill remaining space */}
            <div className="space-y-0.5 flex-1">
              {timedEvents.map((e) => (
                <div key={e.item} className="text-[11px] leading-tight">
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

            {/* Day stats footer */}
            {timedEvents.length > 0 && (
              <div className="mt-auto pt-1 border-t border-zinc-800/50">
                <span className="text-[10px] text-zinc-600">
                  {timedEvents.filter((e) => e.done === "1").length}/{timedEvents.length} done
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
