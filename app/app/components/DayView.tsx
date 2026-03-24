"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import PlanBlock from "./PlanBlock";
import NowLine, { getCurrentHour } from "./NowLine";
import BriefingCard from "./BriefingCard";
import HabitTooltip from "./HabitTooltip";
import type { PlanEvent, HabitMap, Todo, RitualBlueprint } from "../lib/types";
import { HABIT_CONFIG } from "../lib/config";
import { toDateStr } from "../lib/utils";

function getRitualPhase(): "morning" | "midday" | "evening" {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "midday";
  return "evening";
}

const PHASE_SIGNAL: Record<string, string> = {
  morning: "morning_review",
  midday: "midday_review",
  evening: "evening_review",
};

// Habit toggles: 3 groups per spec
const HABIT_GROUP_1 = ["wim_hof_am", "wim_hof_pm", "gym", "sleep", "ate_clean", "deep_work", "meditate"];
const HABIT_GROUP_2 = ["morning_review", "midday_review", "evening_review"];
const HABIT_GROUP_3 = ["weed", "lol", "poker", "clarity"];

// 90-day grid habit order (matches updated config, no vision_reviewed)
const HABIT_ORDER = [
  "sleep", "gym", "weed", "ate_clean", "deep_work", "meditate",
  "lol", "poker", "clarity", "morning_review", "midday_review",
  "evening_review", "wim_hof_am", "wim_hof_pm",
] as const;

type HabitKey = keyof typeof HABIT_CONFIG;

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

interface BriefingData {
  state: "momentum" | "recovery" | "neutral" | "danger" | "explore" | "disruption";
  insight: string;
  priorities: string[];
  quote: { text: string; author: string };
  generated_at: string;
  input_hash: string;
  verified: boolean;
  planInsight?: string;
}

interface DopamineDay {
  date: string;
  weed: boolean | null;
  lol: boolean | null;
  poker: boolean | null;
  clarity: boolean | null;
  gym: boolean | null;
  sleep: boolean | null;
  meditate: boolean | null;
  deepWork: boolean | null;
  ateClean: boolean | null;
  morningReview: boolean | null;
  middayReview: boolean | null;
  eveningReview: boolean | null;
  wimHofAm: boolean | null;
  wimHofPm: boolean | null;
}

interface HubData {
  briefing: BriefingData | null;
  insight: {
    insight: { streak: string; warning: string | null; momentum: string };
  };
  dailyQuote: { text: string; author: string; source: string } | null;
  dopamineReset: {
    startDate: string;
    dayNumber: number;
    days: number;
    log: DopamineDay[];
  };
  habitTracker: {
    dates: string[];
    days: Record<string, boolean>[];
  };
}

type CoreTraits = { health: string; wealth: string; love: string; self: string };

function computeDayScore(entry: DopamineDay | undefined, isToday: boolean): { score: number | null; color: string } {
  if (!entry) {
    return isToday ? { score: null, color: "bg-zinc-800" } : { score: 0, color: "bg-red-500" };
  }
  if (isToday) {
    const all = [entry.weed, entry.lol, entry.poker, entry.clarity, entry.gym, entry.sleep, entry.meditate, entry.deepWork, entry.ateClean, entry.wimHofAm, entry.wimHofPm];
    if (!all.every((v) => v !== null)) return { score: null, color: "bg-zinc-800" };
  }
  const weed = entry.weed ?? false;
  if (!weed) return { score: 0, color: "bg-red-500" };
  const habitScore = [entry.gym, entry.sleep, entry.meditate, entry.deepWork, entry.ateClean, entry.wimHofAm, entry.wimHofPm].filter(Boolean).length;
  const viceScore = [entry.lol, entry.poker, entry.clarity].reduce((s, v) => s + (v === true ? 1 : -1), 0);
  const score = Math.max(0, habitScore + viceScore);
  if (score <= 2) return { score, color: "bg-red-500" };
  if (score <= 4) return { score, color: "bg-orange-500" };
  if (score <= 6) return { score, color: "bg-lime-500" };
  return { score, color: "bg-emerald-400" };
}

export default function DayView({ events, habits, focusDate, onRefresh }: Props) {
  const [dailyIntention, setDailyIntention] = useState<IntentionSummary | null>(null);
  const [weeklyIntention, setWeeklyIntention] = useState<IntentionSummary | null>(null);
  const [ritual, setRitual] = useState<RitualBlueprint | null>(null);
  const [ritualOpen, setRitualOpen] = useState(true);
  const [identityScript, setIdentityScript] = useState<{ coreTraits: CoreTraits; nonNegotiables: string } | null>(null);
  const [hubData, setHubData] = useState<HubData | null>(null);
  const [reviewDone, setReviewDone] = useState<Record<string, boolean>>({});
  const [habitSignals, setHabitSignals] = useState<Record<string, boolean>>({});
  const [habitPageOffset, setHabitPageOffset] = useState(0);
  const [hoveredCol, setHoveredCol] = useState<number | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

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

  // Pre-populate habit toggles from habits prop
  useEffect(() => {
    if (!isToday) return;
    const dayHabits = habits[dateStr];
    if (dayHabits) {
      setHabitSignals((prev) => {
        const merged = { ...prev };
        for (const [key, val] of Object.entries(dayHabits)) {
          if (!(key in merged)) merged[key] = val;
        }
        return merged;
      });
    }
  }, [habits, dateStr, isToday]);

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
          if (data.identityScript) {
            setIdentityScript({
              coreTraits: data.identityScript.coreTraits ?? { health: "", wealth: "", love: "", self: "" },
              nonNegotiables: data.identityScript.nonNegotiables ?? "",
            });
          }
        })
        .catch(() => {
          if (!active) return;
          setRitual(null);
          setIdentityScript(null);
        });

      fetch("/api/hub")
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch hub");
          return res.json();
        })
        .then((data) => {
          if (!active) return;
          setHubData(data);
        })
        .catch(() => {
          if (!active) return;
          setHubData(null);
        });

      // Pre-populate review done state from today's signals
      fetch(`/api/daily-signals?start=${dateStr}&end=${dateStr}`)
        .then((res) => res.ok ? res.json() : [])
        .then((signals) => {
          if (!active || !Array.isArray(signals)) return;
          const done: Record<string, boolean> = {};
          for (const s of signals) {
            if (["morning_review", "midday_review", "evening_review"].includes(s.signal) && s.value === "1") {
              const phase = s.signal.replace("_review", "");
              done[phase] = true;
            }
          }
          setReviewDone(done);
        })
        .catch(() => {});
    }

    return () => {
      active = false;
    };
  }, [dateStr, isToday]);

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

  const handleMarkComplete = useCallback(
    async (phase: string) => {
      if (reviewDone[phase]) return;
      setReviewDone((prev) => ({ ...prev, [phase]: true }));
      const signal = PHASE_SIGNAL[phase];
      try {
        const res = await fetch("/api/daily-signals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entries: [{
              date: dateStr,
              signal,
              value: "1",
              unit: "",
              context: phase,
              source: "app",
              captureId: "",
              category: "personal_growth",
            }],
          }),
        });
        if (!res.ok) throw new Error("Failed");
        // Also update habit toggles for review signals
        setHabitSignals((prev) => ({ ...prev, [signal]: true }));
      } catch {
        setReviewDone((prev) => ({ ...prev, [phase]: false }));
      }
    },
    [reviewDone, dateStr]
  );

  const handleHabitToggle = useCallback(
    async (signal: string) => {
      if (habitSignals[signal]) return; // already done, no-op
      setHabitSignals((prev) => ({ ...prev, [signal]: true }));
      try {
        const res = await fetch("/api/daily-signals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entries: [{
              date: dateStr,
              signal,
              value: "1",
              unit: "",
              context: "",
              source: "app",
              captureId: "",
              category: "personal_growth",
            }],
          }),
        });
        if (!res.ok) throw new Error("Failed");
        // Sync review done state if this is a review signal
        if (signal.endsWith("_review")) {
          const phase = signal.replace("_review", "");
          setReviewDone((prev) => ({ ...prev, [phase]: true }));
        }
      } catch {
        setHabitSignals((prev) => {
          const next = { ...prev };
          delete next[signal];
          return next;
        });
      }
    },
    [habitSignals, dateStr]
  );

  // 90-day grid computations
  const gridData = useMemo(() => {
    if (!hubData?.habitTracker) return null;
    const allDates = hubData.habitTracker.dates;
    const allWeeks: number[][] = [];
    let currentWeek: number[] = [];
    for (let i = 0; i < allDates.length; i++) {
      const [y, m, d] = allDates[i].split("-").map(Number);
      const dow = new Date(y, m - 1, d).getDay();
      currentWeek.push(i);
      if (dow === 0 || i === allDates.length - 1) {
        allWeeks.push(currentWeek);
        currentWeek = [];
      }
    }
    return { allDates, allWeeks };
  }, [hubData]);

  const renderHabitToggleRow = (signals: string[], label: string) => (
    <div key={label}>
      <p className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-2">
        {signals.map((signal) => {
          const cfg = HABIT_CONFIG[signal as keyof typeof HABIT_CONFIG];
          if (!cfg) return null;
          const done = habitSignals[signal] === true;
          return (
            <button
              key={signal}
              onClick={() => handleHabitToggle(signal)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs border cursor-pointer transition-colors ${
                done
                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                  : "bg-zinc-800/60 border-white/5 text-zinc-500 hover:border-zinc-600"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  done ? "bg-emerald-400" : "bg-zinc-600"
                }`}
              />
              {cfg.abbr}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      <div className="space-y-4">
        {/* 1. Ritual checklist + mark-complete — today only */}
        {isToday && ritual && (() => {
          const phase = getRitualPhase();
          const block = ritual[phase];
          if (!block?.steps?.length) return null;
          const label = phase.charAt(0).toUpperCase() + phase.slice(1);
          const isDone = reviewDone[phase] === true;
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
                    {block.steps.map((step, i) => (
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
                  {/* Mark complete button */}
                  <div className="pt-2 border-t border-white/5">
                    <button
                      onClick={() => handleMarkComplete(phase)}
                      disabled={isDone}
                      className={`text-sm px-3 py-1.5 rounded-md transition-colors ${
                        isDone
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 cursor-default"
                          : "bg-zinc-800 text-zinc-300 border border-white/10 hover:bg-zinc-700 cursor-pointer"
                      }`}
                    >
                      {isDone ? `${label} complete \u2713` : `Mark ${phase} complete`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* 2. Compact identity — per-pillar — today only */}
        {isToday && identityScript && (identityScript.coreTraits || identityScript.nonNegotiables) && (
          <div className="px-3 py-2 rounded-lg border border-white/5 bg-zinc-900/40 space-y-2">
            {identityScript.coreTraits && (
              <div>
                <p className="text-zinc-500 text-xs uppercase tracking-wide mb-1.5">Core traits</p>
                <div className="space-y-1">
                  {(["health", "wealth", "love", "self"] as const).map((pillar) => (
                    <div key={pillar} className="flex gap-2">
                      <span className="text-zinc-500 text-xs uppercase tracking-wide w-16 shrink-0 pt-0.5">{pillar}</span>
                      <span className="text-sm text-zinc-300">{identityScript.coreTraits[pillar]}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {identityScript.nonNegotiables && (
              <p className="text-sm text-zinc-300 mt-1">
                <span className="text-zinc-500 text-xs uppercase tracking-wide mr-2">Non-negotiables</span>
                {identityScript.nonNegotiables}
              </p>
            )}
          </div>
        )}

        {/* 3. Intentions + Briefing — today only */}
        {isToday && (
          <div>
            {hasIntentions && (
              <div className="px-3 py-2 rounded-lg border border-cyan-400/20 bg-cyan-500/[0.06] mb-3">
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
            {hubData && (
              <BriefingCard
                briefing={hubData.briefing}
                fallbackInsight={hubData.insight.insight}
                fallbackQuote={hubData.dailyQuote}
              />
            )}
          </div>
        )}

        {/* Non-today: show intentions only */}
        {!isToday && hasIntentions && (
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

        {/* 4. Today's Habits toggles — today only */}
        {isToday && (
          <div className="p-4 bg-zinc-900/60 backdrop-blur-md rounded-xl border border-white/10">
            <h3 className="text-xs text-zinc-400 uppercase tracking-wide mb-3">
              Today&apos;s Habits
            </h3>
            <div className="space-y-3">
              {renderHabitToggleRow(HABIT_GROUP_1, "Protocol + Training")}
              {renderHabitToggleRow(HABIT_GROUP_2, "Reviews")}
              {renderHabitToggleRow(HABIT_GROUP_3, "Avoidance")}
            </div>
          </div>
        )}

        {/* 5. 90-day habit grid — today only */}
        {isToday && hubData && gridData && (() => {
          const { allDates, allWeeks } = gridData;
          const WEEKS_PER_PAGE = 4;
          const maxPage = Math.max(0, Math.ceil(allWeeks.length / WEEKS_PER_PAGE) - 1);
          const safeOffset = Math.min(habitPageOffset, maxPage);
          const endWeekIdx = allWeeks.length - safeOffset * WEEKS_PER_PAGE;
          const startWeekIdx = Math.max(0, endWeekIdx - WEEKS_PER_PAGE);
          const weeks = allWeeks.slice(startWeekIdx, endWeekIdx);
          const visibleIndices = weeks.flat();
          const firstDate = allDates[visibleIndices[0]];
          const lastDate = allDates[visibleIndices[visibleIndices.length - 1]];
          const fmtRange = (d: string) => {
            const [y, m, day] = d.split("-").map(Number);
            return new Date(y, m - 1, day).toLocaleDateString("en-US", { month: "short", day: "numeric" });
          };
          const canGoBack = startWeekIdx > 0;
          const canGoForward = safeOffset > 0;
          const CELL = 28;
          const GAP = 4;
          const fullWeekWidth = 7 * CELL + 6 * GAP;
          const fmtDate = (d: string) => {
            const [y, m, day] = d.split("-").map(Number);
            return new Date(y, m - 1, day).toLocaleDateString("en-US", { month: "short", day: "numeric" });
          };
          const resetDay = Math.max(1, Math.min(hubData.dopamineReset.dayNumber, hubData.dopamineReset.days));
          const todayIdx = allDates.length - 1;

          const weekCells = (indices: number[], weekIndex: number, renderCell: (i: number) => React.ReactNode) => (
            <div key={weekIndex} className="flex gap-1" style={{ width: `${fullWeekWidth}px` }}>{indices.map(renderCell)}</div>
          );

          return (
            <div className="p-4 bg-zinc-900/60 backdrop-blur-md rounded-xl border border-white/10">
              <h3 className="text-xs text-zinc-400 uppercase tracking-wide mb-3">
                90-Day Habits
              </h3>
              <div
                ref={gridRef}
                className="relative space-y-2.5"
                onMouseLeave={() => setHoveredCol(null)}
              >
                {/* Navigation */}
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setHabitPageOffset(Math.min(safeOffset + 1, maxPage))}
                      disabled={!canGoBack}
                      className={`text-xs px-2 py-1 rounded ${canGoBack ? "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800" : "text-zinc-700 cursor-not-allowed"}`}
                    >
                      &#9664;
                    </button>
                    <span className="text-xs text-zinc-500">
                      {fmtRange(firstDate)} &ndash; {fmtRange(lastDate)}
                    </span>
                    <button
                      onClick={() => setHabitPageOffset(Math.max(safeOffset - 1, 0))}
                      disabled={!canGoForward}
                      className={`text-xs px-2 py-1 rounded ${canGoForward ? "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800" : "text-zinc-700 cursor-not-allowed"}`}
                    >
                      &#9654;
                    </button>
                  </div>
                  <span className="text-xs text-zinc-600">Day {resetDay}/90</span>
                </div>

                {hoveredCol !== null && allDates[hoveredCol] && (() => {
                  const entry = hubData.dopamineReset.log.find((l) => l.date === allDates[hoveredCol]);
                  const isTodayCell = hoveredCol === todayIdx;
                  const { score } = computeDayScore(entry, isTodayCell);
                  return (
                    <HabitTooltip
                      dateStr={allDates[hoveredCol]}
                      columnIndex={hoveredCol}
                      gridRef={gridRef}
                      score={score}
                    />
                  );
                })()}

                {/* Date labels */}
                <div className="flex items-center gap-2.5">
                  <span className="w-[4.5rem] shrink-0" />
                  <div className="flex gap-3">
                    {weeks.map((wk, wi) => (
                      <div key={wi} style={{ width: `${fullWeekWidth}px` }}>
                        <span className="text-[10px] text-zinc-600">{fmtDate(allDates[wk[0]])}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Score row */}
                <div className="flex items-center gap-2.5">
                  <span className="text-xs text-zinc-300 w-[4.5rem] shrink-0 text-right font-medium">Score</span>
                  <div className="flex gap-3">
                    {weeks.map((wk, wi) => weekCells(wk, wi, (i) => {
                      const ds = allDates[i];
                      const entry = hubData.dopamineReset.log.find((l) => l.date === ds);
                      const isTodayCell = i === todayIdx;
                      const { score, color } = computeDayScore(entry, isTodayCell);
                      return (
                        <div
                          key={ds}
                          data-col={i}
                          className={`w-7 h-7 rounded ${color} ${isTodayCell ? "ring-2 ring-zinc-400 ring-offset-1 ring-offset-zinc-950" : ""}`}
                          title={score !== null ? `${score}/10` : "Not logged"}
                          onMouseEnter={() => setHoveredCol(i)}
                        />
                      );
                    }))}
                  </div>
                </div>

                {/* Separator */}
                <div className="flex items-center gap-2.5">
                  <span className="w-[4.5rem] shrink-0" />
                  <div className="flex-1 border-t border-white/5" />
                </div>

                {/* Habit rows */}
                {HABIT_ORDER.map((habitKey) => (
                  <div key={habitKey} className="flex items-center gap-2.5">
                    <span className="text-xs text-zinc-400 w-[4.5rem] shrink-0 text-right truncate">
                      {HABIT_CONFIG[habitKey].label}
                    </span>
                    <div className="flex gap-3">
                      {weeks.map((wk, wi) => weekCells(wk, wi, (i) => {
                        const ds = allDates[i];
                        const isTodayCell = i === todayIdx;
                        const val = hubData.habitTracker.days[i]?.[habitKey];
                        return (
                          <div
                            key={ds}
                            data-col={i}
                            className={`w-7 h-7 rounded ${
                              val === true
                                ? "bg-emerald-500"
                                : val === false
                                  ? "bg-red-500"
                                  : "bg-zinc-800"
                            } ${isTodayCell ? "ring-2 ring-zinc-400 ring-offset-1 ring-offset-zinc-950" : ""}`}
                            onMouseEnter={() => setHoveredCol(i)}
                          />
                        );
                      }))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* 6. Today's Priorities (drafts) — any date */}
        {allDayEvents.length > 0 && (
          <div className="p-4 bg-zinc-900/60 backdrop-blur-md rounded-xl border border-white/10">
            <h3 className="text-xs text-zinc-400 uppercase tracking-wide mb-3">
              Today&apos;s Priorities
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

        {/* 7. Schedule */}
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

    </>
  );
}
