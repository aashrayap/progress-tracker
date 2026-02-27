export interface ExerciseDef {
  id: string;
  name: string;
  sets: number;
  reps: string;
}

export interface WeeklySplitDay {
  day: string;
  kind: "lift" | "cardio" | "recovery";
  label: string;
  detail: string;
  minutes?: number;
  workoutKey?: string;
}

export const WEEKDAY_ORDER = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export function getSplitForDate(date: Date): WeeklySplitDay {
  return config.trainingPlan.weeklySplit[date.getDay()] || config.trainingPlan.weeklySplit[0];
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
  ],

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
    W1: ["squat", "bench", "lat_pulldown"],
    W2: ["ohp", "lat_row", "incline_bench"],
    W3: ["rdl", "bench", "pullup"],
    W4: ["front_squat", "incline_bench", "lat_row"],
    W5: ["lunges", "ohp", "pullup"],
  } as Record<string, string[]>,

  // Rotation cycle stays completion-based for gym logs.
  workoutCycle: ["W1", "W2", "W3", "W4", "W5"],

  trainingPlan: {
    option: "B",
    liftDaysPerWeek: 5,
    liftSessionCardioFinisherMin: 5,
    homeDose: {
      pullupsPerDay: 6,
      pushupsPerDay: 20,
      guidance: "Same every day. Keep reps easy and never to failure.",
    },
    weeklySplit: [
      { day: "Sun", kind: "cardio", label: "Zone 2", detail: "Conversational pace", minutes: 45 },
      { day: "Mon", kind: "lift", label: "Lift W1", detail: "Back Squat, Bench Press, Lat Pulldown + 5 min cardio", workoutKey: "W1" },
      { day: "Tue", kind: "lift", label: "Lift W2", detail: "Overhead Press, Lat Row, Incline Bench Press + 5 min cardio", workoutKey: "W2" },
      { day: "Wed", kind: "lift", label: "Lift W3", detail: "Romanian Deadlift, Bench Press, Pull-Up / Chin-Up + 5 min cardio", workoutKey: "W3" },
      { day: "Thu", kind: "cardio", label: "Moderate Cardio", detail: "Bike, jog, or brisk walk", minutes: 25 },
      { day: "Fri", kind: "lift", label: "Lift W4", detail: "Front Squat, Incline Bench Press, Lat Row + 5 min cardio", workoutKey: "W4" },
      { day: "Sat", kind: "lift", label: "Lift W5", detail: "Dumbbell Lunges, Overhead Press, Pull-Up / Chin-Up + 5 min cardio", workoutKey: "W5" },
    ] as WeeklySplitDay[],
    masterList: {
      lower: ["squat", "front_squat", "lunges", "rdl", "trap_bar_deadlift"],
      push: ["bench", "incline_bench", "ohp"],
      pull: ["lat_pulldown", "lat_row", "pullup"],
    },
  },
};
