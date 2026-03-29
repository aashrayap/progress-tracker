#!/usr/bin/env node

// Shared CSV utilities for precompute scripts and reconcile.js.
// Ported from inline functions in reconcile.js.

const fs = require("fs");

function parseCSVLine(line) {
  const out = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
      continue;
    }
    if (ch === "," && !inQuotes) { out.push(current.trim()); current = ""; continue; }
    current += ch;
  }
  out.push(current.trim());
  return out;
}

function readLines(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, "utf-8").trim();
  if (!content) return [];
  return content.split("\n").slice(1).filter(Boolean);
}

function csvQuote(value) {
  if (!value) return "";
  const escaped = value.replace(/"/g, '""');
  return /[",\n]/.test(value) ? `"${escaped}"` : value;
}

function readCSV(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, "utf-8").trim();
  if (!content) return [];
  const lines = content.split("\n").filter(Boolean);
  if (lines.length < 2) return [];
  const headers = parseCSVLine(lines[0]);
  return lines.slice(1).map((line) => {
    const fields = parseCSVLine(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = fields[i] || ""; });
    return obj;
  });
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function dateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function daysSince(dateA, dateB) {
  const a = new Date(dateA + "T00:00:00");
  const b = new Date(dateB + "T00:00:00");
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

// Compute streaks for a list of habits from signal rows.
// Returns { habit: { current, best, last_date, last_value, days_since_positive,
//   days_since_miss, breaks: [{ was, broke_on }] } }
function computeStreaks(signals, habitList) {
  const today = todayStr();
  const result = {};

  for (const habit of habitList) {
    const rows = signals
      .filter(r => r.signal === habit && (r.value === "0" || r.value === "1"))
      .sort((a, b) => b.date.localeCompare(a.date));

    if (rows.length === 0) {
      result[habit] = { current: 0, best: 0, last_date: null, last_value: null,
        days_since_positive: null, days_since_miss: null, breaks: [] };
      continue;
    }

    const last = rows[0];

    // Current streak: consecutive same-value from most recent, allowing 1-day gaps
    let current = 0;
    const currentVal = last.value;
    let prev = today;
    for (const r of rows) {
      if (r.value !== currentVal) break;
      const gap = daysSince(r.date, prev);
      if (gap > 2) break;
      current++;
      prev = r.date;
    }

    // Best streak (value=1 only): scan all rows
    let best = 0;
    let run = 0;
    let runPrev = null;
    const chronological = [...rows].reverse();
    for (const r of chronological) {
      if (r.value === "1") {
        if (runPrev === null || daysSince(runPrev, r.date) <= 2) {
          run++;
        } else {
          run = 1;
        }
        runPrev = r.date;
        if (run > best) best = run;
      } else {
        run = 0;
        runPrev = null;
      }
    }

    // Days since last positive/miss
    const lastPositive = rows.find(r => r.value === "1");
    const lastMiss = rows.find(r => r.value === "0");
    const daysSincePositive = lastPositive ? daysSince(lastPositive.date, today) : null;
    const daysSinceMiss = lastMiss ? daysSince(lastMiss.date, today) : null;

    // Streak breaks in last 14 days: where value went from 1→0
    const breaks = [];
    for (let i = 0; i < rows.length - 1; i++) {
      if (rows[i].value === "0" && daysSince(rows[i].date, today) <= 14) {
        // Count the streak that preceded this break
        let was = 0;
        let p = rows[i].date;
        for (let j = i + 1; j < rows.length; j++) {
          if (rows[j].value !== "1") break;
          const g = daysSince(rows[j].date, p);
          if (g > 2) break;
          was++;
          p = rows[j].date;
        }
        if (was >= 2) {
          breaks.push({ was, broke_on: rows[i].date });
        }
      }
    }

    result[habit] = {
      current: currentVal === "1" ? current : 0,
      current_negative: currentVal === "0" ? current : 0,
      best,
      last_date: last.date,
      last_value: last.value,
      days_since_positive: daysSincePositive,
      days_since_miss: daysSinceMiss,
      breaks,
    };
  }

  return result;
}

// Pivot signals into { date: { signal: { value, context } } } for a date window.
// Returns { window: { start, end, days }, dates: { ... }, signals_seen: [...] }
function pivotSignalsByDate(signals, days) {
  const today = todayStr();
  const start = new Date();
  start.setDate(start.getDate() - (days - 1));
  const startStr = dateStr(start);

  const dates = {};
  const signalsSeen = new Set();

  for (const r of signals) {
    if (r.date < startStr || r.date > today) continue;
    if (!dates[r.date]) dates[r.date] = {};
    dates[r.date][r.signal] = { value: r.value, context: r.context || "", unit: r.unit || "" };
    signalsSeen.add(r.signal);
  }

  return {
    window: { start: startStr, end: today, days },
    dates,
    signals_seen: [...signalsSeen].sort(),
  };
}

module.exports = {
  parseCSVLine,
  readLines,
  csvQuote,
  readCSV,
  todayStr,
  dateStr,
  daysSince,
  computeStreaks,
  pivotSignalsByDate,
};
