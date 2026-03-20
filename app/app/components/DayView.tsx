"use client";

import { useState, useCallback, useEffect } from "react";
import SchedulerModal from "./SchedulerModal";
import PlanBlock from "./PlanBlock";
import NowLine, { getCurrentHour } from "./NowLine";
import type { PlanEvent, HabitMap, Todo, RitualBlueprint } from "../lib/types";
import { toDateStr } from "../lib/utils";

function getRitualPhase(): "morning" | "midday" | "evening" {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "midday";
  return "evening";
}

interface Props {
  events: PlanEvent[];
  habits: HabitMap;
  focusDate: Date;
  onRefresh: () => void;
  todos?: Todo[];
  onTodosChange?: (todos: Todo[]) => void;
}

interface IntentionSummary {
  date: string;
  domain: string;
  mantra: string;
}

export default function DayView({ events, focusDate, onRefresh, todos: externalTodos, onTodosChange }: Props) {
  const [editing, setEditing] = useState(false);
  const [localTodos, setLocalTodos] = useState<Todo[]>([]);
  const [dailyIntention, setDailyIntention] = useState<IntentionSummary | null>(null);
  const [weeklyIntention, setWeeklyIntention] = useState<IntentionSummary | null>(null);
  const [ritual, setRitual] = useState<RitualBlueprint | null>(null);
  const [ritualOpen, setRitualOpen] = useState(false);
  const dateStr = toDateStr(focusDate);
  const todayStr = toDateStr(new Date());
  const isToday = dateStr === todayStr;
  const dayEvents = events
    .filter((e) => e.date === dateStr)
    .sort((a, b) => a.start - b.start);
  const timedEvents = dayEvents.filter((e) => !(e.start === 0 && e.end === 0));
  const allDayEvents = dayEvents.filter((e) => e.start === 0 && e.end === 0);
  const hasIntentions = Boolean(dailyIntention?.mantra || weeklyIntention?.mantra);
  const currentHour = getCurrentHour();

  useEffect(() => {
    let active = true;

    fetch(`/api/plan/range?start=${dateStr}&end=${dateStr}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch intentions");
        return res.json();
      })
      .then((data) => {
        if (!active) return;
        setDailyIntention(data.dailyIntention ?? null);
        setWeeklyIntention(data.weeklyIntention ?? null);
      })
      .catch(() => {
        if (!active) return;
        setDailyIntention(null);
        setWeeklyIntention(null);
      });

    if (isToday) {
      fetch("/api/vision")
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch vision");
          return res.json();
        })
        .then((data) => {
          if (!active) return;
          setRitual(data.ritualBlueprint ?? null);
        })
        .catch(() => {
          if (!active) return;
          setRitual(null);
        });
    }

    return () => {
      active = false;
    };
  }, [dateStr, isToday]);

  const todosForModal = externalTodos ?? localTodos;

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
        {/* Edit button for today — disabled */}
        {isToday && (
          <button
            className="px-4 py-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm min-h-[44px] opacity-50 pointer-events-none"
          >
            Edit Plan
          </button>
        )}

        {/* All-day events */}
        {allDayEvents.length > 0 && (
          <div className="p-4 bg-zinc-900/60 backdrop-blur-md rounded-xl border border-white/10">
            <h3 className="text-xs text-zinc-400 uppercase tracking-wide mb-3">
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
                    <span className="text-xs text-zinc-400">{e.notes}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Intention banner */}
        {hasIntentions && (
          <div className="px-3 py-2 rounded-lg border border-cyan-400/20 bg-cyan-500/[0.06]">
            {weeklyIntention?.mantra && (
              <p className="text-xs text-zinc-500 italic">
                <span className="text-zinc-600 not-italic">This week:</span>{" "}
                {weeklyIntention.mantra}
              </p>
            )}
            {dailyIntention?.mantra && (
              <p className="text-sm text-zinc-300 italic mt-1">
                <span className="text-zinc-500 not-italic">Today:</span>{" "}
                {dailyIntention.mantra}
              </p>
            )}
          </div>
        )}

        {/* Ritual context strip — today only */}
        {isToday && ritual && (() => {
          const phase = getRitualPhase();
          const block = ritual[phase];
          if (!block?.steps?.length) return null;
          const label = phase.charAt(0).toUpperCase() + phase.slice(1);
          return (
            <div className="rounded-lg border border-white/5 bg-zinc-900/40 overflow-hidden">
              <button
                onClick={() => setRitualOpen((o) => !o)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-400"
              >
                <span className="text-zinc-500">{ritualOpen ? "\u25BC" : "\u25B6"}</span>
                <span>{label} Ritual{!ritualOpen ? ` (${block.steps.length} steps)` : ""}</span>
              </button>
              {ritualOpen && (
                <div className="px-3 pb-3 space-y-2">
                  <ol className="list-decimal list-inside space-y-0.5">
                    {block.steps.slice(0, 8).map((step, i) => (
                      <li key={i} className="text-sm text-zinc-400">{step}</li>
                    ))}
                  </ol>
                  {block.habitStacks?.length > 0 && (
                    <div className="space-y-0.5 pt-1">
                      {block.habitStacks.map((hs, i) => (
                        <p key={i} className="text-xs text-zinc-500 italic">{hs}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}

        {/* Schedule */}
        <div className="p-4 bg-zinc-900/60 backdrop-blur-md rounded-xl border border-white/10">
          <h3 className="text-xs text-zinc-400 uppercase tracking-wide mb-3">
            Schedule
          </h3>
          {timedEvents.length === 0 ? (
            <p className="text-sm text-zinc-600">No scheduled events</p>
          ) : (() => {
            const pastBlocks = timedEvents.filter((e) => isToday && e.end <= currentHour);
            const futureBlocks = timedEvents.filter((e) => !isToday || e.end > currentHour);
            const showNowLine = isToday && pastBlocks.length > 0 && futureBlocks.length > 0;
            return (
              <div>
                {pastBlocks.map((e, idx) => (
                  <PlanBlock
                    key={`${e.date}-${e.start}-${e.end}-${e.item}-${idx}`}
                    start={e.start}
                    end={e.end}
                    item={e.item}
                    done={e.done}
                    date={e.date}
                    isPast={true}
                    onToggleDone={() => setPlanDone(e, e.done === "1" ? "" : "1")}
                    onMarkMissed={() => setPlanDone(e, "0")}
                  />
                ))}
                {showNowLine && <NowLine />}
                {futureBlocks.map((e, idx) => (
                  <PlanBlock
                    key={`${e.date}-${e.start}-${e.end}-${e.item}-${idx}`}
                    start={e.start}
                    end={e.end}
                    item={e.item}
                    done={e.done}
                    date={e.date}
                    isPast={isToday && e.end <= currentHour}
                    onToggleDone={() => setPlanDone(e, e.done === "1" ? "" : "1")}
                    onMarkMissed={() => setPlanDone(e, "0")}
                  />
                ))}
              </div>
            );
          })()}
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
