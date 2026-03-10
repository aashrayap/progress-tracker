"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import LineTrendChart from "./components/LineTrendChart";
import TrendModal from "./components/TrendModal";
import HabitTooltip from "./components/HabitTooltip";
import HabitLogHistory, { type HabitLogEntry } from "./components/HabitLogHistory";
import { HABIT_CONFIG } from "./lib/config";
import BriefingCard from "./components/BriefingCard";

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
}

interface IntentionSummary {
  date: string;
  domain: string;
  mantra: string;
}

interface CheckinStatus {
  daily: { done: boolean; streak: number };
  weekly: { done: boolean; lastDate: string | null };
  monthly: { done: boolean; lastDate: string | null };
}

interface DailyQuote {
  text: string;
  author: string;
  source: string;
}

interface BriefingData {
  state: "momentum" | "recovery" | "neutral" | "danger" | "explore" | "disruption";
  insight: string;
  priorities: string[];
  quote: { text: string; author: string };
  generated_at: string;
  input_hash: string;
  verified: boolean;
}

interface AppData {
  briefing: BriefingData | null;
  checkinStatus: CheckinStatus;
  nowWindow: "morning" | "day" | "evening";
  dopamineReset: {
    startDate: string;
    dayNumber: number;
    days: number;
    log: DopamineDay[];
    streaks: { lol: number; weed: number; poker: number; clarity: number };
  };
  todaysPlan: { start: number; end: number; item: string; done: string; notes: string }[];
  habitTracker: {
    dates: string[];
    days: Record<string, boolean>[];
  };
  habitTrends: Record<string, { date: string; value: boolean | null }[]>;
  habitLogs: Record<string, HabitLogEntry[]>;
  dailyIntention: IntentionSummary | null;
  weeklyIntention: IntentionSummary | null;
  dailyQuote: DailyQuote | null;
  insight: {
    insight: { streak: string; warning: string | null; momentum: string };
  };
}

const HABIT_ORDER = [
  "sleep",
  "gym",
  "weed",
  "ate_clean",
  "deep_work",
  "meditate",
  "lol",
  "poker",
  "clarity",
] as const;
type HabitKey = keyof typeof HABIT_CONFIG;
type ActiveKey = HabitKey | "score";

function computeDayScore(entry: DopamineDay | undefined, isToday: boolean): { score: number | null; color: string } {
  if (!entry) {
    return isToday ? { score: null, color: "bg-zinc-800" } : { score: 0, color: "bg-red-500" };
  }

  if (isToday) {
    const all = [entry.weed, entry.lol, entry.poker, entry.clarity, entry.gym, entry.sleep, entry.meditate, entry.deepWork, entry.ateClean];
    if (!all.every((v) => v !== null)) return { score: null, color: "bg-zinc-800" };
  }

  const weed = entry.weed ?? false;
  if (!weed) return { score: 0, color: "bg-red-500" };

  const habitScore = [entry.gym, entry.sleep, entry.meditate, entry.deepWork, entry.ateClean].filter(Boolean).length;
  const viceScore = [entry.lol, entry.poker, entry.clarity].reduce((s, v) => s + (v === true ? 1 : -1), 0);
  const score = Math.max(0, habitScore + viceScore);

  if (score <= 2) return { score, color: "bg-red-500" };
  if (score <= 4) return { score, color: "bg-orange-500" };
  if (score <= 6) return { score, color: "bg-lime-500" };
  return { score, color: "bg-emerald-400" };
}

export default function Home() {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeHabitKey, setActiveHabitKey] = useState<ActiveKey | null>(null);
  const [hoveredCol, setHoveredCol] = useState<number | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(() => {
    fetch("/api/hub")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch hub");
        return res.json();
      })
      .then((hubData) => {
        setData(hubData);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load data:", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const isScoreActive = activeHabitKey === "score";

  const activeHabitTrendSeries = useMemo(() => {
    if (!data || !activeHabitKey || isScoreActive) return [];
    return data.habitTrends[activeHabitKey] || [];
  }, [activeHabitKey, isScoreActive, data]);

  const scoreTrendPoints = useMemo(() => {
    if (!data || !isScoreActive) return [];
    const { startDate, log } = data.dopamineReset;
    const [year, month, day] = startDate.split("-").map(Number);
    const resetDay = Math.max(1, Math.min(data.dopamineReset.dayNumber, data.dopamineReset.days));
    return Array.from({ length: resetDay }, (_, i) => {
      const d = new Date(year, month - 1, day + i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const entry = log.find((l) => l.date === dateStr);
      const { score } = computeDayScore(entry, i + 1 === resetDay);
      return { date: dateStr, value: score };
    });
  }, [data, isScoreActive]);

  const activeHabitTrendPoints = useMemo(() => {
    if (isScoreActive) {
      return scoreTrendPoints.map((entry, index) => {
        const windowStart = Math.max(0, index - 6);
        const window = scoreTrendPoints.slice(windowStart, index + 1).filter((p) => p.value !== null);
        if (window.length === 0) return { date: entry.date, value: null };
        const avg = window.reduce((s, p) => s + p.value!, 0) / window.length;
        return { date: entry.date, value: Number(((avg / 8) * 100).toFixed(1)) };
      });
    }
    return activeHabitTrendSeries.map((entry, index) => {
      const windowStart = Math.max(0, index - 6);
      const window = activeHabitTrendSeries
        .slice(windowStart, index + 1)
        .filter((point) => point.value !== null);

      if (window.length === 0) {
        return { date: entry.date, value: null };
      }

      const done = window.filter((point) => point.value === true).length;
      return {
        date: entry.date,
        value: Number(((done / window.length) * 100).toFixed(1)),
      };
    });
  }, [isScoreActive, scoreTrendPoints, activeHabitTrendSeries]);

  const activeHabitSummary = useMemo(() => {
    if (!activeHabitKey) return null;

    if (isScoreActive) {
      const logged = scoreTrendPoints.filter((p) => p.value !== null);
      if (logged.length === 0) return null;
      const avg = logged.reduce((s, p) => s + p.value!, 0) / logged.length;
      const recent = scoreTrendPoints.slice(-14).filter((p) => p.value !== null);
      const recentAvg = recent.length === 0 ? 0 : recent.reduce((s, p) => s + p.value!, 0) / recent.length;
      let currentStreak = 0;
      for (let i = scoreTrendPoints.length - 1; i >= 0; i--) {
        if (scoreTrendPoints[i].value !== null && scoreTrendPoints[i].value! >= 5) currentStreak++;
        else break;
      }
      return {
        loggedDays: logged.length,
        adherence: Math.round((avg / 8) * 100),
        recentAdherence: Math.round((recentAvg / 8) * 100),
        currentStreak,
      };
    }

    if (activeHabitTrendSeries.length === 0) return null;

    const loggedDays = activeHabitTrendSeries.filter((point) => point.value !== null).length;
    const doneDays = activeHabitTrendSeries.filter((point) => point.value === true).length;
    const adherence = loggedDays === 0 ? 0 : Math.round((doneDays / loggedDays) * 100);

    const recent = activeHabitTrendSeries.slice(-14).filter((point) => point.value !== null);
    const recentDone = recent.filter((point) => point.value === true).length;
    const recentAdherence = recent.length === 0 ? 0 : Math.round((recentDone / recent.length) * 100);

    let currentStreak = 0;
    for (let i = activeHabitTrendSeries.length - 1; i >= 0; i--) {
      const value = activeHabitTrendSeries[i].value;
      if (value === true) {
        currentStreak++;
        continue;
      }
      if (value === null) continue;
      break;
    }

    return {
      loggedDays,
      adherence,
      recentAdherence,
      currentStreak,
    };
  }, [activeHabitKey, isScoreActive, scoreTrendPoints, activeHabitTrendSeries]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center">
        <p className="text-zinc-400">Loading...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center">
        <p className="text-red-400">Failed to load data</p>
      </div>
    );
  }

  const resetDay = Math.max(1, Math.min(data.dopamineReset.dayNumber, data.dopamineReset.days));

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <div className="p-4 sm:p-6 pb-24">
        <div className="max-w-6xl mx-auto space-y-5">
          <header className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">
              {new Date().toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </span>
            <h1 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">Hub</h1>
          </header>

          {/* Briefing Card */}
          <BriefingCard
            briefing={data.briefing}
            fallbackInsight={data.insight.insight}
            fallbackQuote={data.dailyQuote}
          />

          {/* Habit grid -- 28 Days */}
          <section className="p-4 bg-zinc-900/60 backdrop-blur-md border border-white/10 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-zinc-400 uppercase">Daily Habits — 28 Days</p>
              <span className="text-xs text-zinc-600">Day {resetDay}/90</span>
            </div>
            {(() => {
              const dates = data.habitTracker.dates;
              // Group indices into Mon-Sun weeks
              const weeks: number[][] = [];
              let currentWeek: number[] = [];
              for (let i = 0; i < dates.length; i++) {
                const [y, m, d] = dates[i].split("-").map(Number);
                const dow = new Date(y, m - 1, d).getDay(); // 0=Sun
                currentWeek.push(i);
                if (dow === 0 || i === dates.length - 1) {
                  weeks.push(currentWeek);
                  currentWeek = [];
                }
              }
              const CELL = 28; // w-7 h-7
              const GAP = 4;   // gap-1
              const fullWeekWidth = 7 * CELL + 6 * GAP;
              const fmtDate = (d: string) => {
                const [y, m, day] = d.split("-").map(Number);
                return new Date(y, m - 1, day).toLocaleDateString("en-US", { month: "short", day: "numeric" });
              };
              const weekCells = (indices: number[], renderCell: (i: number) => React.ReactNode) => (
                <div className="flex gap-1" style={{ width: `${fullWeekWidth}px` }}>{indices.map(renderCell)}</div>
              );
              return (
                <div
                  ref={gridRef}
                  className="relative space-y-2.5"
                  onMouseLeave={() => setHoveredCol(null)}
                >
                  {hoveredCol !== null && dates[hoveredCol] && (() => {
                    const entry = data.dopamineReset.log.find((l) => l.date === dates[hoveredCol]);
                    const isToday = hoveredCol === dates.length - 1;
                    const { score } = computeDayScore(entry, isToday);
                    return (
                      <HabitTooltip
                        dateStr={dates[hoveredCol]}
                        columnIndex={hoveredCol}
                        gridRef={gridRef}
                        score={score}
                      />
                    );
                  })()}
                  {/* Date labels — Monday of each week */}
                  <div className="flex items-center gap-2.5">
                    <span className="w-[4.5rem] shrink-0" />
                    <div className="flex gap-3">
                      {weeks.map((wk, wi) => (
                        <div key={wi} style={{ width: `${fullWeekWidth}px` }}>
                          <span className="text-[10px] text-zinc-600">{fmtDate(dates[wk[0]])}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Score row */}
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs text-zinc-300 w-[4.5rem] shrink-0 text-right font-medium">Score</span>
                    <div className="flex gap-3">
                      {weeks.map((wk, wi) => weekCells(wk, (i) => {
                        const dateStr = dates[i];
                        const entry = data.dopamineReset.log.find((l) => l.date === dateStr);
                        const isToday = i === dates.length - 1;
                        const { score, color } = computeDayScore(entry, isToday);
                        return (
                          <div
                            key={dateStr}
                            className={`w-7 h-7 rounded cursor-pointer ${color} ${isToday ? "ring-2 ring-zinc-400 ring-offset-1 ring-offset-zinc-950" : ""}`}
                            title={score !== null ? `${score}/8` : "Not logged"}
                            onMouseEnter={() => setHoveredCol(i)}
                            onClick={() => setActiveHabitKey("score")}
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
                  {HABIT_ORDER.map((habitKey) => (
                    <div key={habitKey} className="flex items-center gap-2.5">
                      <span className="text-xs text-zinc-400 w-[4.5rem] shrink-0 text-right truncate">
                        {HABIT_CONFIG[habitKey].label}
                      </span>
                      <div className="flex gap-3">
                        {weeks.map((wk, wi) => weekCells(wk, (i) => {
                          const val = data.habitTracker.days[i][habitKey];
                          const isToday = i === data.habitTracker.days.length - 1;
                          return (
                            <div
                              key={dates[i]}
                              className={`w-7 h-7 rounded cursor-pointer ${
                                val === true
                                  ? "bg-emerald-500"
                                  : val === false
                                    ? "bg-red-500"
                                    : "bg-zinc-800"
                              } ${isToday ? "ring-2 ring-zinc-400 ring-offset-1 ring-offset-zinc-950" : ""}`}
                              onMouseEnter={() => setHoveredCol(i)}
                              onClick={() => setActiveHabitKey(habitKey)}
                            />
                          );
                        }))}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </section>

        </div>
      </div>

      <TrendModal
        open={Boolean(activeHabitKey)}
        onClose={() => setActiveHabitKey(null)}
        title={isScoreActive ? "Daily Score" : activeHabitKey ? HABIT_CONFIG[activeHabitKey as HabitKey].label : "Habit Trend"}
        subtitle={isScoreActive ? "Rolling 7-day average (% of max 8)" : "Rolling 7-day adherence"}
        sidebar={
          activeHabitKey && !isScoreActive && data.habitLogs?.[activeHabitKey] ? (
            <HabitLogHistory logs={data.habitLogs[activeHabitKey]} />
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
                <p className="mt-1 text-xs text-zinc-500">{isScoreActive ? "90-day reset" : "Last 90 days"}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-zinc-900/60 p-3">
                <p className="text-[11px] uppercase tracking-wide text-zinc-500">{isScoreActive ? "Avg Score" : "Adherence"}</p>
                <p className="mt-1 font-mono text-sm text-emerald-300">{activeHabitSummary.adherence}%</p>
                <p className="mt-1 text-xs text-zinc-500">{isScoreActive ? "% of max 8" : "Overall completion"}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-zinc-900/60 p-3">
                <p className="text-[11px] uppercase tracking-wide text-zinc-500">{isScoreActive ? "Good Streak" : "Current Streak"}</p>
                <p className="mt-1 font-mono text-sm text-zinc-100">{activeHabitSummary.currentStreak}d</p>
                <p className="mt-1 text-xs text-zinc-500">
                  {isScoreActive ? `Last 14d: ${activeHabitSummary.recentAdherence}%` : `Last 14d: ${activeHabitSummary.recentAdherence}%`}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </TrendModal>
    </div>
  );
}
