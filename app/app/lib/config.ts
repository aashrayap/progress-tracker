export const config = {
  profile: {
    age: 30,
    height: "6'0\"",
  },

  why: "Trade escape for building systems and habits where I can operate at a level to change the world for the better.",

  priorities: ["Weight", "Sleep", "Meditate", "Deep Work"],

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
      { id: "incline_bench", name: "Incline Bench", sets: 3, reps: "5-8" },
      { id: "ohp", name: "Overhead Press", sets: 2, reps: "6-8" },
    ],
    pull: [
      { id: "lat_pulldown", name: "Lat Pulldown", sets: 3, reps: "6-10" },
      { id: "cable_row", name: "Cable Row", sets: 3, reps: "6-10" },
      { id: "barbell_row", name: "Barbell Row", sets: 3, reps: "6-10" },
    ],
    legs: [
      { id: "squat", name: "Back Squat", sets: 3, reps: "5-8" },
      { id: "lunges", name: "DB Lunges", sets: 3, reps: "5-8" },
      { id: "rdl", name: "Romanian Deadlift", sets: 2, reps: "6-8" },
    ],
    core: [
      { id: "leg_raise", name: "Hanging Leg Raise", sets: 2, reps: "8-12" },
      { id: "plank", name: "Plank", sets: 2, reps: "30-45s" },
    ],
  },

  workoutTemplates: {
    A: ["squat", "bench", "lat_pulldown"],
    B: ["squat", "incline_bench", "cable_row"],
    C: ["squat", "ohp", "barbell_row"],
  } as Record<string, string[]>,

  // Rotation cycle: A→B→C→A... (completion-based, not calendar-based)
  workoutCycle: ["A", "B", "C"],
};
