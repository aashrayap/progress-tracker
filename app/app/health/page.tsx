"use client";

import { useState, useEffect, useCallback } from "react";
import { config } from "../lib/config";
import WorkoutCard from "../components/WorkoutCard";
import WeightChart from "../components/WeightChart";
import ExerciseHistory from "../components/ExerciseHistory";

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

  const fetchData = useCallback(() => {
    fetch("/api/health")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch health data");
        return res.json();
      })
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
    const res = await fetch("/api/log", {
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
    if (!res.ok) console.error("Failed to mark gym done");
    fetchData();
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="p-4 sm:p-6">
        <div className="max-w-lg mx-auto">
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

          <WorkoutCard
            gymToday={gymToday}
            templateKey={templateKey}
            totalSets={totalSets}
            prescribedExercises={prescribedExercises}
            todayWorkout={workouts.today}
            onMarkDone={handleMarkDone}
          />

          <WeightChart weight={weight} />

          <ExerciseHistory
            exerciseProgress={exerciseProgress}
            workoutHistory={workouts.history}
            allExercises={allExercises}
          />
        </div>
      </div>
    </div>
  );
}
