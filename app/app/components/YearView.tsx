"use client";

import type { ZoomLevel, PlanEvent, HabitMap } from "../plan/page";

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
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
      {MONTH_NAMES.map((name, i) => {
        const monthEvents = eventsByMonth[i] || [];
        const allDayEvents = monthEvents.filter(
          (e) => e.start === 0 && e.end === 0
        );
        const timedCount = monthEvents.length - allDayEvents.length;
        const habitData = habitsByMonth[i];
        const isCurrent = i === currentMonth && year === currentYear;

        return (
          <div
            key={name}
            onClick={() => onNavigate(new Date(year, i, 1), "month")}
            className={`p-4 rounded-lg border cursor-pointer hover:border-zinc-600 transition-colors ${
              isCurrent
                ? "bg-blue-500/5 border-blue-500/30"
                : "bg-zinc-900 border-zinc-800"
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

            {monthEvents.length > 0 && (
              <p className="text-xs text-zinc-500 mb-2">
                {timedCount > 0 &&
                  `${timedCount} event${timedCount > 1 ? "s" : ""}`}
                {timedCount > 0 && allDayEvents.length > 0 && " · "}
                {allDayEvents.length > 0 &&
                  `${allDayEvents.length} all-day`}
              </p>
            )}

            <div className="space-y-1">
              {allDayEvents.slice(0, 3).map((e) => (
                <div
                  key={e.item}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 truncate"
                >
                  {e.item}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
