"use client";

import { useState, useEffect, useCallback } from "react";
import type { HealthData } from "../lib/types";
import { toDateStr } from "../lib/utils";
import WorkoutCard from "../components/WorkoutCard";
import WeightChart from "../components/WeightChart";
import ExerciseHistory from "../components/ExerciseHistory";

export default function HealthPage() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(() => {
    fetch("/api/health")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch health data");
        return res.json();
      })
      .then((nextData) => {
        setData(nextData);
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
      <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center">
        <p className="text-zinc-400">Loading...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center">
        <p className="text-red-400">Failed to load data</p>
      </div>
    );
  }

  const {
    weight,
    workouts,
    gymToday,
    gymStreak,
    gymLast7,
    exerciseProgress,
    eatingSummary,
    gymReflection,
  } = data;

  const handleMarkDone = async () => {
    if (gymToday) return;

    const todayStr = toDateStr(new Date());
    const res = await fetch("/api/daily-signals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entries: [
          {
            date: todayStr,
            signal: "gym",
            value: "1",
            unit: "bool",
            context: workouts.displayTemplate,
            source: "ui",
            captureId: "",
            category: workouts.templateKey,
          },
        ],
      }),
    });

    if (!res.ok) {
      console.error("Failed to mark gym done");
      return;
    }

    fetchData();
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <div className="p-4 sm:p-6">
        <div className="max-w-lg mx-auto">
          <header className="mb-6">
            <h1 className="text-2xl font-bold mb-3">Health</h1>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-zinc-900/60 backdrop-blur-md border border-white/10 text-center">
                <p className="text-2xl font-bold text-emerald-400">{gymStreak}</p>
                <p className="text-xs text-zinc-400">Gym Streak</p>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/60 backdrop-blur-md border border-white/10 text-center">
                <p className="text-2xl font-bold text-blue-400">
                  {gymLast7}/{workouts.rotationLength}
                </p>
                <p className="text-xs text-zinc-400">Last 7 Days</p>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/60 backdrop-blur-md border border-white/10 text-center">
                <p className="text-2xl font-bold text-zinc-100">
                  {eatingSummary.total > 0 ? `${eatingSummary.clean}/${eatingSummary.total}` : "-"}
                </p>
                <p className="text-xs text-zinc-400">Eating</p>
              </div>
            </div>
          </header>

          <WorkoutCard
            gymToday={gymToday}
            templateKey={workouts.templateKey}
            totalSets={workouts.totalSets}
            prescribedExercises={workouts.displayExercises}
            todayWorkout={workouts.today}
            cardioFinisherMin={workouts.cardioFinisherMin}
            gymReflection={gymReflection}
            onMarkDone={handleMarkDone}
            isCardio={workouts.isCardio}
            cardioInfo={workouts.cardioInfo}
            rotation={workouts.rotation}
          />

          <WeightChart weight={weight} />

          <ExerciseHistory
            exerciseProgress={exerciseProgress}
            workoutHistory={workouts.history}
          />
        </div>
      </div>
    </div>
  );
}
