import { NextResponse } from "next/server";
import { todayStr as todayLocal, daysAgoStr } from "../../lib/utils";
import {
  getExerciseProgress,
  getLatestValue,
  getMetricHistory,
  getStreak,
  groupWorkoutsByDay,
  readDailySignals,
  readReflections,
  readWorkouts,
} from "../../lib/csv";
import { config, WEEKLY_PROGRAM } from "../../lib/config";

export async function GET() {
  try {
    const signals = readDailySignals();
    const workoutSets = readWorkouts();
    const reflections = readReflections();

    const weightHistory = getMetricHistory(signals, "weight").map((entry) => ({
      date: entry.date,
      value: parseFloat(entry.value),
    }));
    const currentWeight = parseFloat(getLatestValue(signals, "weight") || "0");
    const weightEntries = getMetricHistory(signals, "weight");
    const startWeight =
      weightEntries.length > 0
        ? parseFloat(weightEntries[0].value)
        : config.weight.start;

    const workoutDays = groupWorkoutsByDay(workoutSets);
    const todayStr = todayLocal();

    const gymStreak = getStreak(signals, "gym");

    const sevenDaysAgo = daysAgoStr(6);
    const gymLast7 = signals.filter(
      (entry) =>
        entry.signal === "gym" &&
        entry.value === "1" &&
        entry.date >= sevenDaysAgo &&
        entry.date <= todayStr
    ).length;

    const gymToday = signals.some(
      (entry) => entry.date === todayStr && entry.signal === "gym" && entry.value === "1"
    );

    const gymCompletionByDate = signals
      .filter((entry) => entry.signal === "gym" && entry.value === "1")
      .map((entry) => entry.date);

    const eatingSummary = {
      clean: signals.filter(
        (entry) => entry.date === todayStr && entry.signal === "ate_clean" && entry.value === "1"
      ).length,
      total: signals.filter(
        (entry) => entry.date === todayStr && entry.signal === "ate_clean"
      ).length,
    };

    const latestGymReflection =
      reflections
        .filter((reflection) => reflection.domain === "gym")
        .sort((a, b) => b.date.localeCompare(a.date))[0] || null;

    const exerciseProgress = getExerciseProgress(workoutDays);

    return NextResponse.json({
      weight: {
        current: currentWeight,
        start: startWeight,
        goal: config.weight.goal,
        deadline: config.weight.deadline,
        checkpoints: config.weight.checkpoints,
        history: weightHistory,
      },
      weeklyProgram: WEEKLY_PROGRAM,
      gymCompletionByDate,
      workouts: {
        history: workoutDays.slice(0, 30),
      },
      gymToday,
      gymStreak,
      gymLast7,
      eatingSummary,
      gymReflection: latestGymReflection,
      exerciseProgress,
    });
  } catch (error) {
    console.error("GET /api/health error:", error);
    return NextResponse.json({ error: "Failed to read health data" }, { status: 500 });
  }
}
