"use client";

import { useMemo, useState } from "react";
import type { ExerciseProgressEntry, WorkoutDay } from "../lib/types";
import { fmtDate, fmtDow } from "../lib/utils";

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
                        <span className="text-zinc-600 text-xs">{isExpanded ? "▼" : "▶"}</span>
                      </div>
                    </button>

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
    </section>
  );
}
