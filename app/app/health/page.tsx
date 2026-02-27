"use client";

import { useState, useEffect, useCallback } from "react";
import { config, getSplitForDate, normalizeWorkoutKey } from "../lib/config";
import { toDateStr } from "../lib/utils";
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
  mealsToday: { slot: string; clean: boolean; notes: string }[];
  gymReflection: {
    date: string;
    domain: string;
    win: string;
    lesson: string;
    change: string;
  } | null;
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

  const { weight, workouts, gymToday, gymStreak, gymThisWeek, exerciseProgress, mealsToday, gymReflection } = data;

  const allExercises = Object.values(config.exercises).flat();
  const exerciseById = new Map(allExercises.map((exercise) => [exercise.id, exercise]));
  const today = new Date();
  const todayIndex = today.getDay();
  const todaySplit = getSplitForDate(today);
  const cycle = Object.keys(config.workoutTemplates);
  const scheduledTemplateKey = (() => {
    if (todaySplit.kind === "lift" && todaySplit.workoutKey) {
      return todaySplit.workoutKey;
    }
    for (let offset = 1; offset <= config.trainingPlan.weeklySplit.length; offset++) {
      const idx = (todayIndex + offset) % config.trainingPlan.weeklySplit.length;
      const entry = config.trainingPlan.weeklySplit[idx];
      if (entry.kind === "lift" && entry.workoutKey) {
        return entry.workoutKey;
      }
    }
    return null;
  })();

  const normalizedNextWorkout =
    normalizeWorkoutKey(workouts.nextWorkout, cycle) || workouts.nextWorkout;
  const normalizedTodayWorkout =
    normalizeWorkoutKey(workouts.today?.workout, cycle) || workouts.today?.workout;
  const templateKey = (
    gymToday
      ? (normalizedTodayWorkout || scheduledTemplateKey || normalizedNextWorkout)
      : (scheduledTemplateKey || normalizedNextWorkout)
  ) || cycle[0];
  const template = config.workoutTemplates[templateKey];
  const prescribedExercises = template
    ? template
        .map((id: string) => allExercises.find((e) => e.id === id))
        .filter(
          (
            exercise
          ): exercise is (typeof allExercises)[number] => Boolean(exercise)
        )
    : [];
  const loggedExercises = workouts.today?.exercises || [];
  const loggedOnlyExercises = loggedExercises
    .filter((logged) => !prescribedExercises.some((p) => p.id === logged.id))
    .map((logged) => ({
      id: logged.id,
      name: logged.name,
      sets: Math.max(logged.sets.length, 1),
      reps: "logged",
    }));
  const loggedAsDisplay = loggedExercises.map((logged) => ({
    id: logged.id,
    name: logged.name,
    sets: Math.max(logged.sets.length, 1),
    reps: "logged",
  }));
  const displayExercises =
    gymToday && loggedAsDisplay.length > 0
      ? loggedAsDisplay
      : [...prescribedExercises, ...loggedOnlyExercises];
  const totalSets = displayExercises.reduce(
    (sum: number, e: { sets: number }) => sum + e.sets,
    0
  );
  const workoutSummaryByKey = Object.fromEntries(
    Object.entries(config.workoutTemplates).map(([key, exerciseIds]) => [
      key,
      exerciseIds
        .map((exerciseId) => exerciseById.get(exerciseId)?.name || exerciseId)
        .join(" / "),
    ])
  );
  const masterListSections = [
    { label: "Lower", ids: config.trainingPlan.masterList.lower },
    { label: "Push", ids: config.trainingPlan.masterList.push },
    { label: "Pull", ids: config.trainingPlan.masterList.pull },
  ];

  const handleMarkDone = async () => {
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
            context: `Day ${templateKey}`,
            source: "ui",
            captureId: "",
            category: templateKey,
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
                <p className="text-2xl font-bold text-blue-400">
                  {gymThisWeek}/{config.trainingPlan.liftDaysPerWeek}
                </p>
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
            prescribedExercises={displayExercises}
            todayWorkout={workouts.today}
            cardioFinisherMin={config.trainingPlan.liftSessionCardioFinisherMin}
            onMarkDone={handleMarkDone}
          />

          <section className="mb-6 p-4 bg-zinc-900 rounded-xl border border-zinc-800">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-zinc-500 uppercase">Weekly Split (Option B)</p>
              <span className="text-xs text-blue-400">
                {gymThisWeek}/{config.trainingPlan.liftDaysPerWeek} lift days done
              </span>
            </div>
            <p className="mt-2 text-sm text-zinc-300">
              Today: {todaySplit.label}
              {todaySplit.kind === "lift"
                ? ` (+${config.trainingPlan.liftSessionCardioFinisherMin} min cardio)`
                : todaySplit.minutes
                  ? ` (${todaySplit.minutes} min)`
                  : ""}
            </p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[740px] border-collapse text-xs">
                <thead>
                  <tr>
                    {config.trainingPlan.weeklySplit.map((entry, idx) => (
                      <th
                        key={entry.day}
                        className={`border border-zinc-800 px-2 py-1 text-left font-medium ${
                          idx === todayIndex ? "bg-blue-500/15 text-blue-300" : "text-zinc-400"
                        }`}
                      >
                        {entry.day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {config.trainingPlan.weeklySplit.map((entry, idx) => (
                      <td
                        key={`${entry.day}-label`}
                        className={`border border-zinc-800 px-2 py-1 ${
                          idx === todayIndex ? "bg-blue-500/10 text-zinc-100" : "text-zinc-200"
                        }`}
                      >
                        {entry.label}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    {config.trainingPlan.weeklySplit.map((entry, idx) => (
                      <td
                        key={`${entry.day}-detail`}
                        className={`border border-zinc-800 px-2 py-1 ${
                          idx === todayIndex ? "bg-blue-500/5 text-zinc-300" : "text-zinc-500"
                        }`}
                      >
                        {entry.workoutKey
                          ? `${workoutSummaryByKey[entry.workoutKey]} + ${config.trainingPlan.liftSessionCardioFinisherMin}m cardio`
                          : `${entry.minutes || 0} min`}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-6 p-4 bg-zinc-900 rounded-xl border border-zinc-800">
            <p className="text-xs text-zinc-500 uppercase mb-2">Daily Home Dose</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded border border-zinc-800 bg-zinc-800/40 p-2">
                <p className="text-xs text-zinc-500">Pull-Ups</p>
                <p className="text-lg font-semibold text-zinc-100">
                  {config.trainingPlan.homeDose.pullupsPerDay}/day
                </p>
              </div>
              <div className="rounded border border-zinc-800 bg-zinc-800/40 p-2">
                <p className="text-xs text-zinc-500">Push-Ups</p>
                <p className="text-lg font-semibold text-zinc-100">
                  {config.trainingPlan.homeDose.pushupsPerDay}/day
                </p>
              </div>
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              {config.trainingPlan.homeDose.guidance}
            </p>
          </section>

          <section className="mb-6 p-4 bg-zinc-900 rounded-xl border border-zinc-800">
            <p className="text-xs text-zinc-500 uppercase mb-2">Compound Master List</p>
            <div className="space-y-2">
              {masterListSections.map((section) => (
                <div key={section.label} className="rounded border border-zinc-800 p-2">
                  <p className="text-xs text-zinc-500 mb-1">{section.label}</p>
                  <p className="text-sm text-zinc-300">
                    {section.ids
                      .map((id) => exerciseById.get(id)?.name || id)
                      .join(" / ")}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {gymReflection && (
            <section className="mb-6 p-4 bg-zinc-900 rounded-xl border border-zinc-800">
              <p className="text-xs text-zinc-500 uppercase mb-2">Latest Gym Reflection</p>
              <p className="text-sm text-zinc-300">Win: {gymReflection.win || "-"}</p>
              <p className="text-sm text-zinc-300">Lesson: {gymReflection.lesson || "-"}</p>
              <p className="text-sm text-zinc-300">Change: {gymReflection.change || "-"}</p>
            </section>
          )}

          <section className="mb-6 p-4 bg-zinc-900 rounded-xl border border-zinc-800">
            <p className="text-xs text-zinc-500 uppercase mb-2">Eating Today</p>
            {mealsToday.length === 0 ? (
              <p className="text-sm text-zinc-600">No meal entries logged today.</p>
            ) : (
              <div className="space-y-2">
                {mealsToday.map((m, idx) => (
                  <div key={`${m.slot}-${idx}`} className="flex items-center justify-between border border-zinc-800 rounded p-2">
                    <div>
                      <p className="text-sm text-zinc-300 capitalize">{m.slot}</p>
                      {m.notes && <p className="text-xs text-zinc-500">{m.notes}</p>}
                    </div>
                    <span className={`text-xs ${m.clean ? "text-emerald-400" : "text-red-400"}`}>
                      {m.clean ? "clean" : "off-plan"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

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
