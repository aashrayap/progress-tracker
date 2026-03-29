import type { DailyTaskConfig, ExerciseDef, HabitConfigEntry } from "./types";

export type PairLabel = "A" | "B" | "finisher";

export interface ProgramExercise {
  id: string;
  name: string;
  scheme: string;
  pair: PairLabel;
}

export interface ProgramDay {
  key: string;
  label: string;
  isRest: boolean;
  exercises: ProgramExercise[];
}

export const WEEKLY_PROGRAM: ProgramDay[] = [
  {
    key: "Mon", label: "Monday", isRest: false,
    exercises: [
      { id: "power_clean",   name: "Power Clean",   scheme: "5×3",     pair: "A" },
      { id: "barbell_row",   name: "Barbell Row",    scheme: "4×6-8",   pair: "A" },
      { id: "incline_bench", name: "Incline Bench",  scheme: "4×6-8",   pair: "B" },
      { id: "lat_pulldown",  name: "Lat Pulldown",   scheme: "3×8-10",  pair: "B" },
      { id: "face_pull",     name: "Face Pull",      scheme: "3×12-15", pair: "finisher" },
    ],
  },
  {
    key: "Tue", label: "Tuesday", isRest: false,
    exercises: [
      { id: "squat",         name: "Back Squat",     scheme: "4×6-8",   pair: "A" },
      { id: "rdl",           name: "RDL",            scheme: "4×6-8",   pair: "A" },
      { id: "pullup",        name: "Pull-Up",        scheme: "3×8-10",  pair: "B" },
      { id: "dip",           name: "Dip",            scheme: "3×8-10",  pair: "B" },
      { id: "lat_raise",     name: "Lateral Raise",  scheme: "3×12-15", pair: "finisher" },
    ],
  },
  {
    key: "Wed", label: "Wednesday", isRest: false,
    exercises: [
      { id: "deadlift",      name: "Deadlift",       scheme: "4×6-8",   pair: "A" },
      { id: "barbell_row",   name: "Barbell Row",    scheme: "4×6-8",   pair: "A" },
      { id: "incline_bench", name: "Incline Bench",  scheme: "4×6-8",   pair: "B" },
      { id: "face_pull",     name: "Face Pull",      scheme: "3×12-15", pair: "B" },
      { id: "neck_curl",     name: "Neck Curl",      scheme: "3×12-15", pair: "finisher" },
    ],
  },
  {
    key: "Thu", label: "Thursday", isRest: false,
    exercises: [
      { id: "hang_clean",    name: "Hang Clean",     scheme: "5×3",     pair: "A" },
      { id: "front_squat",   name: "Front Squat",    scheme: "3×8-10",  pair: "A" },
      { id: "lunges",        name: "Lunges",         scheme: "3×8-10",  pair: "B" },
      { id: "barbell_shrug", name: "Barbell Shrug",  scheme: "3×12-15", pair: "B" },
      { id: "lat_raise",     name: "Lateral Raise",  scheme: "3×12-15", pair: "finisher" },
    ],
  },
  {
    key: "Fri", label: "Friday", isRest: false,
    exercises: [
      { id: "power_clean",        name: "Power Clean",        scheme: "5×3",     pair: "A" },
      { id: "ohp",                name: "OHP",                scheme: "4×6-8",   pair: "A" },
      { id: "hanging_leg_raise",  name: "Hanging Leg Raise",  scheme: "3×12-15", pair: "B" },
      { id: "machine_bicep_curl", name: "Machine Bicep Curl", scheme: "3×12-15", pair: "B" },
      { id: "lat_pulldown",       name: "Lat Pulldown",       scheme: "3×8-10",  pair: "finisher" },
    ],
  },
  { key: "Sat", label: "Saturday", isRest: true, exercises: [] },
  { key: "Sun", label: "Sunday",   isRest: true, exercises: [] },
];

export interface RotationDay {
  key: string;
  kind: "lift" | "cardio";
  label: string;
  detail: string;
  minutes?: number;
}

export const HABIT_CONFIG = {
  weed:           { label: "No Weed",       abbr: "W"  },
  lol:            { label: "No LoL",        abbr: "L"  },
  poker:          { label: "No Poker",      abbr: "P"  },
  clarity:        { label: "Clarity",       abbr: "C"  },
  gym:            { label: "Gym",           abbr: "G"  },
  sleep:          { label: "Sleep",         abbr: "S"  },
  meditate:       { label: "Meditate",      abbr: "M"  },
  deep_work:      { label: "Deep Work",     abbr: "D"  },
  ate_clean:      { label: "Ate Clean",     abbr: "E"  },
  morning_review: { label: "Morning",       abbr: "AM" },
  midday_review:  { label: "Midday",        abbr: "MD" },
  evening_review: { label: "Evening",       abbr: "PM" },
  wim_hof_am:     { label: "Wim Hof AM",   abbr: "WA" },
  wim_hof_pm:     { label: "Wim Hof PM",   abbr: "WP" },
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
      { id: "lat_raise", name: "Lateral Raise", sets: 3, reps: "10-15" },
    ],
    pull: [
      { id: "lat_pulldown", name: "Lat Pulldown", sets: 3, reps: "6-10" },
      { id: "lat_row", name: "Lat Row", sets: 3, reps: "6-10" },
      { id: "pullup", name: "Pull-Up / Chin-Up", sets: 3, reps: "4-8" },
      // Legacy IDs retained so historical logs still resolve to display names.
      { id: "cable_row", name: "Cable Row", sets: 3, reps: "6-10" },
      { id: "barbell_row", name: "Barbell Row", sets: 3, reps: "6-10" },
      { id: "machine_bicep_curl", name: "Machine Bicep Curl", sets: 3, reps: "8-12" },
    ],
    legs: [
      { id: "squat", name: "Back Squat", sets: 3, reps: "5-8" },
      { id: "front_squat", name: "Front Squat", sets: 3, reps: "5-8" },
      { id: "lunges", name: "Dumbbell Lunges", sets: 3, reps: "8-10 / leg" },
      { id: "rdl", name: "Romanian Deadlift", sets: 3, reps: "6-8" },
      { id: "trap_bar_deadlift", name: "Trap Bar Deadlift", sets: 2, reps: "3-5" },
    ],
    power: [
      { id: "clean", name: "Barbell Clean", sets: 3, reps: "3-5" },
      { id: "power_clean", name: "Power Clean", sets: 5, reps: "3" },
      { id: "hang_clean", name: "Hang Clean", sets: 5, reps: "3" },
    ],
    core: [
      { id: "pushup", name: "Push-Up", sets: 3, reps: "submax" },
      { id: "hanging_leg_raise", name: "Hanging Leg Raise", sets: 3, reps: "12-15" },
      { id: "neck_curl", name: "Neck Curl", sets: 3, reps: "12-15" },
      { id: "barbell_shrug", name: "Barbell Shrug", sets: 3, reps: "12-15" },
      { id: "face_pull", name: "Face Pull", sets: 3, reps: "12-15" },
      { id: "dip", name: "Dip", sets: 3, reps: "8-10" },
      { id: "deadlift", name: "Deadlift", sets: 4, reps: "6-8" },
    ],
  } as Record<string, ExerciseDef[]>,

  workoutTemplates: {
    A: ["squat", "bench", "lat_pulldown"],
    B: ["incline_bench", "barbell_row", "lat_raise"],
    C: ["rdl", "bench", "pullup"],
    D: ["front_squat", "incline_bench", "cable_row"],
    E: ["lunges", "ohp", "pullup"],
    G: ["clean", "machine_bicep_curl", "rdl"],
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
      { key: "B", kind: "lift", label: "Lift B", detail: "Incline Bench, Barbell Row, Lateral Raise" },
      { key: "C", kind: "lift", label: "Lift C", detail: "RDL, Bench Press, Pull-Up" },
      { key: "D", kind: "lift", label: "Lift D", detail: "Front Squat, Incline Bench, Cable Row" },
      { key: "E", kind: "lift", label: "Lift E", detail: "Lunges, OHP, Pull-Up" },
      { key: "F", kind: "cardio", label: "Zone 2", detail: "Conversational pace, 45 min", minutes: 45 },
      { key: "G", kind: "cardio", label: "Moderate Cardio", detail: "Bike, jog, or brisk walk, 25 min + Barbell Clean, Machine Bicep Curl, RDL", minutes: 25 },
    ] as RotationDay[],
    masterList: {
      lower: ["squat", "front_squat", "lunges", "rdl", "trap_bar_deadlift"],
      push: ["bench", "incline_bench", "ohp", "lat_raise"],
      pull: ["lat_pulldown", "lat_row", "pullup"],
    },
  },
};
