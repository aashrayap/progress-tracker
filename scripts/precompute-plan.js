#!/usr/bin/env node

// Pre-compute today's plan display and digest data.
// Outputs JSON to stdout with { display: { today_plan }, digest: { ... } }.
// Reads: plan.csv, daily_signals.csv

const path = require("path");
const { readCSV, todayStr } = require("./csv-utils");
const { SIGNAL_TO_PLAN_KEYWORD } = require("./config");

const DATA_ROOT = path.join(__dirname, "..", "data");
const today = todayStr();

// ── Helpers ──────────────────────────────────────────────────────

function daysSince(dateA, dateB) {
  const a = new Date(dateA + "T00:00:00");
  const b = new Date(dateB + "T00:00:00");
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

// Convert decimal hours to readable time: 9.5 → "9:30am", 14.0 → "2:00pm"
function decimalToTime(dec) {
  const num = parseFloat(dec);
  if (isNaN(num) || num === 0) return "";
  const hours24 = Math.floor(num);
  const minutes = Math.round((num - hours24) * 60);
  const suffix = hours24 >= 12 ? "pm" : "am";
  const hours12 = hours24 === 0 ? 12 : hours24 > 12 ? hours24 - 12 : hours24;
  return `${hours12}:${String(minutes).padStart(2, "0")}${suffix}`;
}

// Extract context text from a signal row
function extractContext(row) {
  if (row.unit && row.unit.startsWith("context: ")) return row.unit.slice(9);
  if (row.context && row.context !== "chat" && row.context !== "") return row.context;
  if (row.unit && row.unit !== "") return row.unit;
  return row.value || "";
}

// ── Read data ────────────────────────────────────────────────────

const plans = readCSV(path.join(DATA_ROOT, "plan.csv"));
const signals = readCSV(path.join(DATA_ROOT, "daily_signals.csv"));

// ── Display: today_plan ──────────────────────────────────────────

function buildTodayPlan() {
  const todayRows = plans.filter(r => r.date === today);
  if (todayRows.length === 0) return "No blocks scheduled for today.";

  // Separate timed vs all-day items
  const timed = [];
  const allDay = [];

  for (const row of todayRows) {
    const start = parseFloat(row.start);
    const end = parseFloat(row.end);
    if (start === 0 && end === 0) {
      allDay.push(row);
    } else {
      timed.push({ ...row, _start: start, _end: end });
    }
  }

  // Sort timed blocks by start time
  timed.sort((a, b) => a._start - b._start);

  // Inner content width between "│ " and " │" = 43
  const W = 43;
  function pad(s, w) { return s + " ".repeat(Math.max(0, w - s.length)); }

  const lines = [];
  lines.push("┌─ Today's Plan ──────────────────────────────┐");

  // All-day items first
  for (const row of allDay) {
    const done = row.done === "1" ? "✓" : "·";
    const status = row.done === "1" ? "done" : "open";
    const statusStr = `${done} ${status}`;
    const maxItem = W - 13 - statusStr.length;
    const item = row.item.length > maxItem ? row.item.substring(0, maxItem - 3) + "..." : row.item;
    const content = `${"all day".padEnd(12)} ${pad(item, W - 13 - statusStr.length)}${statusStr}`;
    lines.push(`│ ${pad(content, W)} │`);
  }

  // Timed items
  for (const row of timed) {
    const done = row.done === "1" ? "✓" : "·";
    const status = row.done === "1" ? "done" : "open";
    const statusStr = `${done} ${status}`;
    const startStr = decimalToTime(row._start);
    const endStr = decimalToTime(row._end);
    const timeSlot = row._start === row._end ? startStr : `${startStr}-${endStr}`;
    const timeCol = Math.max(12, timeSlot.length);
    const timePadded = pad(timeSlot, timeCol);
    const itemSpace = W - timeCol - 1 - statusStr.length;
    const maxItem = Math.max(6, itemSpace);
    const item = row.item.length > maxItem ? row.item.substring(0, maxItem - 3) + "..." : row.item;
    const content = `${timePadded} ${pad(item, itemSpace)}${statusStr}`;
    lines.push(`│ ${pad(content, W)} │`);
  }

  lines.push("└─────────────────────────────────────────────┘");

  return lines.join("\n");
}

// ── Digest ───────────────────────────────────────────────────────

function buildDigest() {
  // Weekly goals: current week's weekly_goal signals
  const weeklyGoals = [];
  for (const s of signals) {
    if (s.signal === "weekly_goal" && daysSince(s.date, today) <= 7 && daysSince(s.date, today) >= 0) {
      weeklyGoals.push({ goal: extractContext(s) });
    }
  }

  // Weekly intention
  const weeklyIntentionRows = signals
    .filter(s => s.signal === "weekly_intention" && daysSince(s.date, today) <= 7 && daysSince(s.date, today) >= 0)
    .sort((a, b) => b.date.localeCompare(a.date));
  const weeklyIntention = weeklyIntentionRows.length > 0 ? extractContext(weeklyIntentionRows[0]) : null;

  // Daily intention
  const dailyIntentionRow = signals.find(s => s.date === today && s.signal === "intention");
  const dailyIntention = dailyIntentionRow ? extractContext(dailyIntentionRow) : null;

  return {
    weekly_goals: weeklyGoals,
    weekly_intention: weeklyIntention,
    daily_intention: dailyIntention,
    signal_map: { ...SIGNAL_TO_PLAN_KEYWORD },
  };
}

// ── Output ───────────────────────────────────────────────────────

try {
  const output = {
    display: {
      today_plan: buildTodayPlan(),
    },
    digest: buildDigest(),
  };
  process.stdout.write(JSON.stringify(output, null, 2) + "\n");
} catch (err) {
  process.stderr.write(`precompute-plan error: ${err.message}\n`);
  process.stdout.write(JSON.stringify({
    display: { today_plan: "" },
    digest: {
      weekly_goals: [],
      weekly_intention: null,
      daily_intention: null,
      signal_map: { ...SIGNAL_TO_PLAN_KEYWORD },
    },
  }) + "\n");
  process.exit(1);
}
