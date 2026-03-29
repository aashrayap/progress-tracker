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

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_HEADERS = ["M", "T", "W", "T", "F", "S", "S"];

function getMonthWeeks(year: number, month: number): (Date | null)[][] {
  const weeks: (Date | null)[][] = [];
  const lastDay = new Date(year, month + 1, 0).getDate();
  const firstDow = new Date(year, month, 1).getDay();
  const mondayOffset = firstDow === 0 ? 6 : firstDow - 1;

  let week: (Date | null)[] = Array(mondayOffset).fill(null);

  for (let d = 1; d <= lastDay; d++) {
    week.push(new Date(year, month, d));
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  return weeks;
}

export default function YearView({ events, habits, focusDate, onNavigate }: Props) {
  const year = focusDate.getFullYear();
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const todayStr = toDateStr(new Date());

  const eventsByDate: Record<string, number> = {};
  for (const e of events) {
    if (e.item.trim() === "PTO - B Schedule") continue;
    eventsByDate[e.date] = (eventsByDate[e.date] || 0) + 1;
  }


  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 min-h-[calc(100vh-10rem)]">
      {MONTH_NAMES.map((name, i) => {
        const isCurrent = i === currentMonth && year === currentYear;
        const weeks = getMonthWeeks(year, i);

        return (
          <div
            key={name}
            className={`p-3 rounded-xl border ${
              isCurrent
                ? "bg-blue-500/5 border-blue-500/30"
                : "bg-zinc-900/60 backdrop-blur-md border-white/10"
            }`}
          >
            {/* Month header — click to month view */}
            <div className="flex items-center justify-between mb-1.5">
              <button
                onClick={() => onNavigate(new Date(year, i, 1), "month")}
                className={`text-sm font-medium hover:underline ${
                  isCurrent ? "text-blue-400" : "text-zinc-300"
                }`}
              >
                {name}
              </button>
            </div>

            {/* Day headers */}
            <div className="flex mb-0.5">
              <div className="w-4 shrink-0" />
              {DAY_HEADERS.map((d, di) => (
                <div key={di} className="flex-1 text-center text-[8px] text-zinc-600">
                  {d}
                </div>
              ))}
            </div>

            {/* Week rows — each clickable to week view */}
            {weeks.map((week, wi) => {
              const firstDay = week.find((d) => d !== null);
              if (!firstDay) return null;
              const weekMonday = getWeekStart(firstDay);
              const weekHasEvents = week.some((d) => d && eventsByDate[toDateStr(d)]);

              return (
                <div
                  key={wi}
                  onClick={() => onNavigate(weekMonday, "week")}
                  className="group flex items-center cursor-pointer hover:bg-white/5 rounded transition-colors"
                >
                  <span className="w-4 shrink-0 text-[11px] flex items-center justify-center text-zinc-500 group-hover:text-zinc-300">
                    ›
                  </span>
                  {week.map((day, di) => {
                    if (!day) return <div key={di} className="flex-1" />;
                    const ds = toDateStr(day);
                    const isToday = ds === todayStr;
                    const hasEvents = Boolean(eventsByDate[ds]);
                    return (
                      <div key={di} className="flex-1 text-center py-px">
                        <span
                          className={`text-[9px] leading-none ${
                            isToday
                              ? "text-blue-400 font-bold"
                              : hasEvents
                                ? "text-zinc-300"
                                : "text-zinc-600"
                          }`}
                        >
                          {day.getDate()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
