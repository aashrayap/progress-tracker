import type { DailyTaskConfig, ExerciseDef, HabitConfigEntry } from "./types";

export interface RotationDay {
  key: string;
  kind: "lift" | "cardio";
  label: string;
  detail: string;
  minutes?: number;
}

export const HABIT_CONFIG = {
  weed: { label: "No Weed", abbr: "W" },
  lol: { label: "No LoL", abbr: "L" },
  poker: { label: "No Poker", abbr: "P" },
  gym: { label: "Gym", abbr: "G" },
  sleep: { label: "Sleep", abbr: "S" },
  meditate: { label: "Meditate", abbr: "M" },
  deep_work: { label: "Deep Work", abbr: "D" },
  ate_clean: { label: "Ate Clean", abbr: "E" },
} satisfies Record<string, HabitConfigEntry>;

const LEGACY_WORKOUT_ALIASES: Record<string, string> = {
  W1: "A",
  W2: "B",
  W3: "C",
  W4: "D",
  W5: "E",
};

function extractWorkoutToken(value: string): string {
  const normalized = value.trim().toUpperCase();
  if (!normalized) return "";

  const dayMatch = normalized.match(/DAY\s*([A-Z0-9_-]+)/i);
  if (dayMatch?.[1]) return dayMatch[1].toUpperCase();

  const weekMatch = normalized.match(/\bW[0-9]+\b/i);
  if (weekMatch?.[0]) return weekMatch[0].toUpperCase();

  return normalized;
}

export function normalizeWorkoutKey(
  rawValue: string | null | undefined,
  cycle?: string[]
): string | null {
  if (!rawValue) return null;

  const activeCycle =
    cycle && cycle.length > 0 ? cycle : [...config.workoutCycle];
  const cycleUpper = activeCycle.map((item) => item.toUpperCase());
  const token = extractWorkoutToken(rawValue);
  if (!token) return null;

  const exactIdx = cycleUpper.indexOf(token);
  if (exactIdx !== -1) return activeCycle[exactIdx];

  const mapped = LEGACY_WORKOUT_ALIASES[token];
  if (!mapped) return null;

  const mappedIdx = cycleUpper.indexOf(mapped.toUpperCase());
  return mappedIdx !== -1 ? activeCycle[mappedIdx] : null;
}

export const config = {
  profile: {
    age: 30,
    height: "6'0\"",
  },

  why: "Trade escape for building systems and habits where I can operate at a level to change the world for the better.",

  weight: {
    start: 240,
    goal: 200,
    deadline: "2026-06-30",
    checkpoints: [
      { month: "Feb", target: 232 },
      { month: "Mar", target: 224 },
      { month: "Apr", target: 216 },
      { month: "May", target: 208 },
      { month: "Jun", target: 200 },
    ],
  },

  dopamineReset: {
    startDate: "2026-01-30",
    days: 90,
    avoid: ["weed", "lol", "poker"],
    build: ["gym", "sleep", "meditate", "deepWork", "ateClean"],
  },

  knownTriggers: [
    { trigger: "Poker environment", risk: "HIGH", pattern: "Social pressure at table → impulse" },
    { trigger: "Poker loss", risk: "HIGH", pattern: "Loss → dopamine crash → seeks hit" },
    { trigger: "Late night + friends", risk: "HIGH", pattern: "Social + late = cascade" },
    { trigger: "Boredom, evening", risk: "MEDIUM", pattern: "Unstructured time" },
  ],

  dailyTasks: [
    { id: "gym", label: "Gym", placeholder: "exercises" },
    { id: "deep_work", label: "Deep Work", placeholder: "subject" },
    { id: "meditate", label: "Meditate", placeholder: "type/duration" },
    { id: "walk", label: "Dog Walk", placeholder: "duration" },
    { id: "facetime_basia", label: "Facetime Basia" },
  ] as DailyTaskConfig[],

  exercises: {
    push: [
      { id: "bench", name: "Bench Press", sets: 3, reps: "5-8" },
      { id: "incline_bench", name: "Incline Bench Press", sets: 3, reps: "6-10" },
      { id: "ohp", name: "Overhead Press", sets: 3, reps: "6-8" },
    ],
    pull: [
      { id: "lat_pulldown", name: "Lat Pulldown", sets: 3, reps: "6-10" },
      { id: "lat_row", name: "Lat Row", sets: 3, reps: "6-10" },
      { id: "pullup", name: "Pull-Up / Chin-Up", sets: 3, reps: "4-8" },
      // Legacy IDs retained so historical logs still resolve to display names.
      { id: "cable_row", name: "Cable Row", sets: 3, reps: "6-10" },
      { id: "barbell_row", name: "Barbell Row", sets: 3, reps: "6-10" },
    ],
    legs: [
      { id: "squat", name: "Back Squat", sets: 3, reps: "5-8" },
      { id: "front_squat", name: "Front Squat", sets: 3, reps: "5-8" },
      { id: "lunges", name: "Dumbbell Lunges", sets: 3, reps: "8-10 / leg" },
      { id: "rdl", name: "Romanian Deadlift", sets: 3, reps: "6-8" },
      { id: "trap_bar_deadlift", name: "Trap Bar Deadlift", sets: 2, reps: "3-5" },
    ],
    core: [
      { id: "pushup", name: "Push-Up", sets: 3, reps: "submax" },
    ],
  } as Record<string, ExerciseDef[]>,

  workoutTemplates: {
    A: ["squat", "bench", "lat_pulldown"],
    B: ["ohp", "barbell_row", "incline_bench"],
    C: ["rdl", "bench", "pullup"],
    D: ["front_squat", "incline_bench", "cable_row"],
    E: ["lunges", "ohp", "pullup"],
  } as Record<string, string[]>,

  cardioTemplates: {
    F: { label: "Zone 2", detail: "Conversational pace", minutes: 45 },
    G: { label: "Moderate Cardio", detail: "Bike, jog, or brisk walk", minutes: 25 },
  } as Record<string, { label: string; detail: string; minutes: number }>,

  workoutCycle: ["A", "B", "C", "D", "E", "F", "G"],

  trainingPlan: {
    option: "B",
    liftSessionCardioFinisherMin: 5,
    homeDose: {
      pullupsPerDay: 6,
      pushupsPerDay: 20,
      guidance: "Same every day. Keep reps easy and never to failure.",
    },
    rotation: [
      { key: "A", kind: "lift", label: "Lift A", detail: "Back Squat, Bench Press, Lat Pulldown" },
      { key: "B", kind: "lift", label: "Lift B", detail: "OHP, Barbell Row, Incline Bench" },
      { key: "C", kind: "lift", label: "Lift C", detail: "RDL, Bench Press, Pull-Up" },
      { key: "D", kind: "lift", label: "Lift D", detail: "Front Squat, Incline Bench, Cable Row" },
      { key: "E", kind: "lift", label: "Lift E", detail: "Lunges, OHP, Pull-Up" },
      { key: "F", kind: "cardio", label: "Zone 2", detail: "Conversational pace, 45 min", minutes: 45 },
      { key: "G", kind: "cardio", label: "Moderate Cardio", detail: "Bike, jog, or brisk walk, 25 min", minutes: 25 },
    ] as RotationDay[],
    masterList: {
      lower: ["squat", "front_squat", "lunges", "rdl", "trap_bar_deadlift"],
      push: ["bench", "incline_bench", "ohp"],
      pull: ["lat_pulldown", "lat_row", "pullup"],
    },
  },
};
