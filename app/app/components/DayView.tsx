"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import PlanBlock from "./PlanBlock";
import NowLine, { getCurrentHour } from "./NowLine";
import HabitTooltip from "./HabitTooltip";
import TrendModal from "./TrendModal";
import LineTrendChart from "./LineTrendChart";
import HabitLogHistory, { type HabitLogEntry } from "./HabitLogHistory";
import type { PlanEvent, HabitMap, Todo, RitualBlueprint } from "../lib/types";
import { HABIT_CONFIG } from "../lib/config";
import { toDateStr } from "../lib/utils";

function getRitualPhase(): "morning" | "midday" | "evening" {
  const now = new Date();
  const hour = now.getHours();
  const min = now.getMinutes();
  if (hour < 10 || (hour === 10 && min < 30)) return "morning";
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

// Grid display rows — compound rows merge multiple signals into one cell with subsections
type GridRow = { label: string; signals: string[] };
const GRID_ROWS: GridRow[] = [
  { label: "Sleep", signals: ["sleep"] },
  { label: "Gym", signals: ["gym"] },
  { label: "No Weed", signals: ["weed"] },
  { label: "Ate Clean", signals: ["ate_clean"] },
  { label: "Deep Work", signals: ["deep_work"] },
  { label: "Meditate", signals: ["meditate"] },
  { label: "No LoL", signals: ["lol"] },
  { label: "No Poker", signals: ["poker"] },
  { label: "Clarity", signals: ["clarity"] },
  { label: "Protocol", signals: ["morning_review", "midday_review", "evening_review"] },
  { label: "Wim Hof", signals: ["wim_hof_am", "wim_hof_pm"] },
];

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
  naDays: Record<string, string>;
  habitTrends: Record<string, { date: string; value: boolean | null }[]>;
  habitLogs: Record<string, HabitLogEntry[]>;
}


function computeDayScore(entry: DopamineDay | undefined, isToday: boolean, isNa?: boolean): { score: number | null; color: string } {
  if (isNa) return { score: null, color: "bg-zinc-600/50" };
  if (!entry) {
    return isToday ? { score: null, color: "bg-zinc-800" } : { score: 0, color: "bg-red-500" };
  }
  if (isToday) {
    const all = [entry.weed, entry.lol, entry.poker, entry.clarity, entry.gym, entry.sleep, entry.meditate, entry.deepWork, entry.ateClean, entry.wimHofAm, entry.wimHofPm];
    if (!all.every((v) => v !== null)) return { score: null, color: "bg-zinc-800" };
  }
  const weed = entry.weed ?? false;
  if (!weed) return { score: 0, color: "bg-red-500" };
  const habitScore = [entry.gym, entry.sleep, entry.meditate, entry.deepWork, entry.ateClean].filter(Boolean).length
    + (entry.wimHofAm ? 0.5 : 0) + (entry.wimHofPm ? 0.5 : 0);
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
  const [hubData, setHubData] = useState<HubData | null>(null);
  const [reviewDone, setReviewDone] = useState<Record<string, boolean>>({});
  const [habitSignals, setHabitSignals] = useState<Record<string, boolean | null>>({});
  const [habitPageOffset, setHabitPageOffset] = useState(0);
  const [hoveredCol, setHoveredCol] = useState<number | null>(null);
  const [activeHabitKey, setActiveHabitKey] = useState<HabitKey | null>(null);
  const [scoreTrendOpen, setScoreTrendOpen] = useState(false);
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
        })
        .catch(() => {
          if (!active) return;
          setRitual(null);
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

      // Pre-populate review done + habit signals from today's signals
      fetch(`/api/daily-signals?start=${dateStr}&end=${dateStr}`)
        .then((res) => res.ok ? res.json() : [])
        .then((signals) => {
          if (!active || !Array.isArray(signals)) return;
          const done: Record<string, boolean> = {};
          const habits: Record<string, boolean | null> = {};
          for (const s of signals) {
            if (["morning_review", "midday_review", "evening_review"].includes(s.signal) && s.value === "1") {
              const phase = s.signal.replace("_review", "");
              done[phase] = true;
            }
            if (HABIT_ORDER.includes(s.signal)) {
              habits[s.signal] = s.value === "1" ? true : s.value === "0" ? false : null;
            }
          }
          setReviewDone(done);
          setHabitSignals((prev) => ({ ...habits, ...prev }));
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
      const current = habitSignals[signal]; // true=green, false=red, undefined/null=grey
      // Cycle: grey→green, green→red, red→grey
      const next = current === true ? false : current === false ? null : true;
      const prev = current;
      setHabitSignals((p) => {
        const updated = { ...p };
        if (next === null) { delete updated[signal]; } else { updated[signal] = next; }
        return updated;
      });
      // Sync review state
      if (signal.endsWith("_review")) {
        const phase = signal.replace("_review", "");
        setReviewDone((p) => {
          const updated = { ...p };
          if (next === true) { updated[phase] = true; } else { delete updated[phase]; }
          return updated;
        });
      }
      try {
        if (next === null) {
          // Delete (unlog)
          const res = await fetch(`/api/daily-signals?date=${dateStr}&signal=${signal}`, { method: "DELETE" });
          if (!res.ok) throw new Error("Failed");
        } else {
          // Post value
          const res = await fetch("/api/daily-signals", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              entries: [{
                date: dateStr,
                signal,
                value: next ? "1" : "0",
                unit: "",
                context: "",
                source: "app",
                captureId: "",
                category: "personal_growth",
              }],
            }),
          });
          if (!res.ok) throw new Error("Failed");
        }
      } catch {
        // Revert on error
        setHabitSignals((p) => {
          const updated = { ...p };
          if (prev === undefined || prev === null) { delete updated[signal]; } else { updated[signal] = prev; }
          return updated;
        });
        if (signal.endsWith("_review")) {
          const phase = signal.replace("_review", "");
          setReviewDone((p) => {
            const updated = { ...p };
            if (prev === true) { updated[phase] = true; } else { delete updated[phase]; }
            return updated;
          });
        }
      }
    },
    [habitSignals, dateStr]
  );

  // Signal name → DopamineDay key mapping for optimistic grid overlay
  const SIGNAL_TO_DOPAMINE: Record<string, keyof DopamineDay> = {
    weed: "weed", lol: "lol", poker: "poker", clarity: "clarity",
    gym: "gym", sleep: "sleep", meditate: "meditate", deep_work: "deepWork",
    ate_clean: "ateClean", morning_review: "morningReview", midday_review: "middayReview",
    evening_review: "eveningReview", wim_hof_am: "wimHofAm", wim_hof_pm: "wimHofPm",
  };

  // Optimistic dopamine log: rebuild today's entry from habitSignals
  const patchedLog = useMemo(() => {
    if (!hubData?.dopamineReset?.log) return [];
    return hubData.dopamineReset.log.map((entry) => {
      if (entry.date !== todayStr) return entry;
      const patched = { ...entry };
      // For today, habitSignals is the source of truth for all signals
      for (const [signal, key] of Object.entries(SIGNAL_TO_DOPAMINE)) {
        if (key === "date") continue;
        const val = habitSignals[signal];
        // undefined/absent in habitSignals = null (unlogged)
        (patched as Record<string, boolean | null | string>)[key] = val === true ? true : val === false ? false : null;
      }
      return patched;
    });
  }, [hubData, habitSignals, todayStr]);

  // Optimistic habitTracker days: rebuild today's entry from habitSignals
  const patchedTrackerDays = useMemo(() => {
    if (!hubData?.habitTracker) return [];
    const dates = hubData.habitTracker.dates;
    return hubData.habitTracker.days.map((day, i) => {
      if (dates[i] !== todayStr) return day;
      const patched: Record<string, boolean | undefined> = { ...day };
      for (const signal of Object.keys(SIGNAL_TO_DOPAMINE)) {
        const val = habitSignals[signal];
        // true=green, false=red, undefined/null=grey (remove key so cell renders as grey)
        if (val === true) patched[signal] = true;
        else if (val === false) patched[signal] = false;
        else delete patched[signal];
      }
      return patched;
    });
  }, [hubData, habitSignals, todayStr]);

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

  // Trend modal: compute rolling 7-day adherence points + summary stats
  const activeHabitTrendPoints = useMemo(() => {
    if (!activeHabitKey || !hubData?.habitTrends?.[activeHabitKey]) return [];
    const raw = hubData.habitTrends[activeHabitKey];
    const WINDOW = 7;
    return raw.map((_, idx) => {
      const start = Math.max(0, idx - WINDOW + 1);
      const window = raw.slice(start, idx + 1);
      const logged = window.filter((d) => d.value !== null);
      if (logged.length === 0) return { date: raw[idx].date, value: null };
      const pct = (logged.filter((d) => d.value === true).length / logged.length) * 100;
      return { date: raw[idx].date, value: Math.round(pct) };
    });
  }, [activeHabitKey, hubData]);

  const activeHabitSummary = useMemo(() => {
    if (!activeHabitKey || !hubData?.habitTrends?.[activeHabitKey]) return null;
    const raw = hubData.habitTrends[activeHabitKey];
    const logged = raw.filter((d) => d.value !== null);
    const adherent = logged.filter((d) => d.value === true).length;
    const recent14 = raw.slice(-14).filter((d) => d.value !== null);
    const recent14Adherent = recent14.filter((d) => d.value === true).length;
    // Current streak
    let streak = 0;
    for (let i = raw.length - 1; i >= 0; i--) {
      if (raw[i].value === true) streak++;
      else break;
    }
    return {
      loggedDays: logged.length,
      adherence: logged.length > 0 ? Math.round((adherent / logged.length) * 100) : 0,
      currentStreak: streak,
      recentAdherence: recent14.length > 0 ? Math.round((recent14Adherent / recent14.length) * 100) : 0,
    };
  }, [activeHabitKey, hubData]);

  // Score trend: daily score over 90 days + rolling 7-day average
  const scoreTrendData = useMemo(() => {
    if (!patchedLog || !gridData) return { daily: [], rolling: [], summary: null };
    const { allDates } = gridData;
    const naDaysMap: Record<string, string> = hubData?.naDays || {};
    const todayIdx = allDates.length - 1;
    const daily = allDates.map((ds, i) => {
      const entry = patchedLog.find((l) => l.date === ds);
      const isTodayCell = i === todayIdx;
      const { score } = computeDayScore(entry, isTodayCell, !!naDaysMap[ds]);
      return { date: ds, value: score };
    });
    const WINDOW = 7;
    const rolling = daily.map((_, idx) => {
      const start = Math.max(0, idx - WINDOW + 1);
      const window = daily.slice(start, idx + 1);
      const valid = window.filter((d) => d.value !== null) as { date: string; value: number }[];
      if (valid.length === 0) return { date: daily[idx].date, value: null };
      const avg = valid.reduce((s, d) => s + d.value, 0) / valid.length;
      return { date: daily[idx].date, value: Math.round(avg * 10) / 10 };
    });
    const scored = daily.filter((d) => d.value !== null) as { date: string; value: number }[];
    const avg = scored.length > 0 ? Math.round((scored.reduce((s, d) => s + d.value, 0) / scored.length) * 10) / 10 : 0;
    const recent14 = daily.slice(-14).filter((d) => d.value !== null) as { date: string; value: number }[];
    const recentAvg = recent14.length > 0 ? Math.round((recent14.reduce((s, d) => s + d.value, 0) / recent14.length) * 10) / 10 : 0;
    const best = scored.length > 0 ? Math.max(...scored.map((d) => d.value)) : 0;
    return {
      daily,
      rolling,
      summary: { avg, recentAvg, best, loggedDays: scored.length },
    };
  }, [patchedLog, gridData, hubData]);

  const renderHabitToggleRow = (signals: string[], label: string) => (
    <div key={label}>
      <p className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-2">
        {signals.map((signal) => {
          const cfg = HABIT_CONFIG[signal as keyof typeof HABIT_CONFIG];
          if (!cfg) return null;
          const val = habitSignals[signal]; // true=green, false=red, undefined/null=grey
          const isGreen = val === true;
          const isRed = val === false;
          return (
            <div key={signal} className="relative group">
              <button
                onClick={() => handleHabitToggle(signal)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs border cursor-pointer transition-colors ${
                  isGreen
                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                    : isRed
                    ? "bg-red-500/15 border-red-500/30 text-red-400"
                    : "bg-zinc-800/60 border-white/5 text-zinc-500 hover:border-zinc-600"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isGreen ? "bg-emerald-400" : isRed ? "bg-red-400" : "bg-zinc-600"
                  }`}
                />
                {cfg.abbr}
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-zinc-800 border border-white/20 rounded text-[11px] text-zinc-200 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                {cfg.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      <div className="space-y-4">
        {/* 0. Persistent report links — always visible for today */}
        {isToday && (
          <div className="flex gap-3 px-1">
            <a
              href={`/artifacts/morning-report-${dateStr}.html`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors underline decoration-zinc-700"
            >
              Morning Report
            </a>
            {focusDate.getDay() === 0 && (
              <a
                href={`/artifacts/weekly-report-${dateStr}.html`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors underline decoration-zinc-700"
              >
                Weekly Report
              </a>
            )}
          </div>
        )}

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
                      <li key={i} className="text-sm text-zinc-400">
                        {step.toLowerCase().includes("morning report") ? (
                          <a
                            href={`/artifacts/morning-report-${dateStr}.html`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline decoration-zinc-600 hover:text-zinc-200 transition-colors"
                          >
                            {step}
                          </a>
                        ) : step}
                      </li>
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

        {/* Intentions — any date */}
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
          const naDays: Record<string, string> = hubData.naDays || {};
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
                  const hoveredDate = allDates[hoveredCol];
                  const entry = patchedLog.find((l) => l.date === hoveredDate);
                  const isTodayCell = hoveredCol === todayIdx;
                  const isNa = !!naDays[hoveredDate];
                  const { score } = computeDayScore(entry, isTodayCell, isNa);
                  return (
                    <HabitTooltip
                      dateStr={hoveredDate}
                      columnIndex={hoveredCol}
                      gridRef={gridRef}
                      score={score}
                      naReason={naDays[hoveredDate]}
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
                  <span
                    className="text-xs text-zinc-300 w-[4.5rem] shrink-0 text-right font-medium cursor-pointer hover:text-zinc-100 transition-colors"
                    onClick={() => setScoreTrendOpen(true)}
                  >Score</span>
                  <div className="flex gap-3">
                    {weeks.map((wk, wi) => weekCells(wk, wi, (i) => {
                      const ds = allDates[i];
                      const entry = patchedLog.find((l) => l.date === ds);
                      const isTodayCell = i === todayIdx;
                      const isNa = !!naDays[ds];
                      const { score, color } = computeDayScore(entry, isTodayCell, isNa);
                      return (
                        <div
                          key={ds}
                          data-col={i}
                          className={`w-7 h-7 rounded ${isNa ? "cursor-default" : "cursor-pointer"} ${color} ${isTodayCell ? "ring-2 ring-zinc-400 ring-offset-1 ring-offset-zinc-950" : ""}`}
                          title={isNa ? `N/A: ${naDays[ds]}` : score !== null ? `${score}/9` : "Not logged"}
                          onMouseEnter={() => setHoveredCol(i)}
                          onClick={isNa ? undefined : () => setScoreTrendOpen(true)}
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
                {GRID_ROWS.map((row) => (
                  <div key={row.label} className="flex items-center gap-2.5">
                    <span
                      className="text-xs text-zinc-400 w-[4.5rem] shrink-0 text-right truncate cursor-pointer hover:text-zinc-200 transition-colors"
                      onClick={() => setActiveHabitKey(row.signals[0] as HabitKey)}
                    >
                      {row.label}
                    </span>
                    <div className="flex gap-3">
                      {weeks.map((wk, wi) => weekCells(wk, wi, (i) => {
                        const ds = allDates[i];
                        const isTodayCell = i === todayIdx;
                        const isNa = !!naDays[ds];
                        if (row.signals.length === 1) {
                          const val = patchedTrackerDays[i]?.[row.signals[0]];
                          return (
                            <div
                              key={ds}
                              data-col={i}
                              className={`w-7 h-7 rounded ${isNa ? "cursor-default" : "cursor-pointer"} ${
                                isNa ? "bg-zinc-600/50" : val === true ? "bg-emerald-500" : val === false ? "bg-red-500" : "bg-zinc-800"
                              } ${isTodayCell ? "ring-2 ring-zinc-400 ring-offset-1 ring-offset-zinc-950" : ""}`}
                              onMouseEnter={() => setHoveredCol(i)}
                              onClick={isNa ? undefined : () => setActiveHabitKey(row.signals[0] as HabitKey)}
                            />
                          );
                        }
                        // Compound cell: vertical slices (side by side)
                        return (
                          <div
                            key={ds}
                            data-col={i}
                            className={`w-7 h-7 rounded overflow-hidden flex flex-row ${isNa ? "cursor-default" : "cursor-pointer"} ${
                              isTodayCell ? "ring-2 ring-zinc-400 ring-offset-1 ring-offset-zinc-950" : ""
                            }`}
                            onMouseEnter={() => setHoveredCol(i)}
                            onClick={isNa ? undefined : () => setActiveHabitKey(row.signals[0] as HabitKey)}
                          >
                            {row.signals.map((sig) => {
                              const val = patchedTrackerDays[i]?.[sig];
                              return (
                                <div
                                  key={sig}
                                  className={`flex-1 ${
                                    isNa ? "bg-zinc-600/50" : val === true ? "bg-emerald-500" : val === false ? "bg-red-500" : "bg-zinc-800"
                                  }`}
                                />
                              );
                            })}
                          </div>
                        );
                      }))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

      </div>

      {/* Score trend modal */}
      <TrendModal
        open={scoreTrendOpen}
        onClose={() => setScoreTrendOpen(false)}
        title="Total Score"
        subtitle="Rolling 7-day average (0–9)"
      >
        <div className="space-y-4">
          <LineTrendChart
            points={scoreTrendData.rolling}
            minY={0}
            maxY={9}
            color="#60a5fa"
            valueFormatter={(value) => `${value}`}
            emptyLabel="No score data available."
          />
          {scoreTrendData.summary ? (
            <div className="grid grid-cols-4 gap-2">
              <div className="rounded-lg border border-white/10 bg-zinc-900/60 p-3">
                <p className="text-[11px] uppercase tracking-wide text-zinc-500">Logged Days</p>
                <p className="mt-1 font-mono text-sm text-zinc-100">{scoreTrendData.summary.loggedDays}</p>
                <p className="mt-1 text-xs text-zinc-500">Last 90 days</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-zinc-900/60 p-3">
                <p className="text-[11px] uppercase tracking-wide text-zinc-500">Average</p>
                <p className="mt-1 font-mono text-sm text-zinc-100">{scoreTrendData.summary.avg}/9</p>
                <p className="mt-1 text-xs text-zinc-500">Overall</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-zinc-900/60 p-3">
                <p className="text-[11px] uppercase tracking-wide text-zinc-500">Recent</p>
                <p className="mt-1 font-mono text-sm text-emerald-300">{scoreTrendData.summary.recentAvg}/9</p>
                <p className="mt-1 text-xs text-zinc-500">Last 14 days</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-zinc-900/60 p-3">
                <p className="text-[11px] uppercase tracking-wide text-zinc-500">Best Day</p>
                <p className="mt-1 font-mono text-sm text-zinc-100">{scoreTrendData.summary.best}/9</p>
                <p className="mt-1 text-xs text-zinc-500">Peak score</p>
              </div>
            </div>
          ) : null}
        </div>
      </TrendModal>

      {/* Habit trend modal */}
      <TrendModal
        open={Boolean(activeHabitKey)}
        onClose={() => setActiveHabitKey(null)}
        title={activeHabitKey ? HABIT_CONFIG[activeHabitKey].label : "Habit Trend"}
        subtitle="Rolling 7-day adherence"
        sidebar={
          activeHabitKey && hubData?.habitLogs?.[activeHabitKey] ? (
            <HabitLogHistory logs={hubData.habitLogs[activeHabitKey]} />
          ) : undefined
        }
      >
        <div className="space-y-4">
          <LineTrendChart
            points={activeHabitTrendPoints}
            minY={0}
            maxY={100}
            color="#34d399"
            valueFormatter={(value) => `${Math.round(value)}%`}
            emptyLabel="No habit logs available for this period."
          />
          {activeHabitSummary ? (
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg border border-white/10 bg-zinc-900/60 p-3">
                <p className="text-[11px] uppercase tracking-wide text-zinc-500">Logged Days</p>
                <p className="mt-1 font-mono text-sm text-zinc-100">{activeHabitSummary.loggedDays}</p>
                <p className="mt-1 text-xs text-zinc-500">Last 90 days</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-zinc-900/60 p-3">
                <p className="text-[11px] uppercase tracking-wide text-zinc-500">Adherence</p>
                <p className="mt-1 font-mono text-sm text-emerald-300">{activeHabitSummary.adherence}%</p>
                <p className="mt-1 text-xs text-zinc-500">Overall completion</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-zinc-900/60 p-3">
                <p className="text-[11px] uppercase tracking-wide text-zinc-500">Current Streak</p>
                <p className="mt-1 font-mono text-sm text-zinc-100">{activeHabitSummary.currentStreak}d</p>
                <p className="mt-1 text-xs text-zinc-500">Last 14d: {activeHabitSummary.recentAdherence}%</p>
              </div>
            </div>
          ) : null}
        </div>
      </TrendModal>
    </>
  );
}
