import { NextResponse } from "next/server";
import { todayStr as todayLocal, toDateStr } from "../../lib/utils";
import {
  readDailySignals,
  getMetricHistory,
  getLatestValue,
  getStreak,
  readWorkouts,
  getNextWorkout,
  readReflections,
  WorkoutSetEntry,
} from "../../lib/csv";
import { config, normalizeWorkoutKey } from "../../lib/config";

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
  const allExercises = Object.values(config.exercises).flat();
  const cycle = Object.keys(config.workoutTemplates);

  const byDate: Record<string, WorkoutSetEntry[]> = {};
  for (const e of entries) {
    if (!byDate[e.date]) byDate[e.date] = [];
    byDate[e.date].push(e);
  }

  return Object.entries(byDate)
    .map(([date, sets]) => {
      const rawWorkout = sets[0]?.workout || "";
      const workout = normalizeWorkoutKey(rawWorkout, cycle) || rawWorkout;
      const byExercise: Record<string, WorkoutSetEntry[]> = {};
      for (const s of sets) {
        if (!byExercise[s.exercise]) byExercise[s.exercise] = [];
        byExercise[s.exercise].push(s);
      }

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
    const signals = readDailySignals();
    const workoutSets = readWorkouts();
    const reflections = readReflections();

    const weightHistory = getMetricHistory(signals, "weight").map((w) => ({
      date: w.date,
      value: parseFloat(w.value),
    }));
    const currentWeight = parseFloat(getLatestValue(signals, "weight") || "0");
    const weightEntries = getMetricHistory(signals, "weight");
    const startWeight =
      weightEntries.length > 0
        ? parseFloat(weightEntries[0].value)
        : config.weight.start;

    const workoutDays = groupWorkoutsByDay(workoutSets);
    const todayStr = todayLocal();
    const todayWorkout = workoutDays.find((w) => w.date === todayStr) || null;

    const gymStreak = getStreak(signals, "gym");
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - mondayOffset);
    const mondayStr = toDateStr(monday);
    const gymThisWeek = signals.filter(
      (e) =>
        e.signal === "gym" && e.value === "1" && e.date >= mondayStr && e.date <= todayStr
    ).length;

    const cycle = Object.keys(config.workoutTemplates);
    const nextWorkout = getNextWorkout(signals, cycle);

    const gymToday = signals.some(
      (e) => e.date === todayStr && e.signal === "gym" && e.value === "1"
    );

    const twoWeeksAgo = new Date(now);
    twoWeeksAgo.setDate(now.getDate() - 14);
    const twoWeeksStr = toDateStr(twoWeeksAgo);
    const ateCleanHistory = signals
      .filter(
        (e) => e.signal === "ate_clean" && e.date >= twoWeeksStr
      )
      .map((e) => ({ date: e.date, clean: e.value === "1" }));

    const mealsToday = signals
      .filter((e) => e.date === todayStr && e.signal === "ate_clean")
      .map((e) => ({
        slot: e.category?.trim() || "meal",
        clean: e.value === "1",
        notes: e.context || "",
      }));

    const latestGymReflection = reflections
      .filter((r) => r.domain === "gym")
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
      workouts: {
        today: todayWorkout,
        history: workoutDays.slice(0, 20),
        nextWorkout,
      },
      gymToday,
      gymStreak,
      gymThisWeek,
      ateCleanHistory,
      mealsToday,
      gymReflection: latestGymReflection,
      exerciseProgress,
    });
  } catch (e) {
    console.error("GET /api/health error:", e);
    return NextResponse.json({ error: "Failed to read health data" }, { status: 500 });
  }
}
