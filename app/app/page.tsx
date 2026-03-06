"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import DailyInsight, { InsightData } from "./components/DailyInsight";
import LineTrendChart from "./components/LineTrendChart";
import TrendModal from "./components/TrendModal";
import HabitTooltip from "./components/HabitTooltip";
import HabitLogHistory, { type HabitLogEntry } from "./components/HabitLogHistory";
import { HABIT_CONFIG } from "./lib/config";

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

interface ReflectionBullet {
  domain: string;
  insight: string;
}

interface OpenTodo {
  id: number;
  item: string;
}

interface CheckinStatus {
  daily: { done: boolean; streak: number };
  weekly: { done: boolean; lastDate: string | null };
  monthly: { done: boolean; lastDate: string | null };
}

interface AppData {
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
  insight: InsightData;
  habitTracker: {
    dates: string[];
    days: Record<string, boolean>[];
  };
  habitTrends: Record<string, { date: string; value: boolean | null }[]>;
  habitLogs: Record<string, HabitLogEntry[]>;
  reflectionsSummary: ReflectionBullet[];
  openTodos: OpenTodo[];
  openTodosCount: number;
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

function formatCheckinDate(dateStr: string | null): string {
  if (!dateStr) return "never";
  const [, m, d] = dateStr.split("-");
  const months = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[parseInt(m, 10)]} ${parseInt(d, 10)}`;
}

function formatHour(v: number): string {
  const h = Math.floor(v);
  const m = v % 1 === 0.5 ? ":30" : "";
  const ampm = h >= 12 ? "pm" : "am";
  const hr = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hr}${m}${ampm}`;
}

export default function Home() {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeHabitKey, setActiveHabitKey] = useState<HabitKey | null>(null);
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
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

  const activeHabitTrendSeries = useMemo(() => {
    if (!data || !activeHabitKey) return [];
    return data.habitTrends[activeHabitKey] || [];
  }, [activeHabitKey, data]);

  const activeHabitTrendPoints = useMemo(() => {
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
  }, [activeHabitTrendSeries]);

  const activeHabitSummary = useMemo(() => {
    if (!activeHabitKey || activeHabitTrendSeries.length === 0) return null;

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
  }, [activeHabitKey, activeHabitTrendSeries]);

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

  const undonePlan = data.todaysPlan.filter((p) => p.done !== "1");
  const resetDay = Math.max(1, Math.min(data.dopamineReset.dayNumber, data.dopamineReset.days));
  const { checkinStatus } = data;
  const hasAnyPending = !checkinStatus.daily.done || !checkinStatus.weekly.done || !checkinStatus.monthly.done;

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <div className="p-4 sm:p-6 pb-24">
        <div className="max-w-3xl mx-auto space-y-5">
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

          {/* Check-in status */}
          {hasAnyPending && (
            <section className="p-4 bg-zinc-900/60 backdrop-blur-md border border-amber-500/30 rounded-xl">
              <p className="text-xs text-amber-400 uppercase mb-3">Check-in</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${checkinStatus.daily.done ? "text-zinc-500" : "text-zinc-100"}`}>
                      {checkinStatus.daily.done ? "✓" : "·"} Daily
                    </span>
                    {!checkinStatus.daily.done && (
                      <span className="text-xs text-amber-400/80">pending</span>
                    )}
                  </div>
                  <span className="text-xs text-zinc-500">
                    {checkinStatus.daily.done
                      ? "done today"
                      : checkinStatus.daily.streak > 0
                        ? `${checkinStatus.daily.streak} day streak`
                        : "not started"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${checkinStatus.weekly.done ? "text-zinc-500" : "text-zinc-100"}`}>
                      {checkinStatus.weekly.done ? "✓" : "·"} Weekly
                    </span>
                    {!checkinStatus.weekly.done && (
                      <span className="text-xs text-amber-400/80">due this week</span>
                    )}
                  </div>
                  <span className="text-xs text-zinc-500">
                    {checkinStatus.weekly.done
                      ? "done this week"
                      : `last: ${formatCheckinDate(checkinStatus.weekly.lastDate)}`}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${checkinStatus.monthly.done ? "text-zinc-500" : "text-zinc-100"}`}>
                      {checkinStatus.monthly.done ? "✓" : "·"} Monthly
                    </span>
                    {!checkinStatus.monthly.done && (
                      <span className="text-xs text-amber-400/80">due this month</span>
                    )}
                  </div>
                  <span className="text-xs text-zinc-500">
                    {checkinStatus.monthly.done
                      ? "done this month"
                      : `last: ${formatCheckinDate(checkinStatus.monthly.lastDate)}`}
                  </span>
                </div>
              </div>
              <p className="mt-3 text-xs text-zinc-500">
                Run <span className="text-zinc-400 font-mono">/checkin</span> in Claude Code to start.
              </p>
            </section>
          )}

          {/* Today Queue: undone plan blocks + top 3 open todos */}
          {(undonePlan.length > 0 || data.openTodos.length > 0) && (
            <section className="p-4 bg-zinc-900/60 backdrop-blur-md border border-white/10 rounded-xl">
              <p className="text-xs text-zinc-400 uppercase mb-2">Today Queue</p>
              <div className="space-y-1">
                {undonePlan.slice(0, 3).map((block, idx) => (
                  <p key={`${block.item}-${idx}`} className="text-sm text-zinc-300">
                    <span className="text-zinc-400 text-xs mr-2">{formatHour(block.start)}</span>
                    {block.item}
                  </p>
                ))}
                {data.openTodos.map((todo) => (
                  <p key={todo.id} className="text-sm text-zinc-300">
                    <span className="text-zinc-600 mr-1.5">○</span>
                    {todo.item}
                  </p>
                ))}
              </div>
              <div className="mt-2 flex items-center gap-3 text-xs text-zinc-400">
                {undonePlan.length > 0 && <Link href="/plan" className="hover:text-zinc-300">Open Plan</Link>}
                {data.openTodosCount > 3 && (
                  <Link href="/plan" className="hover:text-zinc-300">
                    View all {data.openTodosCount} todos in Plan →
                  </Link>
                )}
              </div>
            </section>
          )}

          {/* Recovery card */}
          <section className="p-4 bg-zinc-900/60 backdrop-blur-md border border-white/10 rounded-xl">
            <p className="text-xs text-zinc-400 uppercase">Recovery</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-100">
              Day {resetDay}/{data.dopamineReset.days}
            </p>
            <p className="mt-2 text-xs text-zinc-400">
              {data.dopamineReset.streaks.weed}d weed · {data.dopamineReset.streaks.lol}d lol · {data.dopamineReset.streaks.poker}d poker · {data.dopamineReset.streaks.clarity}d clarity
            </p>
            <div className="mt-3 h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500"
                style={{ width: `${Math.round((resetDay / data.dopamineReset.days) * 100)}%` }}
              />
            </div>
          </section>

          {/* Habit grid -- 14 Days */}
          <section className="p-4 bg-zinc-900/60 backdrop-blur-md border border-white/10 rounded-xl">
            <p className="text-xs text-zinc-400 uppercase mb-2">Daily Habits — 14 Days</p>
            <div
              ref={gridRef}
              className="relative space-y-2"
              onMouseLeave={() => setHoveredCol(null)}
            >
              {hoveredCol !== null && data.habitTracker.dates[hoveredCol] && (
                <HabitTooltip
                  dateStr={data.habitTracker.dates[hoveredCol]}
                  columnIndex={hoveredCol}
                  gridRef={gridRef}
                />
              )}
              {HABIT_ORDER.map((habitKey) => (
                <div key={habitKey} className="flex items-center gap-2.5">
                  <span className="text-xs text-zinc-400 w-[4.5rem] shrink-0 text-right truncate">
                    {HABIT_CONFIG[habitKey].label}
                  </span>
                  <div className="flex gap-1">
                    {data.habitTracker.days.map((day, i) => {
                      const val = day[habitKey];
                      const isToday = i === data.habitTracker.days.length - 1;
                      return (
                        <div
                          key={data.habitTracker.dates[i]}
                          className={`w-6 h-6 rounded cursor-pointer ${
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
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 90-Day Reset heatmap */}
          <section className="p-4 bg-zinc-900/60 backdrop-blur-md border border-white/10 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-zinc-400 uppercase tracking-wide">90-Day Reset</span>
              <span className="text-xs text-zinc-600">Day {resetDay}</span>
            </div>
            <div className="relative space-y-1">
              {[0, 1, 2].map((row) => (
                <div key={row} className="flex gap-0.5">
                  {Array.from({ length: 30 }, (_, col) => {
                    const i = row * 30 + col;
                    const dayNum = i + 1;
                    const [year, month, day] = data.dopamineReset.startDate.split("-").map(Number);
                    const dayDate = new Date(year, month - 1, day + i);
                    const dateStr = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, "0")}-${String(dayDate.getDate()).padStart(2, "0")}`;

                    const logEntry = data.dopamineReset.log.find((l) => l.date === dateStr);
                    const isToday = dayNum === resetDay;
                    const isFuture = dayNum > resetDay;

                    let color = "bg-zinc-800";
                    let textColor = "text-zinc-600";
                    let score: number | null = null;

                    if (!isFuture && (logEntry || !isToday)) {
                      const hasAnyData = logEntry != null;

                      if (isToday && !hasAnyData) {
                        // Today with no data at all: gray (not logged yet)
                      } else if (isToday && hasAnyData) {
                        const allSignals = [
                          logEntry!.weed, logEntry!.lol, logEntry!.poker, logEntry!.clarity,
                          logEntry!.gym, logEntry!.sleep, logEntry!.meditate, logEntry!.deepWork, logEntry!.ateClean,
                        ];
                        const allLogged = allSignals.every((v) => v !== null);

                        if (!allLogged) {
                          // Today partially logged: gray to nudge completion
                        } else if (logEntry!.weed === false) {
                          score = 0;
                          color = "bg-red-500"; textColor = "text-red-200";
                        } else {
                          const habits = [logEntry!.gym, logEntry!.sleep, logEntry!.meditate, logEntry!.deepWork, logEntry!.ateClean];
                          const habitScore = habits.filter(Boolean).length;
                          const vices = [logEntry!.lol, logEntry!.poker, logEntry!.clarity];
                          const viceScore = vices.reduce((sum, v) => sum + (v === true ? 1 : -1), 0);
                          score = Math.max(0, habitScore + viceScore);

                          if (score <= 2) { color = "bg-red-500"; textColor = "text-red-200"; }
                          else if (score <= 4) { color = "bg-orange-500"; textColor = "text-orange-200"; }
                          else if (score <= 6) { color = "bg-lime-500"; textColor = "text-lime-900"; }
                          else { color = "bg-emerald-400"; textColor = "text-emerald-900"; }
                        }
                      } else {
                        // Past day: treat null as 0 (missed/relapsed)
                        const weed = logEntry?.weed ?? false;
                        if (weed === false) {
                          score = 0;
                          color = "bg-red-500"; textColor = "text-red-200";
                        } else {
                          const habits = [logEntry?.gym, logEntry?.sleep, logEntry?.meditate, logEntry?.deepWork, logEntry?.ateClean];
                          const habitScore = habits.filter(Boolean).length;
                          const vices = [logEntry?.lol, logEntry?.poker, logEntry?.clarity];
                          const viceScore = vices.reduce((sum, v) => sum + (v === true ? 1 : v === null ? -1 : -1), 0);
                          score = Math.max(0, habitScore + viceScore);

                          if (score <= 2) { color = "bg-red-500"; textColor = "text-red-200"; }
                          else if (score <= 4) { color = "bg-orange-500"; textColor = "text-orange-200"; }
                          else if (score <= 6) { color = "bg-lime-500"; textColor = "text-lime-900"; }
                          else { color = "bg-emerald-400"; textColor = "text-emerald-900"; }
                        }
                      }
                    }

                    return (
                      <div
                        key={dayNum}
                        className="relative flex-1"
                        onMouseEnter={() => setHoveredDay(i)}
                        onMouseLeave={() => setHoveredDay(null)}
                        onClick={() => setHoveredDay(hoveredDay === i ? null : i)}
                      >
                        <div className={`w-full aspect-square rounded-sm ${color} ${isToday ? "ring-2 ring-white" : ""} flex items-center justify-center`}>
                          {score !== null && (
                            <span className={`text-[9px] font-bold ${textColor} leading-none`}>{score}</span>
                          )}
                        </div>
                        {hoveredDay === i && logEntry && !isFuture && (
                          <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-zinc-800 border border-white/20 rounded-lg shadow-xl whitespace-nowrap text-xs pointer-events-none">
                            <p className="font-medium text-zinc-200 mb-1">
                              {dayDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} · Day {dayNum}
                            </p>
                            <div className="space-y-0.5 text-zinc-400">
                              {([
                                ["Weed", logEntry.weed],
                                ["LoL", logEntry.lol],
                                ["Poker", logEntry.poker],
                                ["Clarity", logEntry.clarity],
                                ["Gym", logEntry.gym],
                                ["Sleep", logEntry.sleep],
                                ["Meditate", logEntry.meditate],
                                ["Deep Work", logEntry.deepWork],
                                ["Ate Clean", logEntry.ateClean],
                              ] as [string, boolean | null][]).map(([label, val]) => (
                                <p key={label}>
                                  <span className={val === true ? "text-emerald-400" : val === false ? "text-red-400" : "text-zinc-600"}>
                                    {val === true ? "\u2713" : val === false ? "\u2717" : "\u2013"}
                                  </span>{" "}
                                  {label}
                                </p>
                              ))}
                              {score !== null && (
                                <p className="mt-1 pt-1 border-t border-white/10 text-zinc-300 font-medium">Score: {score}/8</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-zinc-600 mt-2">
              <span>Day 1</span>
              <span>Day 30</span>
              <span>Day 60</span>
              <span>Day 90</span>
            </div>
            <div className="flex items-center gap-3 mt-2 text-[10px] text-zinc-500">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-500 inline-block" /> 0-2</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-orange-500 inline-block" /> 3-4</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-lime-500 inline-block" /> 5-6</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-400 inline-block" /> 7-8</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-zinc-800 inline-block" /> Not logged</span>
            </div>
          </section>

          {/* Compact Reflections */}
          <section className="p-4 bg-zinc-900/60 backdrop-blur-md border border-white/10 rounded-xl">
            <p className="text-xs text-zinc-400 uppercase mb-2">Recent Reflections (7d)</p>
            {data.reflectionsSummary.length > 0 ? (
              <div className="space-y-1.5">
                {data.reflectionsSummary.map((bullet, i) => (
                  <p key={i} className="text-sm text-zinc-300">
                    <span className="text-xs text-zinc-500 font-mono mr-2">{bullet.domain}</span>
                    {bullet.insight}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-500">
                No reflections this week. Use /reflect to capture one.
              </p>
            )}
          </section>

          {/* Daily Insight */}
          <DailyInsight data={data.insight} />
        </div>
      </div>

      <TrendModal
        open={Boolean(activeHabitKey)}
        onClose={() => setActiveHabitKey(null)}
        title={activeHabitKey ? HABIT_CONFIG[activeHabitKey].label : "Habit Trend"}
        subtitle="Rolling 7-day adherence"
        sidebar={
          activeHabitKey && data.habitLogs?.[activeHabitKey] ? (
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
                <p className="mt-1 text-xs text-zinc-500">
                  Last 14d: {activeHabitSummary.recentAdherence}%
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </TrendModal>
    </div>
  );
}
