export interface Todo {
  id: number;
  item: string;
  done: number;
  created: string;
  domain?: string;
}

export interface PlanEvent {
  date: string;
  start: number;
  end: number;
  item: string;
  done: string;
  notes: string;
  domain?: string;
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

interface GroupedExercise {
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

export interface ExerciseTarget {
  id: string;
  name: string;
  lastSets: { weight: number; reps: number; notes: string }[];
  lastDate: string;
  targetSets: { weight: number; reps: string }[];
  note: string; // e.g. "weight up" or "push reps"
}

export interface GymReflection {
  date: string;
  domain: string;
  win: string;
  lesson: string;
  change: string;
}

interface EatingSummary {
  clean: number;
  total: number;
}

export interface HealthData {
  weight: WeightData;
  weeklyProgram: import("./config").ProgramDay[];
  gymCompletionByDate: string[];
  workouts: {
    history: WorkoutDay[];
  };
  gymToday: boolean;
  gymStreak: number;
  gymLast7: number;
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

export interface GroceryEntry {
  item: string;
  section: string;
  done: number;
  added: string;
}

export interface QuoteEntry {
  id: number;
  text: string;
  author: string;
  source: string;
  domain: string;
  added: string;
}


interface LanguageRules {
  use: string[];
  forbid: string[];
}

export interface IdentityScript {
  coreTraits: { health: string; wealth: string; love: string; self: string };
  nonNegotiables: string;
  languageRules: LanguageRules;
  physicalPresence: string;
  socialFilter: string;
  decisionStyle: string;
}

interface RitualBlock {
  steps: string[];
  habitStacks: string[];
}

export interface RitualBlueprint {
  morning: RitualBlock;
  midday: RitualBlock;
  evening: RitualBlock;
}

interface TriggerReplacement {
  trigger: string;
  replacement: string;
}

export interface InputControl {
  mentors: string[];
  books: string[];
  podcasts: string[];
  playlists: string[];
  nutritionRules: string[];
  purgeList: string[];
}

export interface Distractions {
  digital: string[];
  physical: string[];
  social: string[];
  mental: string[];
  triggerReplacements: TriggerReplacement[];
}

export interface HabitAudit {
  productive: string[];
  neutral: string[];
  destructive: string[];
}

export interface VisionDomain {
  id: string;
  label: string;
  hex: string;
  canonicalIds: string[];
  actual: string;
  becoming: string;
  timeline: string;
  habits: string[];
  fundamentals?: {
    universal: string[];
    personal: string[];
  };
}

export interface VisionData {
  philosophy?: string;
  identityScript: IdentityScript;
  antiVision: { health: string; wealth: string; love: string; self: string };
  domains: VisionDomain[];
  intentions: {
    daily: string;
    weekly: string;
  };
  ritualBlueprint: RitualBlueprint;
  inputControl: InputControl;
  distractions: Distractions;
  habitAudit: HabitAudit;
}

