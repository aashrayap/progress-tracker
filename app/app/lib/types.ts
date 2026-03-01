export interface Todo {
  id: number;
  item: string;
  done: number;
  created: string;
}

export interface PlanEvent {
  date: string;
  start: number;
  end: number;
  item: string;
  done: string;
  notes: string;
}

export interface DailySignalEntry {
  date: string;
  signal: string;
  value: string;
  unit: string;
  context: string;
  source: string;
  captureId: string;
  category?: string;
}

export interface InboxEntry {
  captureId: string;
  capturedAt: string;
  source: string;
  rawText: string;
  status: "logged" | "new" | "needs_review" | "accepted" | "archived" | "failed" | "investigating" | "shipped";
  suggestedDestination: string;
  normalizedText: string;
  error: string;
}

export type HabitMap = Record<string, Record<string, boolean>>;

export type ZoomLevel = "year" | "month" | "week" | "day";

export interface ReflectionEntry {
  date: string;
  domain: string;
  win: string;
  lesson: string;
  change: string;
  archived?: string;
}

export interface WorkoutSet {
  set: number;
  weight: number;
  reps: number;
  notes: string;
}

export interface GroupedExercise {
  name: string;
  id: string;
  sets: WorkoutSet[];
}

export interface WorkoutDay {
  date: string;
  workout: string;
  exercises: GroupedExercise[];
}

export interface ExerciseProgressEntry {
  date: string;
  bestWeight: number;
  bestReps: number;
}

export interface WeightData {
  current: number;
  start: number;
  goal: number;
  deadline: string;
  checkpoints: { month: string; target: number }[];
  history: { date: string; value: number }[];
}

export interface PrescribedExercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
}

export interface GymReflection {
  date: string;
  domain: string;
  win: string;
  lesson: string;
  change: string;
}

export interface EatingSummary {
  clean: number;
  total: number;
}

export interface HealthData {
  weight: WeightData;
  workouts: {
    today: WorkoutDay | null;
    history: WorkoutDay[];
    nextWorkout: string;
    templateKey: string;
    displayTemplate: string;
    displayExercises: PrescribedExercise[];
    totalSets: number;
    cardioFinisherMin: number;
    rotationLength: number;
    isCardio: boolean;
    cardioInfo: { label: string; detail: string; minutes: number } | null;
    rotation: { key: string; kind: string; label: string; detail: string; minutes?: number }[];
  };
  gymToday: boolean;
  gymStreak: number;
  gymLast7: number;
  mealsToday: { slot: string; clean: boolean; notes: string }[];
  eatingSummary: EatingSummary;
  gymReflection: GymReflection | null;
  exerciseProgress: Record<string, ExerciseProgressEntry[]>;
}

export interface ExerciseDef {
  id: string;
  name: string;
  sets: number;
  reps: string;
}

export interface HabitConfigEntry {
  label: string;
  abbr: string;
}

export interface DailyTaskConfig {
  id: string;
  label: string;
  placeholder?: string;
}
