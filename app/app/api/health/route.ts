import { NextResponse } from "next/server";
import { todayStr as todayLocal, daysAgoStr } from "../../lib/utils";
import {
  getExerciseProgress,
  getLatestValue,
  getMetricHistory,
  getNextWorkout,
  getStreak,
  groupWorkoutsByDay,
  readDailySignals,
  readReflections,
  readWorkouts,
} from "../../lib/csv";
import { config, normalizeWorkoutKey } from "../../lib/config";
import type { PrescribedExercise, WorkoutDay } from "../../lib/types";

function getDisplayWorkout(
  gymToday: boolean,
  todayWorkout: WorkoutDay | null,
  nextWorkout: string
): {
  templateKey: string;
  displayTemplate: string;
  displayExercises: PrescribedExercise[];
  totalSets: number;
  isCardio: boolean;
  cardioInfo: { label: string; detail: string; minutes: number } | null;
} {
  const cycle = config.workoutCycle;
  const allExercises = Object.values(config.exercises).flat();

  const normalizedNextWorkout = normalizeWorkoutKey(nextWorkout, cycle) || nextWorkout;
  const normalizedTodayWorkout =
    normalizeWorkoutKey(todayWorkout?.workout, cycle) || todayWorkout?.workout;

  const templateKey =
    (gymToday
      ? normalizedTodayWorkout || normalizedNextWorkout
      : normalizedNextWorkout) || cycle[0];

  const isCardio = templateKey in config.cardioTemplates;
  const cardioInfo = config.cardioTemplates[templateKey] || null;

  const template = config.workoutTemplates[templateKey];
  const prescribedExercises: PrescribedExercise[] = template
    ? template
        .map((id) => allExercises.find((exercise) => exercise.id === id))
        .filter(
          (exercise): exercise is (typeof allExercises)[number] => Boolean(exercise)
        )
        .map((exercise) => ({
          id: exercise.id,
          name: exercise.name,
          sets: exercise.sets,
          reps: exercise.reps,
        }))
    : [];

  const loggedExercises = todayWorkout?.exercises || [];
  const loggedOnlyExercises: PrescribedExercise[] = loggedExercises
    .filter((logged) => !prescribedExercises.some((prescribed) => prescribed.id === logged.id))
    .map((logged) => ({
      id: logged.id,
      name: logged.name,
      sets: Math.max(logged.sets.length, 1),
      reps: "logged",
    }));

  const loggedAsDisplay: PrescribedExercise[] = loggedExercises.map((logged) => ({
    id: logged.id,
    name: logged.name,
    sets: Math.max(logged.sets.length, 1),
    reps: "logged",
  }));

  const displayExercises =
    gymToday && loggedAsDisplay.length > 0
      ? loggedAsDisplay
      : [...prescribedExercises, ...loggedOnlyExercises];

  return {
    templateKey,
    displayTemplate: `Day ${templateKey}`,
    displayExercises,
    totalSets: displayExercises.reduce((sum, exercise) => sum + exercise.sets, 0),
    isCardio,
    cardioInfo,
  };
}

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
    const todayWorkout = workoutDays.find((workout) => workout.date === todayStr) || null;

    const gymStreak = getStreak(signals, "gym");

    const sevenDaysAgo = daysAgoStr(6);
    const gymLast7 = signals.filter(
      (entry) =>
        entry.signal === "gym" &&
        entry.value === "1" &&
        entry.date >= sevenDaysAgo &&
        entry.date <= todayStr
    ).length;

    const cycle = config.workoutCycle;
    const nextWorkout = getNextWorkout(signals, cycle);

    const gymToday = signals.some(
      (entry) => entry.date === todayStr && entry.signal === "gym" && entry.value === "1"
    );

    const mealsToday = signals
      .filter((entry) => entry.date === todayStr && entry.signal === "ate_clean")
      .map((entry) => ({
        slot: entry.category?.trim() || "meal",
        clean: entry.value === "1",
        notes: entry.context || "",
      }));

    const eatingSummary = {
      clean: mealsToday.filter((meal) => meal.clean).length,
      total: mealsToday.length,
    };

    const latestGymReflection =
      reflections
        .filter((reflection) => reflection.domain === "gym")
        .sort((a, b) => b.date.localeCompare(a.date))[0] || null;

    const exerciseProgress = getExerciseProgress(workoutDays);
    const displayWorkout = getDisplayWorkout(gymToday, todayWorkout, nextWorkout);

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
        templateKey: displayWorkout.templateKey,
        displayTemplate: displayWorkout.displayTemplate,
        displayExercises: displayWorkout.displayExercises,
        totalSets: displayWorkout.totalSets,
        cardioFinisherMin: config.trainingPlan.liftSessionCardioFinisherMin,
        rotationLength: config.workoutCycle.length,
        isCardio: displayWorkout.isCardio,
        cardioInfo: displayWorkout.cardioInfo,
        rotation: config.trainingPlan.rotation,
      },
      gymToday,
      gymStreak,
      gymLast7,
      mealsToday,
      eatingSummary,
      gymReflection: latestGymReflection,
      exerciseProgress,
    });
  } catch (error) {
    console.error("GET /api/health error:", error);
    return NextResponse.json({ error: "Failed to read health data" }, { status: 500 });
  }
}
