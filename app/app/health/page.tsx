"use client";

import { useState, useEffect, useCallback } from "react";
import { config } from "../lib/config";
import Link from "next/link";

interface WeightData {
  current: number;
  start: number;
  goal: number;
  deadline: string;
  checkpoints: { month: string; target: number }[];
  history: { date: string; value: number }[];
}

interface WorkoutSet {
  set: number;
  weight: number;
  reps: number;
  notes: string;
}

interface GroupedExercise {
  name: string;
  id: string;
  sets: WorkoutSet[];
}

interface WorkoutDay {
  date: string;
  workout: string;
  exercises: GroupedExercise[];
}

interface ExerciseProgressEntry {
  date: string;
  bestWeight: number;
  bestReps: number;
}

interface HealthData {
  weight: WeightData;
  workouts: {
    today: WorkoutDay | null;
    history: WorkoutDay[];
    nextWorkout: string;
  };
  gymToday: boolean;
  gymStreak: number;
  gymThisWeek: number;
  ateCleanHistory: { date: string; clean: boolean }[];
  exerciseProgress: Record<string, ExerciseProgressEntry[]>;
}

export default function HealthPage() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [expandedExercises, setExpandedExercises] = useState<Set<string>>(new Set());
  const [showHistory, setShowHistory] = useState(false);
  const [showProgress, setShowProgress] = useState(false);

  const fetchData = useCallback(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load health data:", err);
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

  const { weight, workouts, gymToday, gymStreak, gymThisWeek, exerciseProgress } = data;

  const allExercises = [
    ...config.exercises.push,
    ...config.exercises.pull,
    ...config.exercises.legs,
    ...config.exercises.core,
  ];

  const templateKey = workouts.nextWorkout;
  const template = config.workoutTemplates[templateKey];
  const prescribedExercises = template
    ? template.map((id: string) => allExercises.find((e) => e.id === id)!)
    : [];
  const totalSets = prescribedExercises.reduce(
    (sum: number, e: { sets: number }) => sum + e.sets,
    0
  );

  const handleMarkDone = async () => {
    const todayStr = new Date().toISOString().split("T")[0];
    await fetch("/api/health", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entries: [
          {
            date: todayStr,
            metric: "gym",
            value: "1",
            notes: `Day ${templateKey}`,
          },
        ],
      }),
    });
    fetchData();
  };

  const toggleDay = (date: string) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };

  const toggleExercise = (id: string) => {
    setExpandedExercises((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Weight progress
  const weightLost = weight.start - weight.current;
  const weightTotal = weight.start - weight.goal;
  const weightPct = Math.max(0, Math.min(100, (weightLost / weightTotal) * 100));
  const weeklyTarget = weight.current - 2;
  const currentMonthName = new Date().toLocaleString("en-US", { month: "short" });
  const currentCheckpoint = weight.checkpoints.find(
    (c) => c.month === currentMonthName
  );

  // Format date helper
  const fmtDate = (d: string) => {
    const [, m, day] = d.split("-");
    const months = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[parseInt(m)]} ${parseInt(day)}`;
  };

  const fmtDow = (d: string) => {
    const date = new Date(d + "T12:00:00");
    return date.toLocaleDateString("en-US", { weekday: "short" });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="p-4 pb-24">
        <div className="max-w-lg mx-auto">
          {/* Breadcrumb */}
          <nav className="mb-4 flex items-center gap-2 text-sm text-zinc-500">
            <Link href="/" className="hover:text-zinc-300 transition-colors">
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-zinc-300">Health</span>
          </nav>

          {/* Header stats */}
          <header className="mb-6">
            <h1 className="text-2xl font-bold mb-3">Health</h1>
            <div className="flex gap-3">
              <div className="flex-1 p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-center">
                <p className="text-2xl font-bold text-emerald-400">{gymStreak}</p>
                <p className="text-xs text-zinc-500">Gym Streak</p>
              </div>
              <div className="flex-1 p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-center">
                <p className="text-2xl font-bold text-blue-400">{gymThisWeek}/5</p>
                <p className="text-xs text-zinc-500">This Week</p>
              </div>
              <div className="flex-1 p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-center">
                <p className="text-2xl font-bold text-zinc-100">{weight.current}</p>
                <p className="text-xs text-zinc-500">lbs</p>
              </div>
            </div>
          </header>

          {/* ==================== TODAY'S WORKOUT ==================== */}
          <section className="mb-6 p-5 bg-zinc-900 rounded-xl border border-zinc-800">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-semibold">
                  {gymToday ? "Today's Workout" : "Next Workout"}
                </h2>
                <p className="text-sm text-zinc-500">
                  Day {templateKey} · {totalSets} sets · ~30 min
                </p>
              </div>
              {gymToday ? (
                <span className="px-3 py-1 text-sm rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Done
                </span>
              ) : (
                <button
                  onClick={handleMarkDone}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25 active:bg-emerald-500/35 transition-colors"
                >
                  Mark Done
                </button>
              )}
            </div>

            <div className="space-y-4">
              {prescribedExercises.map(
                (ex: { id: string; name: string; sets: number; reps: string }) => {
                  // Check if we have logged data for this exercise today
                  const todayEx = workouts.today?.exercises.find(
                    (e) => e.id === ex.id
                  );
                  const hasLoggedSets = todayEx && todayEx.sets.length > 0;

                  return (
                    <div
                      key={ex.id}
                      className={`p-4 rounded-lg border ${
                        hasLoggedSets
                          ? "bg-emerald-500/5 border-emerald-500/20"
                          : "bg-zinc-800/50 border-zinc-700/50"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <h3 className="text-base font-medium">{ex.name}</h3>
                        <span className="text-sm text-zinc-400">
                          {ex.sets} x {ex.reps}
                        </span>
                      </div>

                      {hasLoggedSets && (
                        <div className="mt-3 space-y-1.5">
                          {todayEx.sets.map((s) => (
                            <div
                              key={s.set}
                              className="flex items-center gap-3 text-sm"
                            >
                              <span className="text-xs text-zinc-500 w-8">
                                Set {s.set}
                              </span>
                              <span className="font-mono text-emerald-400">
                                {s.weight}lbs x {s.reps}
                              </span>
                              {s.notes && (
                                <span className="text-xs text-zinc-500">
                                  {s.notes}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {!hasLoggedSets && (
                        <p className="mt-2 text-xs text-zinc-600">
                          Voice log sets at the gym
                        </p>
                      )}
                    </div>
                  );
                }
              )}
            </div>
          </section>

          {/* ==================== WEIGHT + PROGRESS ==================== */}
          <section className="mb-6 p-5 bg-zinc-900 rounded-xl border border-zinc-800">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Weight</h2>
              <span className="text-sm text-zinc-500">
                Goal: {weight.goal} lbs by{" "}
                {new Date(weight.deadline + "T12:00:00").toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>

            {/* Big current weight */}
            <div className="text-center mb-4">
              <p className="text-5xl font-bold tracking-tight">{weight.current}</p>
              <p className="text-sm text-zinc-500 mt-1">
                {weightLost > 0 ? (
                  <>
                    <span className="text-emerald-400">-{weightLost} lbs</span> from{" "}
                    {weight.start}
                  </>
                ) : weightLost < 0 ? (
                  <>
                    <span className="text-red-400">+{Math.abs(weightLost)} lbs</span>{" "}
                    from {weight.start}
                  </>
                ) : (
                  <>Same as start ({weight.start})</>
                )}
              </p>
            </div>

            {/* Progress bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-zinc-500 mb-1">
                <span>{weight.start}</span>
                <span className="text-blue-400">{Math.round(weightPct)}%</span>
                <span className="text-emerald-400">{weight.goal}</span>
              </div>
              <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-emerald-400 rounded-full transition-all"
                  style={{ width: `${weightPct}%` }}
                />
              </div>
            </div>

            {/* Checkpoints */}
            <div className="grid grid-cols-5 gap-1 mb-4">
              {weight.checkpoints.map((cp) => {
                const hit = weight.current <= cp.target;
                const isCurrent = cp.month === currentMonthName;
                return (
                  <div
                    key={cp.month}
                    className={`text-center p-2 rounded ${
                      isCurrent
                        ? "bg-blue-500/10 border border-blue-500/30"
                        : "bg-zinc-800/50"
                    }`}
                  >
                    <p className="text-xs text-zinc-500">{cp.month}</p>
                    <p
                      className={`text-sm font-mono ${
                        hit ? "text-emerald-400" : "text-zinc-400"
                      }`}
                    >
                      {cp.target}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Target this week */}
            {currentCheckpoint && (
              <div className="flex justify-between items-center text-sm p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                <span className="text-zinc-400">This week's target</span>
                <span className="font-mono">{weeklyTarget} lbs</span>
              </div>
            )}

            {/* Weight history (last 10) */}
            {weight.history.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">
                  Recent Weigh-ins
                </p>
                <div className="space-y-1">
                  {[...weight.history]
                    .reverse()
                    .slice(0, 10)
                    .map((w, i, arr) => {
                      const prev = arr[i + 1];
                      const diff = prev ? w.value - prev.value : 0;
                      return (
                        <div
                          key={w.date}
                          className="flex justify-between items-center text-sm py-1"
                        >
                          <span className="text-zinc-500">{fmtDate(w.date)}</span>
                          <div className="flex items-center gap-3">
                            {diff !== 0 && (
                              <span
                                className={`text-xs ${
                                  diff < 0 ? "text-emerald-400" : "text-red-400"
                                }`}
                              >
                                {diff > 0 ? "+" : ""}
                                {diff}
                              </span>
                            )}
                            <span className="font-mono w-12 text-right">
                              {w.value}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </section>

          {/* ==================== EXERCISE PROGRESS ==================== */}
          {Object.keys(exerciseProgress).length > 0 && (
            <section className="mb-6">
              <button
                onClick={() => setShowProgress(!showProgress)}
                className="w-full p-4 bg-zinc-900 rounded-xl border border-zinc-800 flex justify-between items-center"
              >
                <h2 className="text-lg font-semibold">Exercise Progress</h2>
                <span className="text-zinc-500 text-sm">
                  {showProgress ? "Hide" : "Show"}
                </span>
              </button>

              {showProgress && (
                <div className="mt-2 space-y-2">
                  {Object.entries(exerciseProgress).map(([exerciseId, entries]) => {
                    const def = allExercises.find((e) => e.id === exerciseId);
                    const name = def?.name || exerciseId;
                    const isExpanded = expandedExercises.has(exerciseId);
                    const latest = entries[entries.length - 1];
                    const first = entries[0];
                    const improved =
                      latest && first && latest.bestWeight > first.bestWeight;

                    return (
                      <div
                        key={exerciseId}
                        className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden"
                      >
                        <button
                          onClick={() => toggleExercise(exerciseId)}
                          className="w-full p-3 flex justify-between items-center text-left"
                        >
                          <span className="text-sm font-medium">{name}</span>
                          <div className="flex items-center gap-2">
                            {latest && (
                              <span className="font-mono text-sm text-zinc-300">
                                {latest.bestWeight}lbs
                              </span>
                            )}
                            {improved && entries.length > 1 && (
                              <span className="text-xs text-emerald-400">
                                +{latest.bestWeight - first.bestWeight}
                              </span>
                            )}
                            <span className="text-zinc-600 text-xs">
                              {isExpanded ? "v" : ">"}
                            </span>
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="px-3 pb-3 space-y-1 border-t border-zinc-800 pt-2">
                            {entries.map((e, i) => {
                              const prev = entries[i - 1];
                              const diff = prev
                                ? e.bestWeight - prev.bestWeight
                                : 0;
                              return (
                                <div
                                  key={e.date}
                                  className="flex justify-between items-center text-sm"
                                >
                                  <span className="text-zinc-500 text-xs">
                                    {fmtDate(e.date)}
                                  </span>
                                  <div className="flex items-center gap-3">
                                    {diff !== 0 && (
                                      <span
                                        className={`text-xs ${
                                          diff > 0
                                            ? "text-emerald-400"
                                            : "text-red-400"
                                        }`}
                                      >
                                        {diff > 0 ? "+" : ""}
                                        {diff}
                                      </span>
                                    )}
                                    <span className="font-mono text-zinc-300">
                                      {e.bestWeight}lbs x {e.bestReps}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* ==================== WORKOUT HISTORY ==================== */}
          <section className="mb-6">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full p-4 bg-zinc-900 rounded-xl border border-zinc-800 flex justify-between items-center"
            >
              <h2 className="text-lg font-semibold">Workout History</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">
                  {workouts.history.length} sessions
                </span>
                <span className="text-zinc-500 text-sm">
                  {showHistory ? "Hide" : "Show"}
                </span>
              </div>
            </button>

            {showHistory && (
              <div className="mt-2 space-y-2">
                {workouts.history.length === 0 ? (
                  <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800">
                    <p className="text-sm text-zinc-600 text-center">
                      No workouts logged yet. Voice-log your sets at the gym!
                    </p>
                  </div>
                ) : (
                  workouts.history.map((day) => {
                    const isExpanded = expandedDays.has(day.date);
                    return (
                      <div
                        key={day.date}
                        className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden"
                      >
                        <button
                          onClick={() => toggleDay(day.date)}
                          className="w-full p-3 flex justify-between items-center text-left"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
                              {day.workout}
                            </span>
                            <span className="text-sm text-zinc-300">
                              {fmtDow(day.date)}, {fmtDate(day.date)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-zinc-500">
                              {day.exercises.length} exercises
                            </span>
                            <span className="text-zinc-600 text-xs">
                              {isExpanded ? "v" : ">"}
                            </span>
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="px-3 pb-3 space-y-3 border-t border-zinc-800 pt-3">
                            {day.exercises.map((ex) => (
                              <div key={ex.id}>
                                <p className="text-sm font-medium text-zinc-300 mb-1">
                                  {ex.name}
                                </p>
                                <div className="space-y-1">
                                  {ex.sets.map((s) => (
                                    <div
                                      key={s.set}
                                      className="flex items-center gap-3 text-sm pl-3"
                                    >
                                      <span className="text-xs text-zinc-600 w-8">
                                        #{s.set}
                                      </span>
                                      <span className="font-mono text-zinc-300">
                                        {s.weight} x {s.reps}
                                      </span>
                                      {s.notes && (
                                        <span className="text-xs text-zinc-500">
                                          {s.notes}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
