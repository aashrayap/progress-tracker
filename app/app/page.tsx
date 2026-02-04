"use client";

import { useState, useEffect } from "react";
import { config } from "./lib/config";

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

interface AppData {
  weight: WeightData;
  dopamineReset: {
    startDate: string;
    dayNumber: number;
    days: number;
    log: DopamineDay[];
    streaks: { lol: number; weed: number; poker: number };
    triggers: { date: string; trigger: string; result: string }[];
  };
}

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [resetDetailsOpen, setResetDetailsOpen] = useState(false);
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/log")
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load data:", err);
        setLoading(false);
      });
  }, []);

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
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const incompleteTodos = config.todos.filter((t) => !t.done);
  const todayTodos = config.todos.filter((t) => t.today);

  // 90-day metrics from log
  const sortedLog = [...dopamineReset.log].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  let streak = 0;
  for (const day of sortedLog) {
    if (day.weed && day.lol) streak++;
    else break;
  }

  const redDays = dopamineReset.log.filter((d) => !d.weed || !d.lol).length;
  const goodOrBetterDays = dopamineReset.log.filter((d) => {
    if (!d.weed || !d.lol) return false;
    const habits = [d.gym, d.sleep, d.meditate, d.deepWork, d.ateClean];
    return habits.filter(Boolean).length >= 3;
  }).length;

  // Weight calculations
  const lbsLost = weight.start - weight.current;
  const lbsRemaining = weight.current - weight.goal;
  const totalToLose = weight.start - weight.goal;
  const progressPercent = Math.max(0, Math.min(100, Math.round((lbsLost / totalToLose) * 100)));

  const weightDeadline = new Date(weight.deadline);
  const now = new Date();
  const weeksRemaining = Math.max(1, Math.ceil(
    (weightDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 7)
  ));
  const neededPacePerWeek = lbsRemaining / weeksRemaining;
  const onTrack = neededPacePerWeek <= 2;

  // Weekly target
  const weeklyTarget = weight.current - 2;

  // Current month target
  const currentMonthName = new Date().toLocaleString("en-US", { month: "short" });
  const currentMonthTarget = weight.checkpoints.find((c) => c.month === currentMonthName) || weight.checkpoints[0];
  const monthlyToGo = weight.current - currentMonthTarget.target;

  // Get today's log entry
  const todayStr = new Date().toISOString().split("T")[0];
  const todayLog = dopamineReset.log.find((l) => l.date === todayStr);

  // Determine today's status for 90-day reset
  const getTodayStatus = () => {
    if (!todayLog) return { label: "NO DATA", color: "text-zinc-400", bg: "bg-zinc-800" };
    const coreClean = todayLog.weed && todayLog.lol;
    if (!coreClean) return { label: "RELAPSE", color: "text-red-400", bg: "bg-red-500/20" };
    const habits = [todayLog.gym, todayLog.sleep, todayLog.meditate, todayLog.deepWork, todayLog.ateClean];
    const habitCount = habits.filter(Boolean).length;
    if (habitCount >= 5) return { label: "PERFECT", color: "text-emerald-400", bg: "bg-emerald-500/20" };
    if (habitCount >= 3) return { label: "GOOD", color: "text-teal-400", bg: "bg-teal-500/20" };
    return { label: "CLEAN", color: "text-yellow-400", bg: "bg-yellow-500/20" };
  };
  const todayStatus = getTodayStatus();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <header className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Progress</h1>
              <p className="text-zinc-500">{today}</p>
            </div>
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors"
            >
              <span className="text-sm">Todos</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                {incompleteTodos.length}
              </span>
            </button>
          </header>

          {/* WHY */}
          <div className="mb-6 p-4 rounded-lg bg-gradient-to-r from-zinc-900 to-zinc-900/50 border border-zinc-800">
            <p className="text-sm text-zinc-300">
              <span className="text-zinc-500 mr-2">WHY:</span>
              {config.why}
            </p>
          </div>

          {/* Priorities */}
          <div className="flex gap-3 mb-6">
            {config.priorities.map((p, i) => (
              <span
                key={p}
                className="px-2 py-1 text-xs rounded bg-zinc-900 border border-zinc-800 text-zinc-400"
              >
                <span className="text-zinc-600">{i + 1}·</span>
                {p}
              </span>
            ))}
          </div>

          {/* ==================== WEIGHT CARD (REDESIGNED) ==================== */}
          <section className="mb-6 p-5 bg-zinc-900 rounded-lg border border-zinc-800">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs text-zinc-500 uppercase tracking-wide">Weight</span>
              <span className={`text-xs px-2 py-1 rounded ${onTrack ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                {onTrack ? "✓ On pace" : "⚠ Behind pace"}
              </span>
            </div>

            {/* Main progress */}
            <div className="mb-4">
              {/* Current weight - big and clear */}
              <div className="flex items-baseline justify-between mb-3">
                <div>
                  <span className="text-4xl font-bold">{weight.current}</span>
                  <span className="text-2xl text-zinc-400 ml-1">lbs</span>
                </div>
                <div className="text-right text-sm text-zinc-500">
                  Started: {weight.start} lbs
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-3 bg-zinc-800 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">{lbsLost} lost</span>
                <span className="text-zinc-500">{progressPercent}% to goal</span>
                <span className="text-blue-400">{lbsRemaining} to go → {weight.goal}</span>
              </div>
            </div>

            {/* Weekly & Monthly targets */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
                <div className="text-xs text-zinc-500 mb-1">This Week</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-semibold text-blue-400">{weeklyTarget}</span>
                  <span className="text-sm text-zinc-500">(-2 lbs)</span>
                </div>
              </div>
              <div className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
                <div className="text-xs text-zinc-500 mb-1">{currentMonthTarget.month} Target</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-semibold text-blue-400">{currentMonthTarget.target}</span>
                  <span className="text-sm text-zinc-500">(-{monthlyToGo} lbs)</span>
                </div>
              </div>
            </div>

            {/* Monthly milestones */}
            <div className="flex items-center gap-2 text-sm">
              {weight.checkpoints.map((checkpoint) => {
                const hit = weight.current <= checkpoint.target;
                return (
                  <div key={checkpoint.month} className="flex items-center gap-1">
                    <span className={hit ? "text-green-400" : "text-zinc-600"}>
                      {hit ? "●" : "○"}
                    </span>
                    <span className={`${hit ? "text-green-400" : "text-zinc-500"}`}>
                      {checkpoint.month} {checkpoint.target}
                    </span>
                    {checkpoint.target !== weight.goal && <span className="text-zinc-700 mx-1">→</span>}
                  </div>
                );
              })}
            </div>
          </section>

          {/* ==================== 90-DAY RESET CARD (REDESIGNED) ==================== */}
          <section className="mb-8 p-5 bg-zinc-900 rounded-lg border border-zinc-800">
            {/* Header - always visible */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-zinc-500 uppercase tracking-wide">90-Day Reset</span>
            </div>

            {/* Daily Driver View - always visible */}
            <div className={`p-4 rounded-lg ${todayStatus.bg} border border-zinc-700 mb-4`}>
              <div className="flex items-center justify-between">
                <div className="text-center flex-1">
                  <div className="text-xs text-zinc-500 mb-1">Day</div>
                  <div className="text-2xl font-bold">{resetDay}</div>
                </div>
                <div className="text-center flex-1 border-x border-zinc-700">
                  <div className="text-xs text-zinc-500 mb-1">Status</div>
                  <div className={`text-xl font-bold ${todayStatus.color}`}>{todayStatus.label}</div>
                </div>
                <div className="text-center flex-1">
                  <div className="text-xs text-zinc-500 mb-1">Streak</div>
                  <div className="text-2xl font-bold text-green-400">{streak}</div>
                </div>
              </div>
            </div>

            {/* Simple progress bar */}
            <div className="mb-4">
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full"
                  style={{ width: `${(resetDay / 90) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-zinc-600 mt-1">
                <span>Day 1</span>
                <span>{resetDay} of 90</span>
                <span>Day 90</span>
              </div>
            </div>

            {/* Today's checklist - compact inline */}
            <div className="flex flex-wrap gap-2 mb-4 text-sm">
              <span className={todayLog?.weed ? "text-green-400" : "text-red-400"}>
                {todayLog?.weed ? "✓" : "✗"} Weed
              </span>
              <span className={todayLog?.lol ? "text-green-400" : "text-red-400"}>
                {todayLog?.lol ? "✓" : "✗"} LoL
              </span>
              <span className="text-zinc-600">|</span>
              <span className={todayLog?.gym ? "text-green-400" : "text-zinc-500"}>
                {todayLog?.gym ? "✓" : "○"} Gym
              </span>
              <span className={todayLog?.sleep ? "text-green-400" : "text-zinc-500"}>
                {todayLog?.sleep ? "✓" : "○"} Sleep
              </span>
              <span className={todayLog?.meditate ? "text-green-400" : "text-zinc-500"}>
                {todayLog?.meditate ? "✓" : "○"} Meditate
              </span>
              <span className={todayLog?.deepWork ? "text-green-400" : "text-zinc-500"}>
                {todayLog?.deepWork ? "✓" : "○"} Deep work
              </span>
              <span className={todayLog?.ateClean ? "text-green-400" : "text-zinc-500"}>
                {todayLog?.ateClean ? "✓" : "○"} Ate clean
              </span>
            </div>

            {/* Toggle Details Button */}
            <button
              onClick={() => setResetDetailsOpen(!resetDetailsOpen)}
              className="w-full py-2 text-sm text-zinc-400 hover:text-zinc-300 border-t border-zinc-800 flex items-center justify-center gap-2"
            >
              {resetDetailsOpen ? "Hide Details ▲" : "View Details ▼"}
            </button>

            {/* Expanded Details */}
            {resetDetailsOpen && (
              <div className="mt-4 pt-4 border-t border-zinc-800 space-y-4">
                {/* DON'T / DO boxes */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700">
                    <p className="text-xs text-red-400/70 uppercase tracking-wide mb-2">Don&apos;t</p>
                    <div className="space-y-1 text-sm">
                      <div className={todayLog?.weed ? "text-green-400" : "text-red-400"}>
                        {todayLog?.weed ? "✓" : "✗"} Weed
                      </div>
                      <div className={todayLog?.lol ? "text-green-400" : "text-red-400"}>
                        {todayLog?.lol ? "✓" : "✗"} LoL
                      </div>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700">
                    <p className="text-xs text-green-400/70 uppercase tracking-wide mb-2">Do</p>
                    <div className="space-y-1 text-sm">
                      <div className={todayLog?.gym ? "text-green-400" : "text-zinc-500"}>
                        {todayLog?.gym ? "✓" : "○"} Gym
                      </div>
                      <div className={todayLog?.sleep ? "text-green-400" : "text-zinc-500"}>
                        {todayLog?.sleep ? "✓" : "○"} Sleep 10pm
                      </div>
                      <div className={todayLog?.meditate ? "text-green-400" : "text-zinc-500"}>
                        {todayLog?.meditate ? "✓" : "○"} Meditate
                      </div>
                      <div className={todayLog?.deepWork ? "text-green-400" : "text-zinc-500"}>
                        {todayLog?.deepWork ? "✓" : "○"} Deep work
                      </div>
                      <div className={todayLog?.ateClean ? "text-green-400" : "text-zinc-500"}>
                        {todayLog?.ateClean ? "✓" : "○"} Ate clean
                      </div>
                    </div>
                  </div>
                </div>

                {/* 90-Day Timeline Grid */}
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">90-Day Timeline</p>
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

                      return (
                        <div
                          key={dayNum}
                          className={`group relative w-4 h-7 rounded-sm ${color} ${isToday ? "ring-2 ring-white" : ""} cursor-pointer`}
                        >
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            <div className="flex items-center justify-between gap-3 mb-1">
                              <span className="font-medium">{dateLabel}</span>
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
                </div>

                {/* Stats */}
                <div className="flex gap-4 text-xs">
                  <span className="text-teal-400">✓ {goodOrBetterDays} good+</span>
                  <span className="text-red-400">✗ {redDays} relapse</span>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-3 text-xs text-zinc-500">
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

                {/* Recent Triggers */}
                {dopamineReset.triggers.length > 0 && (
                  <div className="pt-3 border-t border-zinc-800">
                    <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">Recent Triggers</p>
                    <div className="space-y-2">
                      {dopamineReset.triggers.slice(-3).map((t, i) => (
                        <div key={i} className="text-xs text-zinc-400">
                          <span className="text-zinc-600">{t.date}</span> · {t.trigger}
                          {t.result && <span className="text-zinc-500"> → {t.result}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Today */}
          <section className="mb-8">
            <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wide mb-3">
              Today
            </h2>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-purple-400/70 mb-2 uppercase tracking-wide">Habits</p>
                <div className="space-y-2">
                  {config.habits.map((habit) => {
                    const done = todayLog?.sleep || false;
                    return (
                      <div
                        key={habit.id}
                        className={`p-3 rounded-lg border ${
                          done ? "bg-green-500/10 border-green-500/30" : "bg-zinc-900 border-purple-500/30"
                        } flex items-center justify-between`}
                      >
                        <span className={`text-sm ${done ? "text-green-400" : "text-zinc-300"}`}>
                          {habit.label}
                        </span>
                        <span className={`text-lg ${done ? "text-green-400" : "text-purple-400/50"}`}>
                          {done ? "✓" : "○"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-xs text-orange-400/70 mb-2 uppercase tracking-wide">Tasks</p>
                <div className="space-y-2">
                  {todayTodos.length > 0 ? (
                    todayTodos.map((todo) => (
                      <div
                        key={todo.id}
                        className={`p-3 rounded-lg border ${
                          todo.done ? "bg-green-500/10 border-green-500/30" : "bg-zinc-900 border-orange-500/30"
                        } flex items-center justify-between`}
                      >
                        <span className={`text-sm ${todo.done ? "text-green-400" : "text-zinc-300"}`}>
                          {todo.text}
                        </span>
                        <span className={`text-lg ${todo.done ? "text-green-400" : "text-orange-400/50"}`}>
                          {todo.done ? "✓" : "○"}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-zinc-600 p-3">No tasks for today</p>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* What I'm Doing Instead */}
          <section className="mb-8">
            <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wide mb-3">
              Replacing With
            </h2>
            <div className="flex flex-wrap gap-2">
              {config.replacing.map((item) => (
                <span
                  key={item.id}
                  className="px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/30 text-sm text-green-400"
                >
                  {item.label}
                </span>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-zinc-900 border-l border-zinc-800 z-50 transform transition-transform ${
          sidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="font-medium">All Todos</h2>
          <button onClick={() => setSidebarOpen(false)} className="p-1 hover:bg-zinc-800 rounded">
            ✕
          </button>
        </div>

        <div className="p-4 space-y-2 overflow-y-auto h-[calc(100%-60px)]">
          {config.todos
            .filter((t) => !t.done)
            .map((todo) => (
              <div
                key={todo.id}
                className="p-3 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-between"
              >
                <div>
                  <span className="text-sm text-zinc-300">{todo.text}</span>
                  {todo.today && (
                    <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">
                      today
                    </span>
                  )}
                </div>
                <span className="text-lg text-zinc-600">○</span>
              </div>
            ))}

          {config.todos.filter((t) => t.done).length > 0 && (
            <>
              <div className="pt-4 pb-2">
                <p className="text-xs text-zinc-600 uppercase">Completed</p>
              </div>
              {config.todos
                .filter((t) => t.done)
                .map((todo) => (
                  <div
                    key={todo.id}
                    className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-800 flex items-center justify-between"
                  >
                    <span className="text-sm text-zinc-500 line-through">{todo.text}</span>
                    <span className="text-lg text-green-400">✓</span>
                  </div>
                ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
