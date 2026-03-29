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

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function MonthView({ events, habits, focusDate, onNavigate }: Props) {
  const year = focusDate.getFullYear();
  const month = focusDate.getMonth();
  const todayStr = toDateStr(new Date());

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDow = new Date(year, month, 1).getDay();
  const paddingBefore = startDow;

  const cells: (Date | null)[] = [];
  for (let i = 0; i < paddingBefore; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  const eventsByDate: Record<string, PlanEvent[]> = {};
  for (const e of events) {
    if (!eventsByDate[e.date]) eventsByDate[e.date] = [];
    eventsByDate[e.date].push(e);
  }

  return (
    <div>
      {/* Day headers */}
      <div className="-ml-4 sm:-ml-6 grid grid-cols-[calc(24px+1rem)_repeat(7,1fr)] sm:grid-cols-[calc(24px+1.5rem)_repeat(7,1fr)] gap-1 mb-1">
        <div />
        {DAY_NAMES.map((name) => (
          <div key={name} className="text-center text-xs text-zinc-600 py-1">
            {name}
          </div>
        ))}
      </div>

      {/* Week rows */}
      <div className="space-y-1">
        {weeks.map((week, wi) => {
          const firstDay = week.find((d) => d !== null);
          const weekMonday = firstDay ? getWeekStart(firstDay) : null;

          return (
            <div key={wi} className="-ml-4 sm:-ml-6 grid grid-cols-[calc(24px+1rem)_repeat(7,1fr)] sm:grid-cols-[calc(24px+1.5rem)_repeat(7,1fr)] gap-1">
              {/* Week arrow */}
              <button
                onClick={() => weekMonday && onNavigate(weekMonday, "week")}
                className="flex items-center justify-center text-zinc-500 hover:text-zinc-200 transition-colors rounded hover:bg-white/5"
                title="View week"
              >
                <span className="text-sm">›</span>
              </button>

              {week.map((date, di) => {
                if (!date) {
                  return (
                    <div
                      key={`empty-${wi}-${di}`}
                      className="h-24 rounded bg-zinc-900/60 backdrop-blur-md/30"
                    />
                  );
                }

                const dateStr = toDateStr(date);
                const isToday = dateStr === todayStr;
                const dayEvents = eventsByDate[dateStr] || [];
                const dayHabits = habits[dateStr] || {};
                const hasHabits = Object.keys(dayHabits).length > 0;

                const habitValues = Object.values(dayHabits);
                const habitScore =
                  habitValues.length > 0
                    ? habitValues.filter(Boolean).length / habitValues.length
                    : -1;

                return (
                  <div
                    key={dateStr}
                    className={`h-24 rounded border p-1.5 cursor-pointer hover:border-zinc-600 transition-colors overflow-hidden ${
                      isToday
                        ? "bg-blue-500/5 border-blue-500/30"
                        : "bg-zinc-900/60 backdrop-blur-md border-white/10"
                    }`}
                    onClick={() => onNavigate(date, "day")}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-xs font-medium ${
                          isToday ? "text-blue-400" : "text-zinc-400"
                        }`}
                      >
                        {date.getDate()}
                      </span>
                      {hasHabits && (
                        <span
                          className={`w-2 h-2 rounded-full ${
                            habitScore >= 0.8
                              ? "bg-emerald-400"
                              : habitScore >= 0.5
                                ? "bg-teal-500"
                                : habitScore >= 0
                                  ? "bg-red-500"
                                  : "bg-zinc-700"
                          }`}
                        />
                      )}
                    </div>
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 3).map((e, idx) => (
                        <div
                          key={`${e.date}-${e.start}-${e.end}-${e.item}-${idx}`}
                          className={`text-[10px] truncate px-1 rounded ${
                            e.start === 0 && e.end === 0
                              ? "bg-purple-500/10 text-purple-300"
                              : "bg-zinc-800 text-zinc-300"
                          }`}
                        >
                          {e.item}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="text-[10px] text-zinc-600">
                          +{dayEvents.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
