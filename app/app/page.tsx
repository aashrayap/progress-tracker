"use client";

import { useCallback, useEffect, useState } from "react";
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
  weed: boolean | null;
  lol: boolean | null;
  poker: boolean | null;
  gym: boolean | null;
  sleep: boolean | null;
  meditate: boolean | null;
  deepWork: boolean | null;
  ateClean: boolean | null;
}

interface NextAction {
  label: string;
  reason: string;
  href: string;
  cta: string;
}

interface AppData {
  nowWindow: "morning" | "day" | "evening";
  gymToday: boolean;
  weight: WeightData;
  dopamineReset: {
    startDate: string;
    dayNumber: number;
    days: number;
    log: DopamineDay[];
    streaks: { lol: number; weed: number; poker: number };
  };
  todaysPlan: { start: number; end: number; item: string; done: string; notes: string }[];
  todos: { id: number; item: string; done: number; created: string }[];
  insight: InsightData;
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
  nextAction: NextAction;
}

function clamp(n: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, n));
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

  const undonePlan = data.todaysPlan.filter((p) => p.done !== "1");
  const undoneTodos = data.todos.filter((t) => !t.done);
  const resetDay = Math.max(1, Math.min(data.dopamineReset.dayNumber, data.dopamineReset.days));

  const start = data.weight.start;
  const current = data.weight.current;
  const goal = data.weight.goal;
  const denom = Math.abs(start - goal);
  const rawProgress =
    denom === 0
      ? 1
      : start >= goal
        ? (start - current) / denom
        : (current - start) / denom;
  const weightProgress = clamp(rawProgress);

  const lbsToGoal = Math.max(0, Math.round(data.weight.current - data.weight.goal));

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
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
            <h1 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">Hub</h1>
          </header>

          <section className="p-4 bg-zinc-900 border border-zinc-700 rounded-lg">
            <p className="text-xs text-zinc-500 uppercase mb-2">Next Action</p>
            <p className="text-lg font-semibold text-zinc-100">{data.nextAction.label}</p>
            <p className="text-sm text-zinc-400 mt-1">{data.nextAction.reason}</p>
            <Link
              href={data.nextAction.href}
              className="inline-flex mt-3 px-3 py-1.5 rounded border border-zinc-600 text-sm text-zinc-100 hover:border-zinc-500"
            >
              {data.nextAction.cta}
            </Link>
          </section>

          {undonePlan.length > 0 || undoneTodos.length > 0 ? (
            <section className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
              <p className="text-xs text-zinc-500 uppercase mb-2">Today Queue</p>
              <div className="space-y-1">
                {undonePlan.slice(0, 3).map((block, idx) => (
                  <p key={`${block.item}-${idx}`} className="text-sm text-zinc-300">
                    <span className="text-zinc-500 text-xs mr-2">{formatHour(block.start)}</span>
                    {block.item}
                  </p>
                ))}
                {undoneTodos.slice(0, 3).map((todo) => (
                  <p key={todo.id} className="text-sm text-zinc-300">
                    <span className="text-zinc-600 mr-1.5">○</span>
                    {todo.item}
                  </p>
                ))}
              </div>
              <div className="mt-2 flex items-center gap-3 text-xs text-zinc-500">
                {undonePlan.length > 0 && <Link href="/plan" className="hover:text-zinc-300">Open Plan</Link>}
                {data.reviewBacklog.total > 0 && <Link href="/review" className="hover:text-zinc-300">Open Review ({data.reviewBacklog.total})</Link>}
              </div>
            </section>
          ) : null}

          <section className="grid gap-3 sm:grid-cols-2">
            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
              <p className="text-xs text-zinc-500 uppercase">Weight</p>
              <div className="flex items-end justify-between mt-2">
                <p className="text-2xl font-semibold text-zinc-100">{data.weight.current} lbs</p>
                <p className="text-xs text-zinc-500">goal {data.weight.goal}</p>
              </div>
              <div className="mt-3 h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500"
                  style={{ width: `${Math.round(weightProgress * 100)}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-zinc-500">
                {lbsToGoal} lbs to go · started at {data.weight.start}
              </p>
            </div>

            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
              <p className="text-xs text-zinc-500 uppercase">Recovery</p>
              <p className="mt-2 text-2xl font-semibold text-zinc-100">
                Day {resetDay}/{data.dopamineReset.days}
              </p>
              <p className="mt-2 text-xs text-zinc-500">
                {data.dopamineReset.streaks.weed}d weed · {data.dopamineReset.streaks.lol}d lol · {data.dopamineReset.streaks.poker}d poker
              </p>
              <div className="mt-3 h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500"
                  style={{ width: `${Math.round((resetDay / data.dopamineReset.days) * 100)}%` }}
                />
              </div>
            </div>
          </section>

          <DailyInsight data={data.insight} />

          <section className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
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
                          className={`w-6 h-6 rounded ${
                            val === true
                              ? "bg-emerald-500"
                              : val === false
                                ? "bg-red-500"
                                : "bg-zinc-800"
                          } ${isToday ? "ring-2 ring-zinc-400 ring-offset-1 ring-offset-zinc-950" : ""}`}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-zinc-500 uppercase tracking-wide">90-Day Reset</span>
              <span className="text-xs text-zinc-600">Day {resetDay}</span>
            </div>
            <div className="flex flex-wrap -m-0.5">
              {Array.from({ length: 90 }, (_, i) => {
                const dayNum = i + 1;
                const [year, month, day] = data.dopamineReset.startDate.split("-").map(Number);
                const dayDate = new Date(year, month - 1, day + i);
                const dateStr = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, "0")}-${String(dayDate.getDate()).padStart(2, "0")}`;

                const logEntry = data.dopamineReset.log.find((l) => l.date === dateStr);
                const isToday = dayNum === resetDay;
                const isFuture = dayNum > resetDay;

                let color = "bg-zinc-800";
                if (logEntry) {
                  const coreLogged = logEntry.weed !== null || logEntry.lol !== null;
                  const coreClean = (logEntry.weed ?? true) && (logEntry.lol ?? true);
                  const habits = [
                    logEntry.gym,
                    logEntry.sleep,
                    logEntry.meditate,
                    logEntry.deepWork,
                    logEntry.ateClean,
                  ];
                  const habitsDone = habits.filter(Boolean).length;

                  if (coreLogged && !coreClean) color = "bg-red-500";
                  else if (!coreLogged) color = habitsDone > 0 ? "bg-zinc-600" : "bg-zinc-800";
                  else if (habitsDone <= 2) color = "bg-yellow-500";
                  else if (habitsDone <= 4) color = "bg-teal-500";
                  else color = "bg-emerald-400";
                }

                if (isFuture) color = "bg-zinc-800";

                return (
                  <div key={dayNum} className="p-0.5">
                    <div className={`w-3.5 h-6 rounded-sm ${color} ${isToday ? "ring-2 ring-white" : ""}`} />
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
          </section>
        </div>
      </div>
    </div>
  );
}
