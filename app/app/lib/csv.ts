import fs from "fs";
import path from "path";
import type { DailySignalEntry, IdeaEntry, InboxEntry } from "./types";
import { daysAgoStr, todayStr } from "./utils";

export type { DailySignalEntry, IdeaEntry, InboxEntry };

const ROOT = path.join(process.cwd(), "..");
const DAILY_SIGNALS_PATH = path.join(ROOT, "daily_signals.csv");
const INBOX_PATH = path.join(ROOT, "inbox.csv");
const IDEAS_PATH = path.join(ROOT, "ideas.csv");
const PLAN_PATH = path.join(ROOT, "plan.csv");
const TODOS_PATH = path.join(ROOT, "todos.csv");
const WORKOUTS_PATH = path.join(ROOT, "workouts.csv");
const REFLECTIONS_PATH = path.join(ROOT, "reflections.csv");

const DAILY_SIGNALS_HEADER = "date,signal,value,unit,context,source,capture_id,category";
const INBOX_HEADER =
  "capture_id,captured_at,source,raw_text,status,suggested_destination,normalized_text,error";
const IDEAS_HEADER = "id,created_at,title,details,domain,status,source,capture_id";
const PLAN_HEADER = "date,start,end,item,done,notes";
const TODOS_HEADER = "id,item,done,created";
const WORKOUTS_HEADER = "date,workout,exercise,set,weight,reps,notes";
const REFLECTIONS_HEADER = "date,domain,win,lesson,change";

export interface PlanEntry {
  date: string;
  start: number;
  end: number;
  item: string;
  done: string; // "1" | "0" | ""
  notes: string;
}

export interface TodoEntry {
  id: number;
  item: string;
  done: number; // 0 | 1
  created: string;
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
}

function ensureFileWithHeader(filePath: string, header: string): void {
  if (!fs.existsSync(filePath)) {
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
  fs.writeFileSync(filePath, header + "\n" + lines.join("\n") + (lines.length ? "\n" : ""));
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

export function upsertDailySignal(
  entry: DailySignalEntry,
  match: (row: DailySignalEntry) => boolean
): void {
  const rows = readDailySignals();
  const idx = rows.findIndex(match);
  if (idx === -1) rows.push(entry);
  else rows[idx] = entry;
  const lines = rows.map(serializeDailySignal);
  writeAll(DAILY_SIGNALS_PATH, DAILY_SIGNALS_HEADER, lines);
}

export interface MetricHistoryEntry {
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

export function getDayData(signals: DailySignalEntry[], date: string) {
  const entries = signals.filter((e) => e.date === date);
  const result: Record<string, { value: string; context: string; category: string }> = {};
  for (const e of entries) {
    result[e.signal] = {
      value: e.value,
      context: e.context || "",
      category: e.category || "",
    };
  }
  return result;
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

export function getLastResetDate(signals: DailySignalEntry[]): string | null {
  const resets = signals
    .filter((e) => e.signal === "reset")
    .sort((a, b) => b.date.localeCompare(a.date));
  return resets[0]?.date ?? null;
}

export function getDaysSince(dateStr: string): number {
  const start = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

// ─────────────────────────────────────────────────────────────────────────────
// Inbox
// ─────────────────────────────────────────────────────────────────────────────

export function readInbox(): InboxEntry[] {
  if (!fs.existsSync(INBOX_PATH)) return [];
  const lines = readDataLines(INBOX_PATH);
  return lines.map((line) => {
    const clean = parseCSVLine(line);
    return {
      captureId: clean[0] || "",
      capturedAt: clean[1] || "",
      source: clean[2] || "",
      rawText: clean[3] || "",
      status: (clean[4] as InboxEntry["status"]) || "new",
      suggestedDestination: clean[5] || "",
      normalizedText: clean[6] || "",
      error: clean[7] || "",
    };
  });
}

export function appendInbox(entries: InboxEntry[]): void {
  const lines = entries.map(
    (e) =>
      `${csvQuote(e.captureId)},${csvQuote(e.capturedAt)},${csvQuote(e.source)},${csvQuote(
        e.rawText
      )},${csvQuote(e.status)},${csvQuote(e.suggestedDestination)},${csvQuote(
        e.normalizedText || ""
      )},${csvQuote(e.error || "")}`
  );
  appendLines(INBOX_PATH, INBOX_HEADER, lines);
}

export function updateInboxEntry(
  captureId: string,
  updates: Partial<Omit<InboxEntry, "captureId">>
): void {
  const rows = readInbox();
  const idx = rows.findIndex((r) => r.captureId === captureId);
  if (idx === -1) return;
  rows[idx] = { ...rows[idx], ...updates };
  const lines = rows.map(
    (e) =>
      `${csvQuote(e.captureId)},${csvQuote(e.capturedAt)},${csvQuote(e.source)},${csvQuote(
        e.rawText
      )},${csvQuote(e.status)},${csvQuote(e.suggestedDestination)},${csvQuote(
        e.normalizedText || ""
      )},${csvQuote(e.error || "")}`
  );
  writeAll(INBOX_PATH, INBOX_HEADER, lines);
}

// ─────────────────────────────────────────────────────────────────────────────
// Ideas
// ─────────────────────────────────────────────────────────────────────────────

export function readIdeas(): IdeaEntry[] {
  if (!fs.existsSync(IDEAS_PATH)) return [];
  const lines = readDataLines(IDEAS_PATH);
  return lines.map((line) => {
    const clean = parseCSVLine(line);
    return {
      id: parseInt(clean[0], 10) || 0,
      createdAt: clean[1] || "",
      title: clean[2] || "",
      details: clean[3] || "",
      domain: (clean[4] as IdeaEntry["domain"]) || "system",
      status: (clean[5] as IdeaEntry["status"]) || "inbox",
      source: clean[6] || "",
      captureId: clean[7] || "",
    };
  });
}

export function appendIdea(
  entry: Omit<IdeaEntry, "id" | "createdAt"> & { id?: number; createdAt?: string }
): IdeaEntry {
  const ideas = readIdeas();
  const maxId = ideas.reduce((m, i) => Math.max(m, i.id), 0);
  const newIdea: IdeaEntry = {
    id: entry.id ?? maxId + 1,
    createdAt: entry.createdAt ?? new Date().toISOString(),
    title: entry.title,
    details: entry.details,
    domain: entry.domain,
    status: entry.status,
    source: entry.source,
    captureId: entry.captureId,
  };
  const line = `${newIdea.id},${csvQuote(newIdea.createdAt)},${csvQuote(newIdea.title)},${csvQuote(
    newIdea.details
  )},${newIdea.domain},${newIdea.status},${csvQuote(newIdea.source)},${csvQuote(newIdea.captureId)}`;
  appendLines(IDEAS_PATH, IDEAS_HEADER, [line]);
  return newIdea;
}

export function updateIdea(
  id: number,
  updates: Partial<Omit<IdeaEntry, "id" | "createdAt">>
): void {
  const ideas = readIdeas();
  const idx = ideas.findIndex((i) => i.id === id);
  if (idx === -1) return;
  ideas[idx] = { ...ideas[idx], ...updates };
  const lines = ideas.map(
    (e) =>
      `${e.id},${csvQuote(e.createdAt)},${csvQuote(e.title)},${csvQuote(e.details)},${e.domain},${e.status},${csvQuote(
        e.source
      )},${csvQuote(e.captureId)}`
  );
  writeAll(IDEAS_PATH, IDEAS_HEADER, lines);
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
    };
  });
}

function writeTodos(todos: TodoEntry[]): void {
  const lines = todos.map((t) => `${t.id},${csvQuote(t.item)},${t.done},${t.created}`);
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
    (p) => `${p.date},${p.start},${p.end},${csvQuote(p.item)},${p.done},${csvQuote(p.notes || "")}`
  );
  writeAll(PLAN_PATH, PLAN_HEADER, lines);
}

export function upsertPlanEntry(entry: PlanEntry): void {
  const all = readPlan();
  const idx = all.findIndex((p) => p.date === entry.date && p.item === entry.item);
  if (idx >= 0) all[idx] = entry;
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

export function getHabitsForDate(signals: DailySignalEntry[], date: string): Record<string, boolean> {
  const habitMetrics = ["weed", "lol", "poker", "gym", "sleep", "meditate", "deep_work", "ate_clean"];
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

export function appendWorkouts(entries: WorkoutSetEntry[]): void {
  const lines = entries.map(
    (e) =>
      `${e.date},${csvQuote(e.workout)},${csvQuote(e.exercise)},${e.set},${csvQuote(String(
        e.weight
      ))},${csvQuote(String(e.reps))},${csvQuote(e.notes || "")}`
  );
  appendLines(WORKOUTS_PATH, WORKOUTS_HEADER, lines);
}

const GYM_ROTATION = ["W1", "W2", "W3", "W4", "W5"] as const;

export function getNextWorkout(signals: DailySignalEntry[], cycle: string[] = [...GYM_ROTATION]): string {
  const gymDays = signals
    .filter((e) => e.signal === "gym" && e.value === "1")
    .sort((a, b) => b.date.localeCompare(a.date));

  if (gymDays.length === 0) return cycle[0] || "W1";

  const source = `${gymDays[0].context || ""} ${gymDays[0].category || ""}`;
  const dayMatch = source.match(/Day\s*([A-Za-z0-9_-]+)/i)?.[1];
  const fallback = gymDays[0].category || "";
  const lastDay = (dayMatch || fallback).toUpperCase();
  const cycleUpper = cycle.map((item) => item.toUpperCase());
  const lastIdx = cycleUpper.indexOf(lastDay);
  if (lastIdx === -1) return cycle[0] || "W1";
  return cycle[(lastIdx + 1) % cycle.length];
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
    };
  });
}

export function appendReflection(entry: ReflectionEntry): void {
  const line = `${entry.date},${entry.domain},${csvQuote(entry.win)},${csvQuote(entry.lesson)},${csvQuote(
    entry.change
  )}`;
  appendLines(REFLECTIONS_PATH, REFLECTIONS_HEADER, [line]);
}

export function getYesterdayChanges(reflections: ReflectionEntry[]): ReflectionEntry[] {
  const yesterday = daysAgoStr(1);
  return reflections.filter((r) => r.date === yesterday && r.change.trim());
}
