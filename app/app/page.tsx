"use client";

import { useState, useEffect, useCallback } from "react";
import { config } from "./lib/config";
import Link from "next/link";
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
  weed: boolean;
  lol: boolean;
  poker: boolean;
  gym: boolean;
  sleep: boolean;
  meditate: boolean;
  deepWork: boolean;
  ateClean: boolean;
}

interface PlanItem {
  start: number;
  end: number;
  item: string;
  done: string;
  notes: string;
}

interface AppData {
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
  todaysPlan: PlanItem[];
}

export default function Home() {
  const [data, setData] = useState<AppData | null>(null);
  const [insight, setInsight] = useState<InsightData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(() => {
    Promise.all([
      fetch("/api/log").then((res) => res.json()),
      fetch("/api/insight").then((res) => res.json()),
    ])
      .then(([logData, insightData]) => {
        setData(logData);
        setInsight(insightData);
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

  // Status row data
  const templateKey = data.nextWorkout;
  const gymDone = data.gymToday;

  // Plan summary
  const planTotal = data.todaysPlan.length;
  const planDone = data.todaysPlan.filter((p) => p.done === "1").length;

  // Recent weight trend (last 3 entries)
  const recentWeights = weight.log.slice(-3);
  const weightTrend = recentWeights.length >= 2
    ? recentWeights[recentWeights.length - 1].value - recentWeights[recentWeights.length - 2].value
    : 0;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="p-4 sm:p-6">
        <div className="max-w-lg mx-auto">

          {/* ==================== HEADER + NAV ==================== */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-lg font-bold">Hub</h1>
              <span className="text-xs text-zinc-500">
                {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              </span>
            </div>
            <div className="flex gap-2">
              <Link
                href="/plan"
                className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 hover:border-blue-400/50 transition-colors text-sm text-blue-400"
              >
                Plan
              </Link>
              <Link
                href="/health"
                className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 hover:border-emerald-400/50 transition-colors text-sm text-emerald-400"
              >
                Health
              </Link>
            </div>
          </div>

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

          {/* ==================== DAILY INSIGHT ==================== */}
          {insight && <DailyInsight data={insight} />}

          {/* ==================== 90-DAY DOPAMINE GRID ==================== */}
          <section className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-zinc-500 uppercase tracking-wide">90-Day Reset</span>
              <span className="text-xs text-zinc-600">
                {dopamineReset.streaks.weed}d weed · {dopamineReset.streaks.lol}d lol · {dopamineReset.streaks.poker}d poker
              </span>
            </div>
            <div className="flex gap-1 flex-wrap">
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
                  const coreClean = logEntry.weed && logEntry.lol;
                  const habits = [logEntry.gym, logEntry.sleep, logEntry.meditate, logEntry.deepWork, logEntry.ateClean];
                  const habitsDone = habits.filter(Boolean).length;

                  if (!coreClean) {
                    color = "bg-red-500";
                    status = "RELAPSE";
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
                    className={`group relative w-4 h-7 rounded-sm ${color} ${isToday ? "ring-2 ring-white" : ""} cursor-pointer`}
                  >
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
                            <div className={logEntry.weed ? "text-green-400" : "text-red-400"}>
                              {logEntry.weed ? "✓ No weed" : "✗ Smoked"}
                            </div>
                            <div className={logEntry.lol ? "text-green-400" : "text-red-400"}>
                              {logEntry.lol ? "✓ No LoL" : "✗ Played LoL"}
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

          {/* ==================== NAV CARDS ==================== */}
          <section className="grid grid-cols-2 gap-3">
            {/* Plan Card */}
            <Link
              href="/plan"
              className="block p-4 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-zinc-500 uppercase tracking-wide">Plan</span>
                <span className="text-zinc-600">&#8250;</span>
              </div>
              {planTotal === 0 ? (
                <p className="text-sm text-zinc-600">No plan today</p>
              ) : (
                <>
                  <p className="text-2xl font-bold">
                    {planDone}<span className="text-zinc-600 text-base font-normal">/{planTotal}</span>
                  </p>
                  <div className="mt-2 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${planTotal > 0 ? (planDone / planTotal) * 100 : 0}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-zinc-600 mt-1">
                    {planDone === planTotal ? "all done" : `${planTotal - planDone} remaining`}
                  </p>
                </>
              )}
            </Link>

            {/* Health Card */}
            <Link
              href="/health"
              className="block p-4 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-zinc-500 uppercase tracking-wide">Health</span>
                <span className="text-zinc-600">&#8250;</span>
              </div>
              <p className="text-2xl font-bold">
                {weight.current}<span className="text-zinc-600 text-base font-normal"> lbs</span>
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  gymDone
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-zinc-800 text-zinc-500"
                }`}>
                  {gymDone ? "Gym done" : `Day ${templateKey} next`}
                </span>
              </div>
              <p className="text-[10px] text-zinc-600 mt-1">
                {weight.goal} lbs goal
              </p>
            </Link>
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
