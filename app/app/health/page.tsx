"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { HealthData } from "../lib/types";
import WeeklyProgramChart from "../components/WeeklyProgramChart";
import ExerciseHistory from "../components/ExerciseHistory";

const DOW_TO_KEY: Record<number, string> = {
  0: "Sun", 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat",
};

export default function HealthPage() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    fetch("/api/health")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch health data");
        return res.json();
      })
      .then((healthData) => {
        setData(healthData);
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

  // Initialize selected day to today's program key on first data load
  useEffect(() => {
    if (data && selectedDayKey === null) {
      const todayKey = DOW_TO_KEY[new Date().getDay()] ?? "Mon";
      setSelectedDayKey(todayKey);
    }
  }, [data, selectedDayKey]);

  const selectedDay = useMemo(
    () => data?.weeklyProgram.find((d) => d.key === selectedDayKey) ?? null,
    [data, selectedDayKey]
  );

  const selectedExerciseIds = useMemo(
    () => selectedDay?.exercises.map((e) => e.id) ?? [],
    [selectedDay]
  );

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

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <div className="p-4 sm:p-6">
        <header className="mb-4">
          <h1 className="text-2xl font-bold">Health</h1>
        </header>

        <WeeklyProgramChart
          weeklyProgram={data.weeklyProgram}
          gymCompletionByDate={data.gymCompletionByDate}
          selectedDayKey={selectedDayKey}
          onSelectDay={setSelectedDayKey}
        />

        <div className="mt-4">
          <ExerciseHistory
            exerciseProgress={data.exerciseProgress}
            workoutHistory={data.workouts.history}
            exerciseIds={selectedExerciseIds}
          />
        </div>
      </div>
    </div>
  );
}
