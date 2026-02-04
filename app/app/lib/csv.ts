import fs from "fs";
import path from "path";

export interface LogEntry {
  date: string;
  metric: string;
  value: string;
  notes: string;
}

const LOG_PATH = path.join(process.cwd(), "..", "log.csv");

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
