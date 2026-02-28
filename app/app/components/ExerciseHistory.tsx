"use client";

import { useState } from "react";

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

interface ExerciseDef {
  id: string;
  name: string;
}

interface ExerciseHistoryProps {
  exerciseProgress: Record<string, ExerciseProgressEntry[]>;
  workoutHistory: WorkoutDay[];
  allExercises: ExerciseDef[];
}

function fmtDate(d: string) {
  const [, m, day] = d.split("-");
  const months = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[parseInt(m)]} ${parseInt(day)}`;
}

function fmtDow(d: string) {
  const date = new Date(d + "T12:00:00");
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

export default function ExerciseHistory({
  exerciseProgress,
  workoutHistory,
  allExercises,
}: ExerciseHistoryProps) {
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [expandedExercises, setExpandedExercises] = useState<Set<string>>(new Set());
  const [showHistory, setShowHistory] = useState(false);
  const [showProgress, setShowProgress] = useState(false);

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
    <>
      {/* ==================== EXERCISE PROGRESS ==================== */}
      {Object.keys(exerciseProgress).length > 0 && (
        <section className="mb-6">
          <button
            onClick={() => setShowProgress(!showProgress)}
            className="w-full p-4 bg-zinc-900/60 backdrop-blur-md rounded-xl border border-white/10 flex justify-between items-center"
          >
            <h2 className="text-lg font-semibold">Exercise Progress</h2>
            <span className="text-zinc-400 text-sm">
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
                        <span className="text-zinc-600 text-xs">
                          {isExpanded ? "▼" : "▶"}
                        </span>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-3 pb-3 space-y-1 border-t border-white/10 pt-2">
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
                              <span className="text-zinc-400 text-xs">
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
          className="w-full p-4 bg-zinc-900/60 backdrop-blur-md rounded-xl border border-white/10 flex justify-between items-center"
        >
          <h2 className="text-lg font-semibold">Workout History</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">
              {workoutHistory.length} sessions
            </span>
            <span className="text-zinc-400 text-sm">
              {showHistory ? "Hide" : "Show"}
            </span>
          </div>
        </button>

        {showHistory && (
          <div className="mt-2 space-y-2">
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
                        <span className="text-zinc-600 text-xs">
                          {isExpanded ? "▼" : "▶"}
                        </span>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-3 pb-3 space-y-3 border-t border-white/10 pt-3">
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
                                    <span className="text-xs text-zinc-400">
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
    </>
  );
}
