import fs from "fs";
import path from "path";
import type {
  DailySignalEntry,
  ExerciseProgressEntry,
  ExerciseTarget,
  GroceryEntry,

  QuoteEntry,
  VisionData,
  WorkoutDay,
} from "./types";
import { daysAgoStr, todayStr } from "./utils";
import { config, normalizeWorkoutKey } from "./config";

export type { DailySignalEntry };

const ROOT = path.join(process.cwd(), "..");
const DATA_ROOT = path.join(ROOT, "data");
const DAILY_SIGNALS_PATH = path.join(DATA_ROOT, "daily_signals.csv");
const PLAN_PATH = path.join(DATA_ROOT, "plan.csv");
const TODOS_PATH = path.join(DATA_ROOT, "todos.csv");
const WORKOUTS_PATH = path.join(DATA_ROOT, "workouts.csv");
const REFLECTIONS_PATH = path.join(DATA_ROOT, "reflections.csv");

const DAILY_SIGNALS_HEADER = "date,signal,value,unit,context,source,capture_id,category";
const PLAN_HEADER = "date,start,end,item,done,notes,domain";
const TODOS_HEADER = "id,item,done,created,domain";
const WORKOUTS_HEADER = "date,workout,exercise,set,weight,reps,notes";
const REFLECTIONS_HEADER = "date,domain,win,lesson,change,archived";
const GROCERIES_PATH = path.join(DATA_ROOT, "groceries.csv");
const GROCERIES_HEADER = "item,section,done,added";
const QUOTES_PATH = path.join(DATA_ROOT, "quotes.csv");
const QUOTES_HEADER = "id,text,author,source,domain,added";
const BRIEFING_PATH = path.join(DATA_ROOT, "briefing.json");
const VISION_PATH = path.join(DATA_ROOT, "vision.json");
const BRIEFING_FEEDBACK_PATH = path.join(DATA_ROOT, "briefing_feedback.csv");
const BRIEFING_FEEDBACK_HEADER = "date,state,rating,feedback_text,briefing_hash";
const EXPERIMENTS_PATH = path.join(DATA_ROOT, "experiments.csv");
const EXPERIMENTS_HEADER = "name,hypothesis,start_date,duration_days,domain,status,verdict,reflection";

export interface PlanEntry {
  date: string;
  start: number;
  end: number;
  item: string;
  done: string; // "1" | "0" | ""
  notes: string;
  domain?: string;
}

interface TodoEntry {
  id: number;
  item: string;
  done: number; // 0 | 1
  created: string;
  domain?: string;
}

export interface WorkoutSetEntry {
  date: string;
  workout: string;
  exercise: string;
  set: number;
  weight: number;
  reps: number;
  notes: string;
}

export interface ReflectionEntry {
  date: string;
  domain: string;
  win: string;
  lesson: string;
  change: string;
  archived?: string;
}

export interface ExperimentEntry {
  name: string;
  hypothesis: string;
  startDate: string;      // YYYY-MM-DD
  durationDays: number;   // default 7
  domain: string;         // canonical domain ID
  status: string;         // "active" | "concluded"
  verdict: string;        // "" | "kept" | "dropped" | "extended"
  reflection: string;     // "" when active
}

function ensureFileWithHeader(filePath: string, header: string): void {
  if (!fs.existsSync(filePath)) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, header + "\n");
  }
}

function parseCSVLine(line: string): string[] {
  const out: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      const next = line[i + 1];
      if (inQuotes && next === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      out.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  out.push(current.trim());
  return out;
}

function csvQuote(value: string): string {
  if (!value) return "";
  const escaped = value.replace(/"/g, '""');
  return /[",\n]/.test(value) ? `"${escaped}"` : value;
}

function readDataLines(filePath: string): string[] {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, "utf-8");
  const trimmed = content.trim();
  if (!trimmed) return [];
  return trimmed.split("\n").slice(1).filter(Boolean);
}

function appendLines(filePath: string, header: string, lines: string[]): void {
  if (lines.length === 0) return;
  ensureFileWithHeader(filePath, header);
  const existing = fs.readFileSync(filePath, "utf-8");
  const sep = existing.endsWith("\n") ? "" : "\n";
  fs.appendFileSync(filePath, sep + lines.join("\n") + "\n");
}

function writeAll(filePath: string, header: string, lines: string[]): void {
  const content = header + "\n" + lines.join("\n") + (lines.length ? "\n" : "");
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  const base = path.basename(filePath);
  const tmpPath = path.join(dir, `.${base}.tmp-${process.pid}-${Date.now()}`);
  fs.writeFileSync(tmpPath, content);
  fs.renameSync(tmpPath, filePath);
}

function serializeDailySignal(entry: DailySignalEntry): string {
  return `${entry.date},${entry.signal},${csvQuote(entry.value)},${csvQuote(entry.unit || "")},${csvQuote(
    entry.context || ""
  )},${csvQuote(entry.source || "")},${csvQuote(entry.captureId || "")},${csvQuote(entry.category || "")}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Daily signals (canonical)
// ─────────────────────────────────────────────────────────────────────────────

export function readDailySignals(): DailySignalEntry[] {
  if (!fs.existsSync(DAILY_SIGNALS_PATH)) return [];
  const lines = readDataLines(DAILY_SIGNALS_PATH);
  return lines.map((line) => {
    const clean = parseCSVLine(line);
    return {
      date: clean[0] || "",
      signal: clean[1] || "",
      value: clean[2] || "",
      unit: clean[3] || "",
      context: clean[4] || "",
      source: clean[5] || "",
      captureId: clean[6] || "",
      category: clean[7] || "",
    };
  });
}

export function appendDailySignals(entries: DailySignalEntry[]): void {
  const lines = entries.map(serializeDailySignal);
  appendLines(DAILY_SIGNALS_PATH, DAILY_SIGNALS_HEADER, lines);
}

export function deleteDailySignal(date: string, signal: string): void {
  const all = readDailySignals().filter((s) => !(s.date === date && s.signal === signal));
  writeAll(DAILY_SIGNALS_PATH, DAILY_SIGNALS_HEADER, all.map(serializeDailySignal));
}

interface MetricHistoryEntry {
  date: string;
  value: string;
  context: string;
  category: string;
}

export function getMetricHistory(signals: DailySignalEntry[], signal: string): MetricHistoryEntry[] {
  return signals
    .filter((e) => e.signal === signal)
    .map((e) => ({
      date: e.date,
      value: e.value,
      context: e.context || "",
      category: e.category || "",
    }));
}

export function getLatestValue(signals: DailySignalEntry[], signal: string): string | null {
  const entries = signals
    .filter((e) => e.signal === signal)
    .sort((a, b) => b.date.localeCompare(a.date));
  return entries[0]?.value ?? null;
}

export function getStreak(signals: DailySignalEntry[], signal: string): number {
  const entries = signals
    .filter((e) => e.signal === signal)
    .sort((a, b) => b.date.localeCompare(a.date));

  let streak = 0;
  for (const e of entries) {
    if (e.value === "1") streak++;
    else break;
  }
  return streak;
}

export function getDaysSince(dateStr: string): number {
  const start = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

// ─────────────────────────────────────────────────────────────────────────────
// Todos
// ─────────────────────────────────────────────────────────────────────────────

export function readTodos(): TodoEntry[] {
  if (!fs.existsSync(TODOS_PATH)) return [];
  const lines = readDataLines(TODOS_PATH);
  return lines.map((line) => {
    const clean = parseCSVLine(line);
    return {
      id: parseInt(clean[0], 10) || 0,
      item: clean[1] || "",
      done: parseInt(clean[2], 10) || 0,
      created: clean[3] || "",
      domain: clean[4] || "",
    };
  });
}

function writeTodos(todos: TodoEntry[]): void {
  const lines = todos.map(
    (t) => `${t.id},${csvQuote(t.item)},${t.done},${t.created},${csvQuote(t.domain || "")}`
  );
  writeAll(TODOS_PATH, TODOS_HEADER, lines);
}

export function appendTodo(item: string): TodoEntry {
  const todos = readTodos();
  const maxId = todos.reduce((max, t) => Math.max(max, t.id), 0);
  const entry: TodoEntry = {
    id: maxId + 1,
    item,
    done: 0,
    created: todayStr(),
    domain: "",
  };
  todos.push(entry);
  writeTodos(todos);
  return entry;
}

export function updateTodo(id: number, updates: Partial<Pick<TodoEntry, "done" | "item">>): void {
  const todos = readTodos();
  const idx = todos.findIndex((t) => t.id === id);
  if (idx === -1) return;
  if (updates.done !== undefined) todos[idx].done = updates.done;
  if (updates.item !== undefined) todos[idx].item = updates.item;
  writeTodos(todos);
}

export function deleteTodo(id: number): void {
  const todos = readTodos().filter((t) => t.id !== id);
  writeTodos(todos);
}

// ─────────────────────────────────────────────────────────────────────────────
// Plan
// ─────────────────────────────────────────────────────────────────────────────

export function readPlan(): PlanEntry[] {
  if (!fs.existsSync(PLAN_PATH)) return [];
  const lines = readDataLines(PLAN_PATH);
  return lines.map((line) => {
    const clean = parseCSVLine(line);
    return {
      date: clean[0] || "",
      start: parseFloat(clean[1]) || 0,
      end: parseFloat(clean[2]) || 0,
      item: clean[3] || "",
      done: clean[4] || "",
      notes: clean[5] || "",
      domain: clean[6] || "",
    };
  });
}

export function getTodaysPlan(plan: PlanEntry[]): PlanEntry[] {
  const today = todayStr();
  return plan
    .filter((p) => p.date === today)
    .sort((a, b) => a.start - b.start);
}

function writePlan(entries: PlanEntry[]): void {
  const lines = entries.map(
    (p) =>
      `${p.date},${p.start},${p.end},${csvQuote(p.item)},${p.done},${csvQuote(p.notes || "")},${csvQuote(
        p.domain || ""
      )}`
  );
  writeAll(PLAN_PATH, PLAN_HEADER, lines);
}

export function upsertPlanEntry(entry: PlanEntry): void {
  const all = readPlan();
  const idx = all.findIndex((p) => p.date === entry.date && p.item === entry.item);
  if (idx >= 0) all[idx] = { ...all[idx], ...entry, domain: entry.domain ?? all[idx].domain ?? "" };
  else all.push(entry);
  writePlan(all);
}

export function deletePlanEntry(date: string, item: string): void {
  const all = readPlan().filter((p) => !(p.date === date && p.item === item));
  writePlan(all);
}

export function getPlanForDateRange(plan: PlanEntry[], start: string, end: string): PlanEntry[] {
  return plan
    .filter((p) => p.date >= start && p.date <= end)
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.start - b.start;
    });
}

export interface CurrentIntention {
  date: string;
  domain: string;
  mantra: string;
}

export interface CurrentIntentions {
  dailyIntention: CurrentIntention | null;
  weeklyIntention: CurrentIntention | null;
}

const SOURCE_LIKE_TOKENS = new Set(["chat", "voice", "manual", "cli", "api", "shortcut", "ios", "iphone", "android"]);

function stripContextPrefix(value: string): string {
  return value.replace(/^context\s*:\s*/i, "").trim();
}

function isSourceLikeToken(value: string, entry: DailySignalEntry): boolean {
  const token = value.trim().toLowerCase();
  if (!token) return false;
  if (SOURCE_LIKE_TOKENS.has(token)) return true;
  if ((entry.source || "").trim().toLowerCase() === token) return true;
  if ((entry.captureId || "").trim().toLowerCase() === token) return true;
  return false;
}

function extractIntentionMantra(entry: DailySignalEntry): string {
  const context = stripContextPrefix((entry.context || "").trim());
  if (context && !isSourceLikeToken(context, entry)) return context;

  const unit = stripContextPrefix((entry.unit || "").trim());
  if (unit && !isSourceLikeToken(unit, entry)) return unit;

  const value = stripContextPrefix((entry.value || "").trim());
  if (value && !isSourceLikeToken(value, entry)) return value;

  return "";
}

function toCurrentIntention(entry: DailySignalEntry): CurrentIntention {
  return {
    date: entry.date,
    domain: (entry.category || "").trim() || (entry.value || "").trim(),
    mantra: extractIntentionMantra(entry),
  };
}

export function getCurrentIntentions(): CurrentIntentions {
  const signals = readDailySignals();
  const today = todayStr();

  const daily = signals.findLast((entry) => entry.signal === "intention" && entry.date === today) || null;

  const weeklyRows = signals.filter((entry) => entry.signal === "weekly_intention");
  const latestWeeklyDate = weeklyRows.reduce((latest, entry) => {
    return entry.date > latest ? entry.date : latest;
  }, "");
  const weekly =
    weeklyRows.findLast((entry) => entry.date === latestWeeklyDate) || null;

  return {
    dailyIntention: daily ? toCurrentIntention(daily) : null,
    weeklyIntention: weekly ? toCurrentIntention(weekly) : null,
  };
}

export function getHabitsForDate(signals: DailySignalEntry[], date: string): Record<string, boolean> {
  const habitMetrics = ["weed", "lol", "poker", "clarity", "gym", "sleep", "meditate", "deep_work", "ate_clean", "morning_review", "midday_review", "evening_review", "wim_hof_am", "wim_hof_pm"];
  const dayEntries = signals.filter((e) => e.date === date && habitMetrics.includes(e.signal));
  const habits: Record<string, boolean> = {};
  for (const entry of dayEntries) {
    habits[entry.signal] = entry.value === "1";
  }
  return habits;
}

// ─────────────────────────────────────────────────────────────────────────────
// Workouts
// ─────────────────────────────────────────────────────────────────────────────

export function readWorkouts(): WorkoutSetEntry[] {
  if (!fs.existsSync(WORKOUTS_PATH)) return [];
  const lines = readDataLines(WORKOUTS_PATH);
  return lines.map((line) => {
    const clean = parseCSVLine(line);
    return {
      date: clean[0] || "",
      workout: clean[1] || "",
      exercise: clean[2] || "",
      set: parseInt(clean[3], 10) || 0,
      weight: parseFloat(clean[4]) || 0,
      reps: parseInt(clean[5], 10) || 0,
      notes: clean[6] || "",
    };
  });
}

export function groupWorkoutsByDay(entries: WorkoutSetEntry[]): WorkoutDay[] {
  const allExercises = Object.values(config.exercises).flat();
  const cycle = ["A", "B", "C", "D", "E", "F", "G"];
  const byDate: Record<string, WorkoutSetEntry[]> = {};

  for (const entry of entries) {
    if (!byDate[entry.date]) byDate[entry.date] = [];
    byDate[entry.date].push(entry);
  }

  return Object.entries(byDate)
    .map(([date, sets]) => {
      const rawWorkout = sets[0]?.workout || "";
      const workout = normalizeWorkoutKey(rawWorkout, cycle) || rawWorkout;
      const byExercise: Record<string, WorkoutSetEntry[]> = {};

      for (const set of sets) {
        if (!byExercise[set.exercise]) byExercise[set.exercise] = [];
        byExercise[set.exercise].push(set);
      }

      const exercises = Object.entries(byExercise).map(([exerciseId, exerciseSets]) => {
        const def = allExercises.find((exercise) => exercise.id === exerciseId);
        return {
          name: def?.name || exerciseId,
          id: exerciseId,
          sets: exerciseSets
            .sort((a, b) => a.set - b.set)
            .map((set) => ({
              set: set.set,
              weight: set.weight,
              reps: set.reps,
              notes: set.notes,
            })),
        };
      });

      return { date, workout, exercises };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getExerciseProgress(
  workoutDays: WorkoutDay[]
): Record<string, ExerciseProgressEntry[]> {
  const progress: Record<string, ExerciseProgressEntry[]> = {};
  const chronological = [...workoutDays].reverse();

  for (const day of chronological) {
    for (const exercise of day.exercises) {
      if (exercise.sets.length === 0) continue;
      if (!progress[exercise.id]) progress[exercise.id] = [];

      const bestSet = exercise.sets.reduce((best, set) => {
        if (set.weight > best.weight) return set;
        if (set.weight === best.weight && set.reps > best.reps) return set;
        return best;
      }, exercise.sets[0]);

      progress[exercise.id].push({
        date: day.date,
        bestWeight: bestSet.weight,
        bestReps: bestSet.reps,
      });
    }
  }

  return progress;
}

/**
 * For each prescribed exercise, find the last session's sets and compute
 * progressive overload targets.
 *
 * Rules:
 * - Parse rep range from config (e.g. "5-8" → min=5, max=8)
 * - If all working sets hit max reps → bump weight +5lbs, reset reps to min
 * - Otherwise → same weight, aim for +1 rep per set (capped at max)
 */
export function getExerciseTargets(
  prescribedIds: string[],
  workoutDays: WorkoutDay[]
): ExerciseTarget[] {
  const allExercises = Object.values(config.exercises).flat();
  const chronological = [...workoutDays].sort((a, b) => a.date.localeCompare(b.date));

  return prescribedIds.map((id) => {
    const def = allExercises.find((e) => e.id === id);
    const name = def?.name || id;
    const repRange = def?.reps || "5-8";
    const prescribedSets = def?.sets || 3;

    // Parse rep range
    const rangeMatch = repRange.match(/(\d+)\s*[-–]\s*(\d+)/);
    const minReps = rangeMatch ? parseInt(rangeMatch[1], 10) : 5;
    const maxReps = rangeMatch ? parseInt(rangeMatch[2], 10) : 8;

    // Find last session with this exercise (skip today)
    let lastDay: WorkoutDay | null = null;
    for (let i = chronological.length - 1; i >= 0; i--) {
      const day = chronological[i];
      const hasExercise = day.exercises.some((e) => e.id === id);
      if (hasExercise) {
        lastDay = day;
        break;
      }
    }

    if (!lastDay) {
      // No history — just show the prescribed rep range
      return {
        id,
        name,
        lastSets: [],
        lastDate: "",
        targetSets: Array.from({ length: prescribedSets }, () => ({
          weight: 0,
          reps: repRange,
        })),
        note: "first session",
      };
    }

    const lastExercise = lastDay.exercises.find((e) => e.id === id)!;
    const lastSets = lastExercise.sets.map((s) => ({
      weight: s.weight,
      reps: s.reps,
      notes: s.notes,
    }));

    // Filter to working sets (exclude warm-up / notes-only)
    const workingSets = lastSets.filter(
      (s) => s.weight > 0 && !s.notes.toLowerCase().includes("warm")
    );

    if (workingSets.length === 0) {
      return {
        id,
        name,
        lastSets,
        lastDate: lastDay.date,
        targetSets: Array.from({ length: prescribedSets }, () => ({
          weight: 0,
          reps: repRange,
        })),
        note: "no working sets found",
      };
    }

    // Determine weight increment (10 for squat/rdl/front_squat/deadlift, 5 for upper)
    const lowerBodyIds = ["squat", "front_squat", "rdl", "lunges", "trap_bar_deadlift"];
    const increment = lowerBodyIds.includes(id) ? 10 : 5;

    // Per-set logic: if a set already hit/exceeded max reps, bump its weight.
    // Otherwise keep same weight, push +1 rep.
    let hasWeightBump = false;
    const targetSets = workingSets.map((s) => {
      if (s.reps >= maxReps) {
        hasWeightBump = true;
        return {
          weight: s.weight + increment,
          reps: `${minReps}+`,
        };
      }
      return {
        weight: s.weight,
        reps: `${Math.min(s.reps + 1, maxReps)}+`,
      };
    });

    const allHitMax = workingSets.every((s) => s.reps >= maxReps);
    const topWeight = Math.max(...workingSets.map((s) => s.weight));
    let note: string;
    if (allHitMax) {
      note = `+${increment}lbs → ${topWeight + increment}`;
    } else if (hasWeightBump) {
      note = "mixed — some sets weight up";
    } else {
      note = "push reps";
    }

    return {
      id,
      name,
      lastSets,
      lastDate: lastDay.date,
      targetSets,
      note,
    };
  });
}

export function appendWorkouts(entries: WorkoutSetEntry[]): void {
  const lines = entries.map(
    (e) =>
      `${e.date},${csvQuote(e.workout)},${csvQuote(e.exercise)},${e.set},${csvQuote(String(
        e.weight
      ))},${csvQuote(String(e.reps))},${csvQuote(e.notes || "")}`
  );
  appendLines(WORKOUTS_PATH, WORKOUTS_HEADER, lines);
}

const DOW_TO_PROGRAM_KEY: Record<number, string | null> = {
  0: null,   // Sunday — rest
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: null,   // Saturday — rest
};

/**
 * Returns the program day key for a given weekday number (0=Sun, 6=Sat).
 * Returns null for rest days (Sat/Sun).
 */
export function getTodayWorkout(weekday?: number): string | null {
  const dow = weekday !== undefined ? weekday : new Date().getDay();
  return DOW_TO_PROGRAM_KEY[dow] ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Reflections
// ─────────────────────────────────────────────────────────────────────────────

export function readReflections(): ReflectionEntry[] {
  if (!fs.existsSync(REFLECTIONS_PATH)) return [];
  const lines = readDataLines(REFLECTIONS_PATH);
  return lines.map((line) => {
    const clean = parseCSVLine(line);
    return {
      date: clean[0] || "",
      domain: clean[1] || "",
      win: clean[2] || "",
      lesson: clean[3] || "",
      change: clean[4] || "",
      archived: clean[5] || "",
    };
  });
}

export function appendReflection(entry: ReflectionEntry): void {
  const line = `${entry.date},${entry.domain},${csvQuote(entry.win)},${csvQuote(entry.lesson)},${csvQuote(
    entry.change
  )},${entry.archived || ""}`;
  appendLines(REFLECTIONS_PATH, REFLECTIONS_HEADER, [line]);
}


// ─────────────────────────────────────────────────────────────────────────────
// Groceries
// ─────────────────────────────────────────────────────────────────────────────

function serializeGrocery(g: GroceryEntry): string {
  return `${csvQuote(g.item)},${csvQuote(g.section)},${g.done},${g.added}`;
}

function writeGroceries(groceries: GroceryEntry[]): void {
  const lines = groceries.map(serializeGrocery);
  writeAll(GROCERIES_PATH, GROCERIES_HEADER, lines);
}

export function readGroceries(): GroceryEntry[] {
  if (!fs.existsSync(GROCERIES_PATH)) return [];
  const lines = readDataLines(GROCERIES_PATH);
  return lines.map((line) => {
    const c = parseCSVLine(line);
    return {
      item: c[0] || "",
      section: c[1] || "",
      done: parseInt(c[2], 10) || 0,
      added: c[3] || "",
    };
  });
}

export function appendGrocery(item: string, section: string): GroceryEntry {
  const entry: GroceryEntry = { item, section, done: 0, added: todayStr() };
  appendLines(GROCERIES_PATH, GROCERIES_HEADER, [serializeGrocery(entry)]);
  return entry;
}

export function updateGrocery(item: string, updates: Partial<Pick<GroceryEntry, "done">>): void {
  const groceries = readGroceries();
  const idx = groceries.findIndex((g) => g.item === item);
  if (idx === -1) return;
  if (updates.done !== undefined) groceries[idx].done = updates.done;
  writeGroceries(groceries);
}

export function deleteGrocery(item: string): void {
  const groceries = readGroceries().filter((g) => g.item !== item);
  writeGroceries(groceries);
}

export function clearDoneGroceries(): void {
  const groceries = readGroceries().filter((g) => g.done !== 1);
  writeGroceries(groceries);
}

// ─────────────────────────────────────────────────────────────────────────────
// Quotes
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Briefing
// ─────────────────────────────────────────────────────────────────────────────

export interface BriefingData {
  state: "momentum" | "recovery" | "neutral" | "danger" | "explore" | "disruption";
  insight: string;
  priorities: string[];
  quote: { text: string; author: string };
  generated_at: string;
  input_hash: string;
  verified: boolean;
}

interface BriefingFeedbackEntry {
  date: string;
  state: string;
  rating: string;
  feedback_text: string;
  briefing_hash: string;
}

export function readBriefing(): BriefingData | null {
  if (!fs.existsSync(BRIEFING_PATH)) return null;
  try {
    const raw = fs.readFileSync(BRIEFING_PATH, "utf-8");
    return JSON.parse(raw) as BriefingData;
  } catch {
    return null;
  }
}

export function readVision(): VisionData | null {
  if (!fs.existsSync(VISION_PATH)) return null;
  try {
    const raw = fs.readFileSync(VISION_PATH, "utf-8");
    return JSON.parse(raw) as VisionData;
  } catch {
    return null;
  }
}

export function writeVision(data: VisionData): void {
  const dir = path.dirname(VISION_PATH);
  const base = path.basename(VISION_PATH);
  const tmpPath = path.join(dir, `.${base}.tmp-${process.pid}-${Date.now()}`);
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2) + "\n");
  fs.renameSync(tmpPath, VISION_PATH);
}

export function appendBriefingFeedback(entry: BriefingFeedbackEntry): void {
  const line = `${entry.date},${csvQuote(entry.state)},${csvQuote(entry.rating)},${csvQuote(entry.feedback_text)},${csvQuote(entry.briefing_hash)}`;
  appendLines(BRIEFING_FEEDBACK_PATH, BRIEFING_FEEDBACK_HEADER, [line]);
}

export function readQuotes(): QuoteEntry[] {
  if (!fs.existsSync(QUOTES_PATH)) return [];
  const lines = readDataLines(QUOTES_PATH);
  return lines.map((line) => {
    const c = parseCSVLine(line);
    // CSV may be id,text,author,source,added (5 cols) or id,text,author,source,domain,added (6 cols)
    const hasDomain = c.length >= 6;
    return {
      id: parseInt(c[0], 10) || 0,
      text: c[1] || "",
      author: c[2] || "",
      source: c[3] || "",
      domain: hasDomain ? (c[4] || "") : "",
      added: hasDomain ? (c[5] || "") : (c[4] || ""),
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Experiments
// ─────────────────────────────────────────────────────────────────────────────

function serializeExperiment(entry: ExperimentEntry): string {
  return `${csvQuote(entry.name)},${csvQuote(entry.hypothesis)},${entry.startDate},${entry.durationDays},${csvQuote(entry.domain)},${entry.status},${entry.verdict},${csvQuote(entry.reflection)}`;
}

export function readExperiments(): ExperimentEntry[] {
  if (!fs.existsSync(EXPERIMENTS_PATH)) return [];
  const lines = readDataLines(EXPERIMENTS_PATH);
  return lines.map((line) => {
    const c = parseCSVLine(line);
    return {
      name: c[0] || "",
      hypothesis: c[1] || "",
      startDate: c[2] || "",
      durationDays: parseInt(c[3], 10) || 7,
      domain: c[4] || "",
      status: c[5] || "active",
      verdict: c[6] || "",
      reflection: c[7] || "",
    };
  });
}

