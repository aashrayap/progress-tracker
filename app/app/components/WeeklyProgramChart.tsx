"use client";

import { useMemo } from "react";
import type { ProgramDay, PairLabel } from "../lib/config";
import { toDateStr } from "../lib/utils";
import { getWeekStart } from "../lib/date-utils";

interface WeeklyProgramChartProps {
  weeklyProgram: ProgramDay[];
  gymCompletionByDate: string[];
  selectedDayKey: string | null;
  onSelectDay: (key: string) => void;
}

const PAIR_STYLES: Record<PairLabel, { stripe: string; bg: string }> = {
  A:        { stripe: "bg-violet-500", bg: "bg-violet-500/10" },
  B:        { stripe: "bg-amber-500",  bg: "bg-amber-500/10"  },
  finisher: { stripe: "",              bg: "bg-zinc-800/60"   },
};

const DAY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getWeekDates(): Record<string, string> {
  const monday = getWeekStart();
  const dates: Record<string, string> = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates[DAY_ORDER[i]] = toDateStr(d);
  }
  return dates;
}

export default function WeeklyProgramChart({
  weeklyProgram,
  gymCompletionByDate,
  selectedDayKey,
  onSelectDay,
}: WeeklyProgramChartProps) {
  const todayStr = toDateStr(new Date());
  const weekDates = useMemo(getWeekDates, []);
  const completionSet = useMemo(() => new Set(gymCompletionByDate), [gymCompletionByDate]);

  const programByKey = useMemo(() => {
    const map: Record<string, ProgramDay> = {};
    for (const day of weeklyProgram) map[day.key] = day;
    return map;
  }, [weeklyProgram]);

  return (
    <div className="flex overflow-x-auto snap-x snap-mandatory gap-2 pb-3 scrollbar-hide">
      {DAY_ORDER.map((dayKey) => {
        const day = programByKey[dayKey];
        if (!day) return null;

        const dateStr = weekDates[dayKey];
        const dateNum = dateStr ? new Date(dateStr + "T12:00:00").getDate() : "";
        const isToday = dateStr === todayStr;
        const isCompleted = dateStr ? completionSet.has(dateStr) : false;
        const isSelected = dayKey === selectedDayKey;

        // Group exercises by pair for rendering
        const pairGroups: { pair: PairLabel; exercises: typeof day.exercises }[] = [];
        let currentPair: PairLabel | null = null;
        for (const ex of day.exercises) {
          if (ex.pair !== currentPair) {
            currentPair = ex.pair;
            pairGroups.push({ pair: ex.pair, exercises: [] });
          }
          pairGroups[pairGroups.length - 1].exercises.push(ex);
        }

        return (
          <div
            key={dayKey}
            onClick={() => onSelectDay(dayKey)}
            className={[
              "relative flex flex-col min-w-[140px] rounded-xl border overflow-hidden cursor-pointer snap-start shrink-0",
              isToday
                ? "bg-zinc-800 border-blue-500/30 border-l-2 border-l-blue-500"
                : "bg-zinc-900/60 border-white/10",
              isSelected ? "ring-1 ring-zinc-500" : "",
              day.isRest ? "opacity-60" : "",
            ].filter(Boolean).join(" ")}
          >
            {/* Header */}
            <div className="px-2 pt-2 pb-1.5 flex items-center justify-between border-b border-white/5">
              <span className={`text-[11px] font-medium ${isToday ? "text-blue-400" : "text-zinc-500"}`}>
                {dayKey}
              </span>
              <div className="flex items-center gap-1.5">
                {isCompleted && (
                  <span className="text-[10px] text-emerald-400">✓</span>
                )}
                <span
                  className={
                    isToday
                      ? "text-xs font-bold text-blue-400 bg-blue-500/20 rounded-full px-1.5 py-0.5"
                      : "text-xs text-zinc-500"
                  }
                >
                  {dateNum}
                </span>
              </div>
            </div>

            {/* Exercises or Rest */}
            <div className="px-1.5 py-1.5 space-y-1 flex-1">
              {day.isRest ? (
                <p className="text-xs text-zinc-600 text-center py-4">Rest</p>
              ) : (
                pairGroups.map((group, gi) => {
                  const styles = PAIR_STYLES[group.pair];
                  return (
                    <div key={gi} className={`relative rounded overflow-hidden ${styles.bg}`}>
                      {styles.stripe && (
                        <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${styles.stripe}`} />
                      )}
                      <div className={styles.stripe ? "pl-2" : ""}>
                        {group.exercises.map((ex, ei) => (
                          <div
                            key={ei}
                            className={[
                              "px-1.5 py-1",
                              ei < group.exercises.length - 1 ? "border-b border-white/5" : "",
                            ].filter(Boolean).join(" ")}
                          >
                            <p
                              className={`text-xs truncate leading-tight ${
                                isCompleted ? "text-zinc-500" : "text-zinc-200"
                              }`}
                            >
                              {ex.name}
                            </p>
                            <p className="text-[10px] text-zinc-500 mt-0.5">{ex.scheme}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
