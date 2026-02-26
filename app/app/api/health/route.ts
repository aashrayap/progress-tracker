import { NextResponse } from "next/server";
import {
  readLog,
  getMetricHistory,
  getLatestValue,
  getStreak,
  readWorkouts,
  WorkoutSetEntry,
} from "../../lib/csv";
import { config } from "../../lib/config";
import { getNextWorkout } from "../../lib/utils";

interface GroupedExercise {
  name: string;
  id: string;
  sets: { set: number; weight: number; reps: number; notes: string }[];
}

interface WorkoutDay {
  date: string;
  workout: string;
  exercises: GroupedExercise[];
}

function groupWorkoutsByDay(entries: WorkoutSetEntry[]): WorkoutDay[] {
  const byDate: Record<string, WorkoutSetEntry[]> = {};
  for (const e of entries) {
    if (!byDate[e.date]) byDate[e.date] = [];
    byDate[e.date].push(e);
  }

  return Object.entries(byDate)
    .map(([date, sets]) => {
      const workout = sets[0]?.workout || "";
      const byExercise: Record<string, WorkoutSetEntry[]> = {};
      for (const s of sets) {
        if (!byExercise[s.exercise]) byExercise[s.exercise] = [];
        byExercise[s.exercise].push(s);
      }

      const allExercises = [
        ...config.exercises.push,
        ...config.exercises.pull,
        ...config.exercises.legs,
        ...config.exercises.core,
      ];

      const exercises: GroupedExercise[] = Object.entries(byExercise).map(
        ([exerciseId, exerciseSets]) => {
          const def = allExercises.find((e) => e.id === exerciseId);
          return {
            name: def?.name || exerciseId,
            id: exerciseId,
            sets: exerciseSets
              .sort((a, b) => a.set - b.set)
              .map((s) => ({
                set: s.set,
                weight: s.weight,
                reps: s.reps,
                notes: s.notes,
              })),
          };
        }
      );

      return { date, workout, exercises };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

function getExerciseProgress(
  workoutDays: WorkoutDay[]
): Record<string, { date: string; bestWeight: number; bestReps: number }[]> {
  const progress: Record<
    string,
    { date: string; bestWeight: number; bestReps: number }[]
  > = {};

  // Go chronological for progress tracking
  const chronological = [...workoutDays].reverse();

  for (const day of chronological) {
    for (const ex of day.exercises) {
      if (!progress[ex.id]) progress[ex.id] = [];
      const bestSet = ex.sets.reduce(
        (best, s) =>
          s.weight > best.weight ||
          (s.weight === best.weight && s.reps > best.reps)
            ? s
            : best,
        ex.sets[0]
      );
      if (bestSet) {
        progress[ex.id].push({
          date: day.date,
          bestWeight: bestSet.weight,
          bestReps: bestSet.reps,
        });
      }
    }
  }

  return progress;
}

export async function GET() {
  try {
    const log = readLog();
    const workoutSets = readWorkouts();

    const weightHistory = getMetricHistory(log, "weight").map((w) => ({
      date: w.date,
      value: parseFloat(w.value),
    }));
    const currentWeight = parseFloat(getLatestValue(log, "weight") || "0");
    const weightEntries = getMetricHistory(log, "weight");
    const startWeight =
      weightEntries.length > 0
        ? parseFloat(weightEntries[0].value)
        : config.weight.start;

    const workoutDays = groupWorkoutsByDay(workoutSets);
    const todayStr = new Date().toISOString().split("T")[0];
    const todayWorkout = workoutDays.find((w) => w.date === todayStr) || null;

    const gymStreak = getStreak(log, "gym");
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - mondayOffset);
    const mondayStr = monday.toISOString().split("T")[0];
    const gymThisWeek = log.filter(
      (e) =>
        e.metric === "gym" && e.value === "1" && e.date >= mondayStr && e.date <= todayStr
    ).length;

    const cycle = Object.keys(config.workoutTemplates);
    const nextWorkout = getNextWorkout(log, cycle);

    const gymToday = log.some(
      (e) => e.date === todayStr && e.metric === "gym" && e.value === "1"
    );

    const twoWeeksAgo = new Date(now);
    twoWeeksAgo.setDate(now.getDate() - 14);
    const twoWeeksStr = twoWeeksAgo.toISOString().split("T")[0];
    const ateCleanHistory = log
      .filter(
        (e) => e.metric === "ate_clean" && e.date >= twoWeeksStr
      )
      .map((e) => ({ date: e.date, clean: e.value === "1" }));

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
      workouts: {
        today: todayWorkout,
        history: workoutDays.slice(0, 20),
        nextWorkout,
      },
      gymToday,
      gymStreak,
      gymThisWeek,
      ateCleanHistory,
      exerciseProgress,
    });
  } catch (e) {
    console.error("GET /api/health error:", e);
    return NextResponse.json({ error: "Failed to read health data" }, { status: 500 });
  }
}
