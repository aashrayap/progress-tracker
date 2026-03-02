"use client";

import type { ZoomLevel, PlanEvent, HabitMap } from "../lib/types";

interface Props {
  events: PlanEvent[];
  habits: HabitMap;
  focusDate: Date;
  onNavigate: (date: Date, zoom: ZoomLevel) => void;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function YearView({ events, habits, focusDate, onNavigate }: Props) {
  const year = focusDate.getFullYear();
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const eventsByMonth: Record<number, PlanEvent[]> = {};
  for (const e of events) {
    const m = parseInt(e.date.split("-")[1]) - 1;
    if (!eventsByMonth[m]) eventsByMonth[m] = [];
    eventsByMonth[m].push(e);
  }

  const habitsByMonth: Record<number, { total: number; good: number }> = {};
  for (const [date, h] of Object.entries(habits)) {
    const m = parseInt(date.split("-")[1]) - 1;
    if (!habitsByMonth[m]) habitsByMonth[m] = { total: 0, good: 0 };
    for (const v of Object.values(h)) {
      habitsByMonth[m].total++;
      if (v) habitsByMonth[m].good++;
    }
  }

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 min-h-[calc(100vh-10rem)]">
      {MONTH_NAMES.map((name, i) => {
        const monthEvents = eventsByMonth[i] || [];
        const visibleMonthEvents = monthEvents.filter((e) => e.item.trim() !== "PTO - B Schedule");
        const habitData = habitsByMonth[i];
        const isCurrent = i === currentMonth && year === currentYear;

        return (
          <div
            key={name}
            onClick={() => onNavigate(new Date(year, i, 1), "month")}
            className={`p-4 rounded-xl border cursor-pointer hover:border-zinc-600 transition-colors ${
              isCurrent
                ? "bg-blue-500/5 border-blue-500/30"
                : "bg-zinc-900/60 backdrop-blur-md border-white/10"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h3
                className={`text-sm font-medium ${
                  isCurrent ? "text-blue-400" : "text-zinc-300"
                }`}
              >
                {name}
              </h3>
              {habitData && habitData.total > 0 && (
                <span
                  className={`w-2 h-2 rounded-full ${
                    habitData.good / habitData.total >= 0.7
                      ? "bg-emerald-400"
                      : habitData.good / habitData.total >= 0.4
                        ? "bg-yellow-500"
                        : "bg-red-500"
                  }`}
                />
              )}
            </div>

            {visibleMonthEvents.length > 0 && visibleMonthEvents.length > 4 && (
              <p className="text-xs text-zinc-400 mb-2">
                {visibleMonthEvents.length} events
              </p>
            )}

            <div className="space-y-1">
              {visibleMonthEvents.slice(0, 4).map((e, idx) => {
                const isAllDay = e.start === 0 && e.end === 0;
                return (
                  <div
                    key={`${e.date}-${e.start}-${e.end}-${e.item}-${idx}`}
                    className={`text-[10px] px-1.5 py-0.5 rounded truncate ${
                      isAllDay
                        ? "bg-purple-500/10 text-purple-300 border border-purple-500/20"
                        : "bg-zinc-800 text-zinc-300 border border-zinc-700"
                    }`}
                  >
                    {e.item}
                  </div>
                );
              })}
              {visibleMonthEvents.length > 4 && (
                <p className="text-[10px] text-zinc-500">
                  +{visibleMonthEvents.length - 4} more
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
