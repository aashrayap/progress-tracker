"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { config, getSplitForDate } from "./lib/config";
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
  todaysPlan: { done: string }[];
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
  reviewBacklog: {
    total: number;
    new: number;
    needsReview: number;
    failed: number;
  };
  nextAction: {
    label: string;
    reason: string;
    href: string;
    cta: string;
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

  const { weight, dopamineReset } = data;
  const resetDay = dopamineReset.dayNumber;
  const todaySplit = getSplitForDate(new Date());
  const allExercises = Object.values(config.exercises).flat();
  const exerciseById = new Map(allExercises.map((exercise) => [exercise.id, exercise]));
  const todayLiftSummary = todaySplit.workoutKey
    ? (config.workoutTemplates[todaySplit.workoutKey] || [])
        .map((exerciseId) => exerciseById.get(exerciseId)?.name || exerciseId)
        .join(" / ")
    : "";

  // Status row data
  const templateKey = data.nextWorkout;
  const gymDone = data.gymToday;

  // Recent weight trend (last 3 entries)
  const recentWeights = weight.log.slice(-3);
  const weightTrend = recentWeights.length >= 2
    ? recentWeights[recentWeights.length - 1].value - recentWeights[recentWeights.length - 2].value
    : 0;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="p-4 sm:p-6">
        <div className="max-w-lg mx-auto">

          {/* ==================== NORTH STAR ==================== */}
          <div className="mb-5 p-4 rounded-lg border border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950">
            <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">North Star</p>
            <p className="text-sm text-zinc-300 leading-relaxed">
              A calm mind, a fit body, and a house full of love.
            </p>
            <p className="text-xs text-zinc-500 mt-2">
              Meaningful relationships · Mental clarity · Time spent on what I love
            </p>
          </div>

          {/* ==================== HEADER ==================== */}
          <div className="mb-4">
            <h1 className="text-lg font-bold">Hub</h1>
            <span className="text-xs text-zinc-500">
              {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            </span>
          </div>

          {/* ==================== HABITS VISUAL ==================== */}
          <section className="mb-5">
            <p className="text-xs text-zinc-500 uppercase mb-2">Daily Habits</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { key: "sleep", label: "Sleep (Last Night)", value: data.todayHabits.sleep },
                { key: "gym", label: "Gym", value: data.todayHabits.gym },
                { key: "weed", label: "No Weed", value: data.todayHabits.weed },
                { key: "ateClean", label: "Eat Clean", value: data.todayHabits.ateClean },
                { key: "deepWork", label: "Deep Work", value: data.todayHabits.deepWork },
                { key: "meditate", label: "Meditate", value: data.todayHabits.meditate },
                { key: "lol", label: "No LoL", value: data.todayHabits.lol },
                { key: "poker", label: "No Poker", value: data.todayHabits.poker },
              ].map((h) => (
                <div
                  key={h.key}
                  className={`p-3 rounded-lg border ${
                    h.value === null
                      ? "bg-zinc-900 border-zinc-800"
                      : h.value
                        ? "bg-emerald-500/10 border-emerald-500/30"
                        : "bg-red-500/10 border-red-500/30"
                  }`}
                >
                  <p className="text-xs text-zinc-500 mb-1">{h.label}</p>
                  <p
                    className={`text-sm font-semibold ${
                      h.value === null ? "text-zinc-500" : h.value ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {h.value === null ? "--" : h.value ? "Done" : "Missed"}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* ==================== STATUS ROW ==================== */}
          <section className="mb-5">
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-center">
                <p className="text-xs text-zinc-500 mb-1">Day</p>
                <p className="text-xl font-bold text-blue-400">{resetDay}</p>
                <p className="text-[10px] text-zinc-600">of 90</p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-center">
                <p className="text-xs text-zinc-500 mb-1">Weight</p>
                <p className="text-xl font-bold">{weight.current}</p>
                <p className={`text-[10px] ${weightTrend < 0 ? "text-green-400" : weightTrend > 0 ? "text-red-400" : "text-zinc-600"}`}>
                  {weightTrend < 0 ? `${weightTrend.toFixed(1)}` : weightTrend > 0 ? `+${weightTrend.toFixed(1)}` : "--"}
                </p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-center">
                <p className="text-xs text-zinc-500 mb-1">Workout</p>
                <p className="text-xl font-bold">Day {templateKey}</p>
                <p className="text-[10px] text-zinc-600">
                  {config.workoutTemplates[templateKey]?.length || 0} lifts
                </p>
              </div>
              <div className={`border rounded-lg p-3 text-center ${
                gymDone
                  ? "bg-emerald-500/10 border-emerald-500/30"
                  : "bg-zinc-900 border-zinc-800"
              }`}>
                <p className="text-xs text-zinc-500 mb-1">Gym</p>
                <p className={`text-xl font-bold ${gymDone ? "text-emerald-400" : "text-zinc-500"}`}>
                  {gymDone ? "Done" : "--"}
                </p>
                <p className="text-[10px] text-zinc-600">{gymDone ? "today" : "pending"}</p>
              </div>
            </div>
          </section>

          <section className="mb-5 p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-zinc-500 uppercase">Today&apos;s Training</p>
              <Link href="/health" className="text-xs text-blue-300 hover:text-blue-200">
                Open Health
              </Link>
            </div>
            <p className="mt-2 text-sm font-medium text-zinc-100">
              {todaySplit.label}
              {todaySplit.workoutKey ? ` (${todaySplit.workoutKey})` : ""}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {todaySplit.workoutKey
                ? `${todayLiftSummary} + ${config.trainingPlan.liftSessionCardioFinisherMin}m cardio`
                : `${todaySplit.detail} · ${todaySplit.minutes || 0} min`}
            </p>
            <p className="mt-3 text-xs text-zinc-400">
              Home dose: {config.trainingPlan.homeDose.pullupsPerDay} pull-ups + {config.trainingPlan.homeDose.pushupsPerDay} push-ups
            </p>
          </section>

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

          {/* ==================== NEXT ACTION ==================== */}
          <section className="mb-5 p-4 bg-zinc-900 border border-blue-500/30 rounded-lg">
            <p className="text-xs text-zinc-500 uppercase mb-2">Next Action</p>
            <p className="text-sm text-zinc-200 font-medium">{data.nextAction.label}</p>
            <p className="text-xs text-zinc-500 mt-1">{data.nextAction.reason}</p>
            <div className="mt-3 flex items-center gap-2">
              <Link
                href={data.nextAction.href}
                className="px-3 py-1.5 rounded bg-blue-500/20 border border-blue-500/40 text-blue-300 text-sm"
              >
                {data.nextAction.cta}
              </Link>
              <Link
                href="/review"
                className="text-xs text-zinc-400 hover:text-zinc-200"
              >
                Review queue: {data.reviewBacklog.total}
              </Link>
            </div>
          </section>

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
            <p className="text-xs text-zinc-500 mt-2 pl-3 border-l border-zinc-800">
              {config.why}
            </p>
          </details>

        </div>
      </div>
    </div>
  );
}
