"use client";

import { useState, useEffect, useCallback } from "react";
import { config } from "./lib/config";
import Link from "next/link";

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

interface TodoItem {
  id: number;
  item: string;
  done: number;
  created: string;
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
  todos: TodoItem[];
}

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(() => {
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

  const { weight, dopamineReset, todos } = data;
  const resetDay = dopamineReset.dayNumber;
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const incompleteTodos = todos.filter((t) => t.done === 0);

  // Weekly target
  const weeklyTarget = weight.current - 2;

  // Current month target
  const currentMonthName = new Date().toLocaleString("en-US", { month: "short" });
  const currentMonthTarget = weight.checkpoints.find((c) => c.month === currentMonthName) || weight.checkpoints[0];

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
            <div className="flex gap-2">
              <Link
                href="/plan"
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/30 hover:border-blue-400/50 transition-colors"
              >
                <span className="text-sm text-blue-400">Plan</span>
              </Link>
              <button
                onClick={() => setSidebarOpen(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors"
              >
                <span className="text-sm">Todos</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                  {incompleteTodos.length}
                </span>
              </button>
            </div>
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

          {/* ==================== TODAY'S PLAN ==================== */}
          <section className="mb-6 p-4 bg-zinc-900 rounded-lg border border-zinc-800">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs text-zinc-500 uppercase tracking-wide">Today's Plan</span>
              <span className="text-xs text-zinc-600">{today}</span>
            </div>
            <div className="space-y-2">
              {data.todaysPlan.length === 0 ? (
                <p className="text-sm text-zinc-600">No plan for today</p>
              ) : (
                data.todaysPlan.map((item, i) => {
                  const formatTime = (t: number) => {
                    const hour = Math.floor(t);
                    const min = t % 1 === 0.5 ? "30" : "00";
                    const ampm = hour >= 12 ? "pm" : "am";
                    const h = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
                    return `${h}${min === "00" ? "" : ":" + min}${ampm}`;
                  };
                  const timeLabel = item.start === item.end
                    ? formatTime(item.start)
                    : `${formatTime(item.start)}-${formatTime(item.end)}`;
                  const isDone = item.done === "1";
                  const isSkipped = item.done === "0";

                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className={`w-5 h-5 rounded border flex items-center justify-center text-xs ${
                        isDone ? "border-green-600 text-green-400" :
                        isSkipped ? "border-red-600 text-red-400" :
                        "border-zinc-700 text-zinc-600"
                      }`}>
                        {isDone ? "✓" : isSkipped ? "✗" : "○"}
                      </span>
                      <span className="text-xs text-zinc-500 w-20">{timeLabel}</span>
                      <span className={`text-sm ${isDone ? "text-zinc-500 line-through" : "text-zinc-300"}`}>{item.item}</span>
                      {item.notes && <span className="text-xs text-zinc-500 ml-1">— {item.notes}</span>}
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* ==================== TODAY'S WORKOUT ==================== */}
          {(() => {
            const templateKey = data.nextWorkout;
            const allExercises = [
              ...config.exercises.push,
              ...config.exercises.pull,
              ...config.exercises.legs,
              ...config.exercises.core,
            ];

            const template = config.workoutTemplates[templateKey];
            if (!template) return null;
            const exercises = template.map(id => allExercises.find(e => e.id === id)!);
            const totalSets = exercises.reduce((sum, e) => sum + e.sets, 0);
            const gymDone = data.gymToday;

            const handleMarkDone = async () => {
              const todayStr = new Date().toISOString().split("T")[0];
              await fetch("/api/log", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  entries: [{ date: todayStr, metric: "gym", value: "1", notes: `Day ${templateKey}` }],
                }),
              });
              fetchData();
            };

            return (
              <section className="mb-6 p-4 bg-zinc-900 rounded-lg border border-zinc-800">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs text-zinc-500 uppercase tracking-wide">Next Workout</span>
                  <span className="text-xs text-zinc-500">
                    Day {templateKey} · {totalSets} sets
                  </span>
                </div>
                <div className="space-y-2">
                  {exercises.map((ex) => (
                    <div key={ex.id} className="flex items-center gap-3">
                      <span className={`w-5 h-5 rounded border flex items-center justify-center text-xs ${
                        gymDone ? "border-green-600 text-green-400" : "border-zinc-700 text-zinc-600"
                      }`}>
                        {gymDone ? "✓" : "○"}
                      </span>
                      <span className={`text-sm flex-1 ${gymDone ? "text-zinc-500" : "text-zinc-300"}`}>{ex.name}</span>
                      <span className="text-xs text-zinc-500">{ex.sets} × {ex.reps}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3">
                  {gymDone ? (
                    <span className="text-xs text-green-400">Done today</span>
                  ) : (
                    <button
                      onClick={handleMarkDone}
                      className="px-3 py-1.5 text-xs rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:border-emerald-400/50 transition-colors"
                    >
                      Mark Done
                    </button>
                  )}
                </div>
              </section>
            );
          })()}

          {/* ==================== 90-DAY TIMELINE ==================== */}
          <section className="mb-6">
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

          {/* ==================== TRIGGERS ==================== */}
          <section className="mb-6 p-4 bg-zinc-900 rounded-lg border border-zinc-800">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs text-zinc-500 uppercase tracking-wide">Triggers</span>
              <span className="text-xs text-zinc-600">{dopamineReset.triggers.length} logged</span>
            </div>

            {/* Known triggers */}
            <div className="space-y-2 mb-4">
              {config.knownTriggers.map((t, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                    t.risk === "HIGH" ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"
                  }`}>{t.risk}</span>
                  <span className="text-zinc-300">{t.trigger}</span>
                  <span className="text-zinc-600 text-xs">— {t.pattern}</span>
                </div>
              ))}
            </div>

            {/* Logged incidents */}
            {dopamineReset.triggers.length > 0 && (
              <>
                <div className="border-t border-zinc-800 pt-3 mt-3">
                  <p className="text-xs text-zinc-600 uppercase mb-2">Incident Log</p>
                  <div className="space-y-2">
                    {[...dopamineReset.triggers].reverse().map((t, i) => (
                      <div key={i} className="flex items-start gap-3 text-sm p-2 rounded bg-zinc-800/50">
                        <span className="text-xs text-zinc-500 whitespace-nowrap mt-0.5">{t.date}</span>
                        <div>
                          <span className="text-red-400">{t.trigger}</span>
                          {t.result && <span className="text-zinc-500 text-xs ml-2">→ {t.result}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </section>

          {/* ==================== WEIGHT PROGRESS BAR ==================== */}
          <section className="mb-6 p-4 bg-zinc-900 rounded-lg border border-zinc-800">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs text-zinc-500 uppercase tracking-wide">Weight</span>
            </div>

            {/* Progress bar container */}
            <div className="relative">
              {/* Weight labels above bar */}
              <div className="relative h-8 mb-1">
                {/* Start weight */}
                <div className="absolute left-0 -translate-x-1/2 text-center">
                  <span className="text-xs text-zinc-500">{weight.start}</span>
                </div>

                {/* Current weight */}
                <div
                  className="absolute -translate-x-1/2 text-center"
                  style={{ left: `${((weight.start - weight.current) / (weight.start - weight.goal)) * 100}%` }}
                >
                  <span className="text-sm font-semibold text-blue-400">{weight.current}</span>
                </div>

                {/* This week target */}
                <div
                  className="absolute -translate-x-1/2 text-center"
                  style={{ left: `${((weight.start - weeklyTarget) / (weight.start - weight.goal)) * 100}%` }}
                >
                  <span className="text-xs text-zinc-400">{weeklyTarget}</span>
                </div>

                {/* Goal weight */}
                <div className="absolute right-0 translate-x-1/2 text-center">
                  <span className="text-xs text-emerald-400">{weight.goal}</span>
                </div>
              </div>

              {/* The bar itself */}
              <div className="relative h-3 bg-zinc-800 rounded-full">
                {/* Progress fill */}
                <div
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full"
                  style={{ width: `${((weight.start - weight.current) / (weight.start - weight.goal)) * 100}%` }}
                />

                {/* Start marker */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-zinc-600 border-2 border-zinc-500" />

                {/* Current weight marker */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-blue-500 border-2 border-blue-300"
                  style={{ left: `${((weight.start - weight.current) / (weight.start - weight.goal)) * 100}%` }}
                />

                {/* This week target marker */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-zinc-700 border-2 border-zinc-500"
                  style={{ left: `${((weight.start - weeklyTarget) / (weight.start - weight.goal)) * 100}%` }}
                />

                {/* Monthly checkpoint markers */}
                {weight.checkpoints.slice(0, -1).map((cp) => (
                  <div
                    key={cp.month}
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-zinc-700 border border-zinc-500"
                    style={{ left: `${((weight.start - cp.target) / (weight.start - weight.goal)) * 100}%` }}
                  />
                ))}

                {/* Goal marker (star) */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 rounded-full bg-emerald-500 border-2 border-emerald-300" />
              </div>

              {/* Month labels below bar */}
              <div className="relative h-10 mt-1">
                {/* Monthly checkpoints */}
                {weight.checkpoints.map((cp) => (
                  <div
                    key={cp.month}
                    className="absolute -translate-x-1/2 text-center"
                    style={{ left: `${((weight.start - cp.target) / (weight.start - weight.goal)) * 100}%` }}
                  >
                    <span className="text-xs text-zinc-500 block">{cp.month}</span>
                    <span className="text-xs text-zinc-600">{cp.target}</span>
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 text-xs text-zinc-500 mt-2">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-zinc-600 border-2 border-zinc-500" /> start
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-blue-500 border-2 border-blue-300" /> current
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rotate-45 bg-zinc-700 border-2 border-zinc-500" /> week
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-zinc-700 border border-zinc-500" /> monthly
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-emerald-300" /> goal
                </span>
              </div>
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
          {incompleteTodos.map((todo) => (
            <div
              key={todo.id}
              className="p-3 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-between"
            >
              <span className="text-sm text-zinc-300">{todo.item}</span>
              <span className="text-lg text-zinc-600">○</span>
            </div>
          ))}

          {todos.filter((t) => t.done === 1).length > 0 && (
            <>
              <div className="pt-4 pb-2">
                <p className="text-xs text-zinc-600 uppercase">Completed</p>
              </div>
              {todos
                .filter((t) => t.done === 1)
                .map((todo) => (
                  <div
                    key={todo.id}
                    className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-800 flex items-center justify-between"
                  >
                    <span className="text-sm text-zinc-500 line-through">{todo.item}</span>
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
