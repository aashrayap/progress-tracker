"use client";

import { useState, useCallback } from "react";
import SchedulerModal from "./SchedulerModal";
import type { PlanEvent, HabitMap, Todo } from "../lib/types";
import { toDateStr, formatTime } from "../lib/utils";

interface Props {
  events: PlanEvent[];
  habits: HabitMap;
  focusDate: Date;
  onRefresh: () => void;
  todos?: Todo[];
  onTodosChange?: (todos: Todo[]) => void;
}

const HABIT_DISPLAY: Record<string, string> = {
  weed: "No Weed",
  lol: "No LoL",
  poker: "No Poker",
  gym: "Gym",
  sleep: "Sleep",
  meditate: "Meditate",
  deep_work: "Deep Work",
  ate_clean: "Ate Clean",
};

export default function DayView({ events, habits, focusDate, onRefresh, todos: externalTodos, onTodosChange }: Props) {
  const [editing, setEditing] = useState(false);
  const [localTodos, setLocalTodos] = useState<Todo[]>([]);
  const dateStr = toDateStr(focusDate);
  const todayStr = toDateStr(new Date());
  const isToday = dateStr === todayStr;
  const dayHabits = habits[dateStr] || {};
  const dayEvents = events
    .filter((e) => e.date === dateStr)
    .sort((a, b) => a.start - b.start);
  const timedEvents = dayEvents.filter((e) => !(e.start === 0 && e.end === 0));
  const allDayEvents = dayEvents.filter((e) => e.start === 0 && e.end === 0);

  const todosForModal = externalTodos ?? localTodos;
  const plannedGym = dayEvents.some((e) => /gym/i.test(e.item));
  const gymDone = dayHabits.gym === true;
  const gymReconciliation = gymDone
    ? plannedGym
      ? "planned_done"
      : "unplanned_done"
    : plannedGym
      ? "planned_missed"
      : "not_planned";

  const handleEdit = useCallback(async () => {
    if (!externalTodos) {
      const res = await fetch("/api/todos");
      if (!res.ok) throw new Error("Failed to fetch todos");
      const data = await res.json();
      setLocalTodos(data);
    }
    setEditing(true);
  }, [externalTodos]);

  const handleSchedulerClose = useCallback(() => {
    setEditing(false);
    onRefresh();
  }, [onRefresh]);

  const setPlanDone = useCallback(
    async (event: PlanEvent, done: "1" | "0" | "") => {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: event.date,
          start: event.start,
          end: event.end,
          item: event.item,
          done,
          notes: event.notes,
        }),
      });
      if (!res.ok) return;
      onRefresh();
    },
    [onRefresh]
  );

  return (
    <>
      <div className="space-y-4">
        {/* Edit button for today */}
        {isToday && (
          <button
            onClick={handleEdit}
            className="px-4 py-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm hover:border-blue-400/50 transition-colors min-h-[44px]"
          >
            Edit Plan
          </button>
        )}

        {/* Habits */}
        {Object.keys(dayHabits).length > 0 && (
          <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800">
            <h3 className="text-xs text-zinc-500 uppercase tracking-wide mb-3">
              Habits
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(HABIT_DISPLAY).map(([key, label]) => {
                if (dayHabits[key] === undefined) return null;
                const isGood = dayHabits[key];
                return (
                  <div
                    key={key}
                    className={`flex items-center gap-2 text-sm px-3 py-2 rounded min-h-[44px] ${
                      isGood ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    <span>{isGood ? "✓" : "✗"}</span>
                    <span>{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Plan vs Actual (gym) */}
        {(plannedGym || gymDone) && (
          <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800">
            <h3 className="text-xs text-zinc-500 uppercase tracking-wide mb-2">
              Plan vs Actual
            </h3>
            <p
              className={`text-sm ${
                gymReconciliation === "planned_done"
                  ? "text-emerald-400"
                  : gymReconciliation === "planned_missed"
                    ? "text-red-400"
                    : "text-amber-400"
              }`}
            >
              {gymReconciliation === "planned_done" && "Gym: planned + done"}
              {gymReconciliation === "planned_missed" && "Gym: planned + missed"}
              {gymReconciliation === "unplanned_done" && "Gym: unplanned + done"}
            </p>
          </div>
        )}

        {/* All-day events */}
        {allDayEvents.length > 0 && (
          <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800">
            <h3 className="text-xs text-zinc-500 uppercase tracking-wide mb-3">
              All Day
            </h3>
            <div className="space-y-2">
              {allDayEvents.map((e, idx) => (
                <div
                  key={`${e.date}-${e.start}-${e.end}-${e.item}-${idx}`}
                  className="flex items-center gap-3 p-2 rounded bg-purple-500/10 border border-purple-500/20"
                >
                  <span className="text-sm text-purple-300">{e.item}</span>
                  {e.notes && (
                    <span className="text-xs text-zinc-500">{e.notes}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Schedule */}
        <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800">
          <h3 className="text-xs text-zinc-500 uppercase tracking-wide mb-3">
            Schedule
          </h3>
          {timedEvents.length === 0 ? (
            <p className="text-sm text-zinc-600">No scheduled events</p>
          ) : (
            <div className="space-y-2">
              {timedEvents.map((e, idx) => {
                const isDone = e.done === "1";
                const isSkipped = e.done === "0";
                return (
                  <div
                    key={`${e.date}-${e.start}-${e.end}-${e.item}-${idx}`}
                    className="flex items-center gap-3 py-2 border-b border-zinc-800 last:border-0 min-h-[44px]"
                  >
                    <button
                      onClick={() => setPlanDone(e, isDone ? "" : "1")}
                      className={`w-6 h-6 rounded border flex items-center justify-center text-xs ${
                        isDone
                          ? "border-green-600 text-green-400"
                          : isSkipped
                            ? "border-red-600 text-red-400"
                            : "border-zinc-700 text-zinc-600"
                      }`}
                    >
                      {isDone ? "✓" : isSkipped ? "✗" : "○"}
                    </button>
                    <span className="text-xs text-zinc-500 w-24">
                      {formatTime(e.start)}–{formatTime(e.end)}
                    </span>
                    <span
                      className={`text-sm ${
                        isDone
                          ? "text-zinc-500 line-through"
                          : "text-zinc-300"
                      }`}
                    >
                      {e.item}
                    </span>
                    {e.notes && (
                      <span className="text-xs text-zinc-500">
                        — {e.notes}
                      </span>
                    )}
                    {!isDone && (
                      <button
                        onClick={() => setPlanDone(e, "0")}
                        className="ml-auto text-[10px] text-zinc-500 hover:text-red-400"
                      >
                        skip
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Scheduler overlay (today only) */}
      {editing && (
        <SchedulerModal
          initialPlan={dayEvents.map((e) => ({
            start: e.start,
            end: e.end,
            item: e.item,
            done: e.done,
            notes: e.notes,
          }))}
          initialTodos={todosForModal}
          onClose={handleSchedulerClose}
          onTodosChange={onTodosChange}
        />
      )}
    </>
  );
}
