"use client";

import { useMemo, useState } from "react";
import type { ExerciseProgressEntry, WorkoutDay } from "../lib/types";
import { fmtDate, fmtDow } from "../lib/utils";
import LineTrendChart, { type TrendPoint } from "./LineTrendChart";
import TrendModal from "./TrendModal";

interface ExerciseHistoryProps {
  exerciseProgress: Record<string, ExerciseProgressEntry[]>;
  workoutHistory: WorkoutDay[];
}

export default function ExerciseHistory({
  exerciseProgress,
  workoutHistory,
}: ExerciseHistoryProps) {
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [expandedExercises, setExpandedExercises] = useState<Set<string>>(new Set());
  const [showDetails, setShowDetails] = useState(false);
  const [activeExerciseId, setActiveExerciseId] = useState<string | null>(null);
  const [graphMetric, setGraphMetric] = useState<"bestWeight" | "estimated1RM">("bestWeight");

  const exerciseNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const day of workoutHistory) {
      for (const exercise of day.exercises) {
        if (!map.has(exercise.id)) {
          map.set(exercise.id, exercise.name);
        }
      }
    }
    return map;
  }, [workoutHistory]);

  const progressEntries = useMemo(
    () => Object.entries(exerciseProgress),
    [exerciseProgress]
  );

  const activeExerciseEntries = useMemo<ExerciseProgressEntry[]>(
    () => (activeExerciseId ? exerciseProgress[activeExerciseId] || [] : []),
    [activeExerciseId, exerciseProgress]
  );

  const activeExerciseName = useMemo(() => {
    if (!activeExerciseId) return "";
    return exerciseNameById.get(activeExerciseId) || activeExerciseId;
  }, [activeExerciseId, exerciseNameById]);

  const activeExercisePoints = useMemo<TrendPoint[]>(() => {
    return activeExerciseEntries.map((entry) => ({
      date: entry.date,
      value:
        graphMetric === "bestWeight"
          ? entry.bestWeight
          : Math.round(entry.bestWeight * (1 + entry.bestReps / 30)),
    }));
  }, [activeExerciseEntries, graphMetric]);

  const activeSummary = useMemo(() => {
    if (activeExerciseEntries.length === 0) return null;
    const first = activeExerciseEntries[0];
    const latest = activeExerciseEntries[activeExerciseEntries.length - 1];
    const firstValue =
      graphMetric === "bestWeight"
        ? first.bestWeight
        : Math.round(first.bestWeight * (1 + first.bestReps / 30));
    const latestValue =
      graphMetric === "bestWeight"
        ? latest.bestWeight
        : Math.round(latest.bestWeight * (1 + latest.bestReps / 30));
    return {
      firstValue,
      latestValue,
      delta: latestValue - firstValue,
      firstDate: first.date,
      latestDate: latest.date,
    };
  }, [activeExerciseEntries, graphMetric]);

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

  return (
    <section className="mb-6">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="w-full p-4 bg-zinc-900/60 backdrop-blur-md rounded-xl border border-white/10 flex justify-between items-center"
      >
        <h2 className="text-lg font-semibold">Training History</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400">{workoutHistory.length} sessions</span>
          <span className="text-zinc-400 text-sm">{showDetails ? "Hide" : "Show"}</span>
        </div>
      </button>

      {showDetails && (
        <div className="mt-2 space-y-3">
          {progressEntries.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-zinc-500 uppercase px-1">Exercise Progress</p>
              {progressEntries.map(([exerciseId, entries]) => {
                const name = exerciseNameById.get(exerciseId) || exerciseId;
                const isExpanded = expandedExercises.has(exerciseId);
                const latest = entries[entries.length - 1];
                const first = entries[0];
                const improved =
                  latest && first && latest.bestWeight > first.bestWeight;

                return (
                  <div
                    key={exerciseId}
                    className="bg-zinc-900/60 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden"
                  >
                    <div className="flex items-center gap-2 p-2.5">
                      <button
                        onClick={() => toggleExercise(exerciseId)}
                        className="flex-1 px-1 py-0.5 flex justify-between items-center text-left"
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
                          <span className="text-zinc-600 text-xs">{isExpanded ? "▼" : "▶"}</span>
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          setGraphMetric("bestWeight");
                          setActiveExerciseId(exerciseId);
                        }}
                        className="px-2.5 py-1 rounded-md border border-white/15 bg-zinc-800 text-xs text-zinc-300 hover:text-zinc-100 hover:border-white/30"
                      >
                        Graph
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="px-3 pb-3 space-y-1 border-t border-white/10 pt-2">
                        {entries.map((entry, idx) => {
                          const prev = entries[idx - 1];
                          const diff = prev ? entry.bestWeight - prev.bestWeight : 0;
                          return (
                            <div
                              key={entry.date}
                              className="flex justify-between items-center text-sm"
                            >
                              <span className="text-zinc-400 text-xs">{fmtDate(entry.date)}</span>
                              <div className="flex items-center gap-3">
                                {diff !== 0 && (
                                  <span
                                    className={`text-xs ${
                                      diff > 0 ? "text-emerald-400" : "text-red-400"
                                    }`}
                                  >
                                    {diff > 0 ? "+" : ""}
                                    {diff}
                                  </span>
                                )}
                                <span className="font-mono text-zinc-300">
                                  {entry.bestWeight}lbs x {entry.bestReps}
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

          <div className="space-y-2">
            <p className="text-xs text-zinc-500 uppercase px-1">Workout Sessions</p>
            {workoutHistory.length === 0 ? (
              <div className="p-4 bg-zinc-900/60 backdrop-blur-md rounded-xl border border-white/10">
                <p className="text-sm text-zinc-600 text-center">
                  No workouts logged yet. Voice-log your sets at the gym!
                </p>
              </div>
            ) : (
              workoutHistory.map((day) => {
                const isExpanded = expandedDays.has(day.date);
                return (
                  <div
                    key={day.date}
                    className="bg-zinc-900/60 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden"
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
                        <span className="text-xs text-zinc-400">
                          {day.exercises.length} exercises
                        </span>
                        <span className="text-zinc-600 text-xs">{isExpanded ? "▼" : "▶"}</span>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-3 pb-3 space-y-3 border-t border-white/10 pt-3">
                        {day.exercises.map((exercise) => (
                          <div key={exercise.id}>
                            <p className="text-sm font-medium text-zinc-300 mb-1">{exercise.name}</p>
                            <div className="space-y-1">
                              {exercise.sets.map((set) => (
                                <div
                                  key={set.set}
                                  className="flex items-center gap-3 text-sm pl-3"
                                >
                                  <span className="text-xs text-zinc-600 w-8">#{set.set}</span>
                                  <span className="font-mono text-zinc-300">
                                    {set.weight} x {set.reps}
                                  </span>
                                  {set.notes && (
                                    <span className="text-xs text-zinc-400">{set.notes}</span>
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
        </div>
      )}

      <TrendModal
        open={Boolean(activeExerciseId)}
        onClose={() => setActiveExerciseId(null)}
        title={activeExerciseName}
        subtitle="Progression over time"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="inline-flex rounded-lg border border-white/10 bg-zinc-900 p-1">
              <button
                onClick={() => setGraphMetric("bestWeight")}
                className={`rounded-md px-3 py-1.5 text-xs ${
                  graphMetric === "bestWeight"
                    ? "bg-blue-500/20 text-blue-300"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Best Weight
              </button>
              <button
                onClick={() => setGraphMetric("estimated1RM")}
                className={`rounded-md px-3 py-1.5 text-xs ${
                  graphMetric === "estimated1RM"
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Est. 1RM
              </button>
            </div>
            <p className="text-xs text-zinc-500">{activeExerciseEntries.length} sessions</p>
          </div>

          <LineTrendChart
            points={activeExercisePoints}
            color={graphMetric === "bestWeight" ? "#60a5fa" : "#34d399"}
            valueFormatter={(value) => `${Math.round(value)} lbs`}
          />

          {activeSummary ? (
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg border border-white/10 bg-zinc-900/60 p-3">
                <p className="text-[11px] uppercase tracking-wide text-zinc-500">Start</p>
                <p className="mt-1 font-mono text-sm text-zinc-200">
                  {activeSummary.firstValue} lbs
                </p>
                <p className="mt-1 text-xs text-zinc-500">{fmtDate(activeSummary.firstDate)}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-zinc-900/60 p-3">
                <p className="text-[11px] uppercase tracking-wide text-zinc-500">Latest</p>
                <p className="mt-1 font-mono text-sm text-zinc-100">
                  {activeSummary.latestValue} lbs
                </p>
                <p className="mt-1 text-xs text-zinc-500">{fmtDate(activeSummary.latestDate)}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-zinc-900/60 p-3">
                <p className="text-[11px] uppercase tracking-wide text-zinc-500">Delta</p>
                <p
                  className={`mt-1 font-mono text-sm ${
                    activeSummary.delta > 0
                      ? "text-emerald-400"
                      : activeSummary.delta < 0
                        ? "text-red-400"
                        : "text-zinc-300"
                  }`}
                >
                  {activeSummary.delta > 0 ? "+" : ""}
                  {activeSummary.delta} lbs
                </p>
                <p className="mt-1 text-xs text-zinc-500">First vs latest</p>
              </div>
            </div>
          ) : null}
        </div>
      </TrendModal>
    </section>
  );
}
