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

          {/* ==================== WEIGHT CARD (SIMPLIFIED) ==================== */}
          <section className="mb-6 p-4 bg-zinc-900 rounded-lg border border-zinc-800">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs text-zinc-500 uppercase tracking-wide">Weight</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700 text-center">
                <div className="text-xs text-zinc-500 mb-1">This Week</div>
                <div className="text-xl font-semibold text-blue-400">{weeklyTarget}</div>
              </div>
              <div className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700 text-center">
                <div className="text-xs text-zinc-500 mb-1">{currentMonthTarget.month}</div>
                <div className="text-xl font-semibold text-blue-400">{currentMonthTarget.target}</div>
              </div>
              <div className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700 text-center">
                <div className="text-xs text-zinc-500 mb-1">June 1</div>
                <div className="text-xl font-semibold text-blue-400">{weight.goal}</div>
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
