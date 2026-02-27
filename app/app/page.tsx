"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { config, getSplitForDate } from "./lib/config";
import { formatTime } from "./lib/utils";
import DailyInsight, { InsightData } from "./components/DailyInsight";

interface WeightData {
  current: number;
  start: number;
  goal: number;
  deadline: string;
  checkpoints: { month: string; target: number }[];
  log: { date: string; value: number }[];
}

interface DopamineDay {
  date: string;
  weed: boolean | null;
  lol: boolean | null;
  poker: boolean | null;
  gym: boolean | null;
  sleep: boolean | null;
  meditate: boolean | null;
  deepWork: boolean | null;
  ateClean: boolean | null;
}

interface AppData {
  nowWindow: "morning" | "day" | "evening";
  gymToday: boolean;
  nextWorkout: string;
  weight: WeightData;
  dopamineReset: {
    startDate: string;
    dayNumber: number;
    days: number;
    log: DopamineDay[];
    streaks: { lol: number; weed: number; poker: number };
    triggers: { date: string; trigger: string; result: string }[];
  };
  todaysPlan: { start: number; end: number; item: string; done: string; notes: string }[];
  yesterdaysPlan: { start: number; end: number; item: string; done: string; notes: string }[];
  todos: { id: number; item: string; done: number; created: string }[];
  yesterdayChanges: { domain: string; change: string }[];
  insight: InsightData;
  todayHabits: {
    weed: boolean | null;
    lol: boolean | null;
    poker: boolean | null;
    gym: boolean | null;
    sleep: boolean | null;
    meditate: boolean | null;
    deepWork: boolean | null;
    ateClean: boolean | null;
  };
  habitTracker: {
    dates: string[];
    days: Record<string, boolean>[];
  };
  reviewBacklog: {
    total: number;
    new: number;
    needsReview: number;
    failed: number;
  };
}

function domainLabel(domain: string): string {
  if (domain === "deep_work") return "Deep Work";
  if (domain === "gym") return "Gym";
  if (domain === "eating") return "Eating";
  if (domain === "sleep") return "Sleep";
  if (domain === "addiction") return "Recovery";
  return domain;
}

export default function Home() {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showYesterday, setShowYesterday] = useState(false);

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

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
        <p className="text-zinc-500">Loading...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
        <p className="text-red-400">Failed to load data</p>
      </div>
    );
  }

  const { dopamineReset } = data;
  const resetDay = dopamineReset.dayNumber;
  const todaySplit = getSplitForDate(new Date());
  const allExercises = Object.values(config.exercises).flat();
  const exerciseById = new Map(allExercises.map((exercise) => [exercise.id, exercise]));
  const todayLiftSummary = todaySplit.workoutKey
    ? (config.workoutTemplates[todaySplit.workoutKey] || [])
        .map((exerciseId) => exerciseById.get(exerciseId)?.name || exerciseId)
        .join(" / ")
    : "";

  const undonePlan = data.todaysPlan.filter((p) => p.done !== "1");
  const undoneTodos = (data.todos || []).filter((t) => !t.done).slice(0, 5);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="p-4 sm:p-6">
        <div className={`mx-auto transition-all ${showYesterday ? "max-w-4xl" : "max-w-xl"}`}>

          {/* ==================== HEADER ==================== */}
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-zinc-400">
              {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            </span>
            <h1 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">Hub</h1>
          </div>

          {/* ==================== NORTH STAR (subtle line) ==================== */}
          <p className="text-xs text-zinc-600 mb-5">
            A calm mind, a fit body, and a house full of love.
          </p>

          {/* ==================== 14-DAY HABIT TRACKER ==================== */}
          <section className="mb-5">
            <p className="text-xs text-zinc-500 uppercase mb-2">Daily Habits — 14 Days</p>
            <div className="space-y-2">
              {[
                { key: "sleep", label: "Sleep" },
                { key: "gym", label: "Gym" },
                { key: "weed", label: "No Weed" },
                { key: "ate_clean", label: "Eat Clean" },
                { key: "deep_work", label: "Deep Work" },
                { key: "meditate", label: "Meditate" },
                { key: "lol", label: "No LoL" },
                { key: "poker", label: "No Poker" },
              ].map((habit) => (
                <div key={habit.key} className="flex items-center gap-2.5">
                  <span className="text-xs text-zinc-500 w-[4.5rem] shrink-0 text-right truncate">{habit.label}</span>
                  <div className="flex gap-1">
                    {data.habitTracker.days.map((day, i) => {
                      const val = day[habit.key];
                      const isToday = i === data.habitTracker.days.length - 1;
                      return (
                        <div
                          key={data.habitTracker.dates[i]}
                          className={`w-7 h-7 rounded ${
                            val === true
                              ? "bg-emerald-500"
                              : val === false
                                ? "bg-red-500"
                                : "bg-zinc-800"
                          } ${isToday ? "ring-2 ring-zinc-400 ring-offset-1 ring-offset-zinc-950" : ""}`}
                          title={`${data.habitTracker.dates[i]}${val === true ? " ✓" : val === false ? " ✗" : ""}`}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 mt-2 pl-[72px] text-[10px] text-zinc-600">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Done</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-500" /> Missed</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-zinc-800" /> No data</span>
            </div>
          </section>

          {/* ==================== TODAY / YESTERDAY TOGGLE ==================== */}
          <div className="inline-flex rounded-md border border-zinc-700 overflow-hidden mb-3">
            <button
              onClick={() => setShowYesterday(true)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                showYesterday
                  ? "bg-zinc-700 text-zinc-100"
                  : "bg-zinc-900 text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Yesterday + Today
            </button>
            <button
              onClick={() => setShowYesterday(false)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors border-l border-zinc-700 ${
                !showYesterday
                  ? "bg-zinc-700 text-zinc-100"
                  : "bg-zinc-900 text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Today
            </button>
          </div>

          {/* ==================== YESTERDAY + TODAY CARDS ==================== */}
          <div className={`mb-5 ${showYesterday ? "grid grid-cols-1 md:grid-cols-2 gap-3" : ""}`}>

            {/* YESTERDAY CARD (left) */}
            {showYesterday && (
              <section className="p-4 bg-zinc-900/60 border border-zinc-800/60 rounded-lg space-y-4">
                <p className="text-xs text-zinc-500 uppercase tracking-wide">Yesterday</p>

                {data.yesterdaysPlan.length > 0 ? (
                  <div>
                    <p className="text-[11px] text-zinc-500 uppercase mb-1">Schedule</p>
                    <div className="space-y-1">
                      {data.yesterdaysPlan.map((block, i) => {
                        const done = block.done === "1";
                        return (
                          <p key={i} className={`text-sm ${done ? "text-zinc-500" : "text-zinc-300"}`}>
                            <span className={`mr-1.5 ${done ? "text-emerald-500" : "text-red-400"}`}>
                              {done ? "✓" : "✗"}
                            </span>
                            <span className="text-zinc-500 text-xs mr-2">{formatTime(block.start)}</span>
                            {done ? <s>{block.item}</s> : block.item}
                          </p>
                        );
                      })}
                    </div>
                    {(() => {
                      const total = data.yesterdaysPlan.length;
                      const completed = data.yesterdaysPlan.filter((b) => b.done === "1").length;
                      const pct = Math.round((completed / total) * 100);
                      return (
                        <p className={`text-xs mt-2 ${pct >= 80 ? "text-emerald-500" : pct >= 50 ? "text-yellow-500" : "text-red-400"}`}>
                          {completed}/{total} completed ({pct}%)
                        </p>
                      );
                    })()}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-600">No plan logged yesterday.</p>
                )}
              </section>
            )}

            {/* TODAY CARD (right when side-by-side) */}
            <section className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg space-y-4">
              <p className="text-xs text-zinc-500 uppercase tracking-wide">Today</p>

              {/* Training */}
              <div>
                <p className="text-[11px] text-zinc-500 uppercase mb-1">Training</p>
                <p className="text-sm font-medium text-zinc-100">
                  {todaySplit.label}
                  {todaySplit.workoutKey ? ` (${todaySplit.workoutKey})` : ""}
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {todaySplit.workoutKey
                    ? `${todayLiftSummary} + ${config.trainingPlan.liftSessionCardioFinisherMin}m cardio`
                    : `${todaySplit.detail} · ${todaySplit.minutes || 0} min`}
                </p>
                <p className="text-xs text-zinc-600 mt-1">
                  Home: {config.trainingPlan.homeDose.pullupsPerDay} PU + {config.trainingPlan.homeDose.pushupsPerDay} push-ups
                </p>
              </div>

              {/* Schedule (undone blocks only) */}
              {undonePlan.length > 0 && (
                <div>
                  <p className="text-[11px] text-zinc-500 uppercase mb-1">Schedule</p>
                  <div className="space-y-1">
                    {undonePlan.map((block, i) => (
                      <p key={i} className="text-sm text-zinc-300">
                        <span className="text-zinc-500 text-xs mr-2">{formatTime(block.start)}</span>
                        {block.item}
                      </p>
                    ))}
                  </div>
                  <Link href="/plan" className="text-xs text-blue-400 hover:text-blue-300 mt-1.5 inline-block">
                    → Open Plan
                  </Link>
                </div>
              )}

              {/* Todos (undone, max 5) */}
              {undoneTodos.length > 0 && (
                <div>
                  <p className="text-[11px] text-zinc-500 uppercase mb-1">Todos</p>
                  <div className="space-y-1">
                    {undoneTodos.map((todo) => (
                      <p key={todo.id} className="text-sm text-zinc-300">
                        <span className="text-zinc-600 mr-1.5">○</span>{todo.item}
                      </p>
                    ))}
                  </div>
                  <Link href="/plan" className="text-xs text-blue-400 hover:text-blue-300 mt-1.5 inline-block">
                    → Open Plan
                  </Link>
                </div>
              )}

              {/* Review queue */}
              {data.reviewBacklog.total > 0 && (
                <div className="flex items-center gap-2 pt-1 border-t border-zinc-800">
                  <span className="text-amber-400 text-xs">⚠</span>
                  <Link href="/review" className="text-sm text-zinc-300 hover:text-zinc-100">
                    {data.reviewBacklog.total} capture{data.reviewBacklog.total === 1 ? "" : "s"} need review
                  </Link>
                  <Link href="/review" className="text-xs text-blue-400 hover:text-blue-300 ml-auto">
                    → Open Review
                  </Link>
                </div>
              )}
            </section>
          </div>

          {/* ==================== MORNING PRIMING ==================== */}
          {data.nowWindow === "morning" && data.yesterdayChanges.length > 0 && (
            <section className="mb-5 p-4 bg-zinc-900 border border-amber-500/30 rounded-lg">
              <p className="text-xs text-zinc-500 uppercase mb-2">Morning Priming</p>
              <div className="space-y-1.5">
                {data.yesterdayChanges.map((item, i) => (
                  <p key={`${item.domain}-${i}`} className="text-sm text-zinc-300">
                    - {item.change} <span className="text-zinc-500">({domainLabel(item.domain)})</span>
                  </p>
                ))}
              </div>
            </section>
          )}

          {/* ==================== DAILY INSIGHT ==================== */}
          {data.insight && <DailyInsight data={data.insight} />}

          {/* ==================== 90-DAY DOPAMINE GRID ==================== */}
          <section className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-zinc-500 uppercase tracking-wide">90-Day Reset</span>
              <span className="text-xs text-zinc-600">
                {dopamineReset.streaks.weed}d weed · {dopamineReset.streaks.lol}d lol · {dopamineReset.streaks.poker}d poker
              </span>
            </div>
            <div className="flex flex-wrap -m-0.5">
              {Array.from({ length: 90 }, (_, i) => {
                const dayNum = i + 1;
                const [year, month, day] = dopamineReset.startDate.split("-").map(Number);
                const dayDate = new Date(year, month - 1, day + i);
                const dateStr = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, "0")}-${String(dayDate.getDate()).padStart(2, "0")}`;

                const logEntry = dopamineReset.log.find((l) => l.date === dateStr);
                const isToday = dayNum === resetDay;
                const isFuture = dayNum > resetDay;

                let color = "bg-zinc-800";
                let status = "";
                if (logEntry) {
                  const weedLogged = logEntry.weed !== null;
                  const lolLogged = logEntry.lol !== null;
                  const coreLogged = weedLogged || lolLogged;
                  const coreClean = (logEntry.weed ?? true) && (logEntry.lol ?? true);
                  const habits = [logEntry.gym, logEntry.sleep, logEntry.meditate, logEntry.deepWork, logEntry.ateClean];
                  const habitsDone = habits.filter(Boolean).length;

                  if (coreLogged && !coreClean) {
                    color = "bg-red-500";
                    status = "RELAPSE";
                  } else if (!coreLogged) {
                    color = habitsDone > 0 ? "bg-zinc-600" : "bg-zinc-800";
                    status = habitsDone > 0 ? "PARTIAL" : "";
                  } else if (habitsDone <= 2) {
                    color = "bg-yellow-500";
                    status = "CLEAN";
                  } else if (habitsDone <= 4) {
                    color = "bg-teal-500";
                    status = "GOOD";
                  } else {
                    color = "bg-emerald-400";
                    status = "PERFECT";
                  }
                }
                if (isFuture) color = "bg-zinc-800";

                const dateLabel = dayDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                const dayOfWeek = dayDate.toLocaleDateString("en-US", { weekday: "long" });

                return (
                  <div
                    key={dayNum}
                    className="group relative p-0.5 cursor-pointer"
                  >
                    <div
                      className={`w-4 h-7 rounded-sm ${color} ${isToday ? "ring-2 ring-white" : ""}`}
                    />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      <div className="flex items-center justify-between gap-3 mb-1">
                        <span className="font-medium">{dayOfWeek}, {dateLabel}</span>
                        <span className="text-zinc-500">Day {dayNum}</span>
                        {status && (
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            status === "RELAPSE" ? "bg-red-500/20 text-red-400" :
                            status === "CLEAN" ? "bg-yellow-500/20 text-yellow-400" :
                            status === "GOOD" ? "bg-teal-500/20 text-teal-400" :
                            "bg-emerald-500/20 text-emerald-400"
                          }`}>{status}</span>
                        )}
                      </div>
                      {logEntry && (
                        <>
                          <div className="pt-1 border-t border-zinc-700 space-y-0.5">
                            <div className={logEntry.weed === null ? "text-zinc-500" : logEntry.weed ? "text-green-400" : "text-red-400"}>
                              {logEntry.weed === null ? "○ Weed (not logged)" : logEntry.weed ? "✓ No weed" : "✗ Smoked"}
                            </div>
                            <div className={logEntry.lol === null ? "text-zinc-500" : logEntry.lol ? "text-green-400" : "text-red-400"}>
                              {logEntry.lol === null ? "○ LoL (not logged)" : logEntry.lol ? "✓ No LoL" : "✗ Played LoL"}
                            </div>
                          </div>
                          <div className="mt-1 pt-1 border-t border-zinc-700 space-y-0.5">
                            <div className={logEntry.gym ? "text-green-400" : "text-zinc-500"}>
                              {logEntry.gym ? "✓" : "○"} Gym
                            </div>
                            <div className={logEntry.sleep ? "text-green-400" : "text-zinc-500"}>
                              {logEntry.sleep ? "✓" : "○"} Sleep 10pm
                            </div>
                            <div className={logEntry.meditate ? "text-green-400" : "text-zinc-500"}>
                              {logEntry.meditate ? "✓" : "○"} Meditate
                            </div>
                            <div className={logEntry.deepWork ? "text-green-400" : "text-zinc-500"}>
                              {logEntry.deepWork ? "✓" : "○"} Deep work
                            </div>
                            <div className={logEntry.ateClean ? "text-green-400" : "text-zinc-500"}>
                              {logEntry.ateClean ? "✓" : "○"} Ate clean
                            </div>
                          </div>
                        </>
                      )}
                      {!logEntry && !isFuture && <div className="text-zinc-500 pt-1 border-t border-zinc-700">No data</div>}
                      {isFuture && <div className="text-zinc-500 pt-1 border-t border-zinc-700">Future</div>}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-xs text-zinc-600 mt-2">
              <span>Day 1</span>
              <span>Day 30</span>
              <span>Day 60</span>
              <span>Day 90</span>
            </div>
            {/* Legend */}
            <div className="flex flex-wrap gap-3 text-xs text-zinc-500 mt-3">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-emerald-400 rounded-sm" /> Perfect
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-teal-500 rounded-sm" /> Good
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-yellow-500 rounded-sm" /> Clean
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-red-500 rounded-sm" /> Relapse
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-zinc-800 rounded-sm ring-2 ring-white" /> Today
              </span>
            </div>
          </section>

          {/* WHY — collapsible footer */}
          <details className="mt-5">
            <summary className="text-xs text-zinc-600 cursor-pointer hover:text-zinc-500 transition-colors">
              WHY
            </summary>
            <div className="mt-2 pl-3 border-l border-zinc-800 space-y-1">
              <p className="text-xs text-zinc-500">{config.why}</p>
              <p className="text-xs text-zinc-600">
                Meaningful relationships · Mental clarity · Time spent on what I love
              </p>
            </div>
          </details>

        </div>
      </div>
    </div>
  );
}
