import fs from "fs";
import path from "path";

export interface LogEntry {
  date: string;
  metric: string;
  value: string;
  notes: string;
}

const LOG_PATH = path.join(process.cwd(), "..", "log.csv");
const PLAN_PATH = path.join(process.cwd(), "..", "plan.csv");
const TODOS_PATH = path.join(process.cwd(), "..", "todos.csv");
const WORKOUTS_PATH = path.join(process.cwd(), "..", "workouts.csv");

export interface PlanEntry {
  date: string;
  start: number;
  end: number;
  item: string;
  done: string; // "1" | "0" | ""
  notes: string;
}

export function readPlan(): PlanEntry[] {
  if (!fs.existsSync(PLAN_PATH)) {
    return [];
  }
  const content = fs.readFileSync(PLAN_PATH, "utf-8");
  const lines = content.trim().split("\n").slice(1);

  return lines.map((line) => {
    const fields = line.match(/(".*?"|[^,]*)(?:,|$)/g) || [];
    const clean = fields.map((f) => f.replace(/,$/, "").replace(/^"|"$/g, "").trim());
    return {
      date: clean[0] || "",
      start: parseFloat(clean[1]) || 0,
      end: parseFloat(clean[2]) || 0,
      item: clean[3] || "",
      done: clean[4] || "",
      notes: clean[5] || "",
    };
  });
}

export function getTodaysPlan(plan: PlanEntry[]): PlanEntry[] {
  const today = new Date().toISOString().split("T")[0];
  return plan
    .filter((p) => p.date === today)
    .sort((a, b) => a.start - b.start);
}

export function readLog(): LogEntry[] {
  if (!fs.existsSync(LOG_PATH)) {
    return [];
  }
  const content = fs.readFileSync(LOG_PATH, "utf-8");
  const lines = content.trim().split("\n").slice(1); // skip header

  return lines.map((line) => {
    // Handle quoted fields with commas
    const matches = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g) || [];
    const [date = "", metric = "", value = "", notes = ""] = matches.map((m) =>
      m.replace(/^"|"$/g, "").trim()
    );
    return { date, metric, value, notes };
  });
}

export function appendLog(entries: LogEntry[]): void {
  const lines = entries.map(
    (e) => `${e.date},${e.metric},${e.value},${e.notes.includes(",") ? `"${e.notes}"` : e.notes}`
  );
  fs.appendFileSync(LOG_PATH, "\n" + lines.join("\n"));
}

// Aggregation helpers
export function getMetricHistory(log: LogEntry[], metric: string) {
  return log
    .filter((e) => e.metric === metric)
    .map((e) => ({ date: e.date, value: e.value, notes: e.notes }));
}

export function getDayData(log: LogEntry[], date: string) {
  const entries = log.filter((e) => e.date === date);
  const result: Record<string, { value: string; notes: string }> = {};
  for (const e of entries) {
    result[e.metric] = { value: e.value, notes: e.notes };
  }
  return result;
}

export function getLatestValue(log: LogEntry[], metric: string): string | null {
  const entries = log
    .filter((e) => e.metric === metric)
    .sort((a, b) => b.date.localeCompare(a.date));
  return entries[0]?.value ?? null;
}

export function getStreak(log: LogEntry[], metric: string): number {
  const entries = log
    .filter((e) => e.metric === metric)
    .sort((a, b) => b.date.localeCompare(a.date));

  let streak = 0;
  for (const e of entries) {
    if (e.value === "1") streak++;
    else break;
  }
  return streak;
}

export function getLastResetDate(log: LogEntry[]): string | null {
  const resets = log
    .filter((e) => e.metric === "reset")
    .sort((a, b) => b.date.localeCompare(a.date));
  return resets[0]?.date ?? null;
}

export function getDaysSince(dateStr: string): number {
  const start = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

// ─── Todos ───

export interface TodoEntry {
  id: number;
  item: string;
  done: number; // 0 | 1
  created: string;
}

export function readTodos(): TodoEntry[] {
  if (!fs.existsSync(TODOS_PATH)) return [];
  const content = fs.readFileSync(TODOS_PATH, "utf-8");
  const lines = content.trim().split("\n").slice(1);
  return lines.filter(Boolean).map((line) => {
    const [id = "", item = "", done = "", created = ""] = line.split(",");
    return {
      id: parseInt(id) || 0,
      item: item.trim(),
      done: parseInt(done) || 0,
      created: created.trim(),
    };
  });
}

function writeTodos(todos: TodoEntry[]): void {
  const header = "id,item,done,created";
  const lines = todos.map((t) => `${t.id},${t.item},${t.done},${t.created}`);
  fs.writeFileSync(TODOS_PATH, header + "\n" + lines.join("\n") + "\n");
}

export function appendTodo(item: string): TodoEntry {
  const todos = readTodos();
  const maxId = todos.reduce((max, t) => Math.max(max, t.id), 0);
  const entry: TodoEntry = {
    id: maxId + 1,
    item,
    done: 0,
    created: new Date().toISOString().split("T")[0],
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

// ─── Plan (range query) ───

export function getPlanForDateRange(plan: PlanEntry[], start: string, end: string): PlanEntry[] {
  return plan
    .filter((p) => p.date >= start && p.date <= end)
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.start - b.start;
    });
}

export function getHabitsForDate(log: LogEntry[], date: string): Record<string, boolean> {
  const habitMetrics = ["weed", "lol", "poker", "gym", "sleep", "meditate", "deep_work", "ate_clean"];
  const dayEntries = log.filter((e) => e.date === date && habitMetrics.includes(e.metric));
  const habits: Record<string, boolean> = {};
  for (const entry of dayEntries) {
    habits[entry.metric] = entry.value === "1";
  }
  return habits;
}

// ─── Plan (write) ───

function writePlan(entries: PlanEntry[]): void {
  const header = "date,start,end,item,done,notes";
  const lines = entries.map((p) => {
    const notes = p.notes?.includes(",") ? `"${p.notes}"` : (p.notes || "");
    return `${p.date},${p.start},${p.end},${p.item},${p.done},${notes}`;
  });
  fs.writeFileSync(PLAN_PATH, header + "\n" + lines.join("\n") + "\n");
}

export function upsertPlanEntry(entry: PlanEntry): void {
  const all = readPlan();
  const idx = all.findIndex((p) => p.date === entry.date && p.item === entry.item);
  if (idx >= 0) {
    all[idx] = entry;
  } else {
    all.push(entry);
  }
  writePlan(all);
}

export function deletePlanEntry(date: string, item: string): void {
  const all = readPlan().filter((p) => !(p.date === date && p.item === item));
  writePlan(all);
}

// ─── Workouts ───

export interface WorkoutSetEntry {
  date: string;
  workout: string;
  exercise: string;
  set: number;
  weight: number;
  reps: number;
  notes: string;
}

export function readWorkouts(): WorkoutSetEntry[] {
  if (!fs.existsSync(WORKOUTS_PATH)) return [];
  const content = fs.readFileSync(WORKOUTS_PATH, "utf-8");
  const lines = content.trim().split("\n").slice(1);
  return lines.filter(Boolean).map((line) => {
    const fields = line.match(/(".*?"|[^,]*)(?:,|$)/g) || [];
    const clean = fields.map((f) => f.replace(/,$/, "").replace(/^"|"$/g, "").trim());
    return {
      date: clean[0] || "",
      workout: clean[1] || "",
      exercise: clean[2] || "",
      set: parseInt(clean[3]) || 0,
      weight: parseFloat(clean[4]) || 0,
      reps: parseInt(clean[5]) || 0,
      notes: clean[6] || "",
    };
  });
}
