#!/usr/bin/env node

// Pre-compute brain state data for the brain-state agent.
// Outputs JSON to stdout: streaks, habit grid, vice/positive load, sleep pattern,
// recovery windows, dopamine balance.
// Reads: data/daily_signals.csv

const path = require("path");
const { readCSV, todayStr, dateStr, daysSince, computeStreaks, pivotSignalsByDate } = require("./csv-utils");
const { HABIT_LIST, ADDICTION_SIGNALS, LIFESTYLE_SIGNALS } = require("./config");

const DATA_ROOT = path.join(__dirname, "..", "data");
const today = todayStr();

const signals = readCSV(path.join(DATA_ROOT, "daily_signals.csv"));

// ── Core computations ─────────────────────────────────────────────

const streaks = computeStreaks(signals, HABIT_LIST);
const pivot = pivotSignalsByDate(signals, 14);

// ── Habit grid (14-day binary) ────────────────────────────────────

function buildHabitGrid(pivot) {
  const dates = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(dateStr(d));
  }

  const habits = {};
  for (const habit of HABIT_LIST) {
    habits[habit] = dates.map(date => {
      const day = pivot.dates[date];
      if (!day || !day[habit]) return null; // not logged
      return day[habit].value === "1" ? 1 : 0;
    });
  }

  return { dates: dates.map(d => d.slice(5)), habits };
}

// ── Vice load per day ─────────────────────────────────────────────

function computeViceLoad(pivot) {
  const VICES = [...ADDICTION_SIGNALS, "clarity"];
  const byDay = {};
  const dates = Object.keys(pivot.dates).sort();

  for (const date of dates) {
    const day = pivot.dates[date];
    let count = 0;
    for (const v of VICES) {
      if (day[v] && day[v].value === "0") count++; // 0 = relapsed
    }
    byDay[date] = count;
  }

  const last7 = dates.slice(-7);
  const avg7d = last7.length > 0
    ? last7.reduce((sum, d) => sum + (byDay[d] || 0), 0) / last7.length
    : 0;

  const prev7 = dates.slice(-14, -7);
  const avgPrev7 = prev7.length > 0
    ? prev7.reduce((sum, d) => sum + (byDay[d] || 0), 0) / prev7.length
    : 0;

  const trend = avg7d < avgPrev7 - 0.3 ? "declining" : avg7d > avgPrev7 + 0.3 ? "increasing" : "stable";

  return { by_day: byDay, avg_7d: Math.round(avg7d * 100) / 100, trend };
}

// ── Positive inputs per day ───────────────────────────────────────

function computePositiveInputs(pivot) {
  const POSITIVES = ["gym", "meditate", "deep_work"];
  const byDay = {};
  const dates = Object.keys(pivot.dates).sort();

  for (const date of dates) {
    const day = pivot.dates[date];
    let count = 0;
    for (const p of POSITIVES) {
      if (day[p] && day[p].value === "1") count++;
    }
    byDay[date] = count;
  }

  const last7 = dates.slice(-7);
  const avg7d = last7.length > 0
    ? last7.reduce((sum, d) => sum + (byDay[d] || 0), 0) / last7.length
    : 0;

  const prev7 = dates.slice(-14, -7);
  const avgPrev7 = prev7.length > 0
    ? prev7.reduce((sum, d) => sum + (byDay[d] || 0), 0) / prev7.length
    : 0;

  const trend = avg7d > avgPrev7 + 0.3 ? "improving" : avg7d < avgPrev7 - 0.3 ? "declining" : "flat";

  return { by_day: byDay, avg_7d: Math.round(avg7d * 100) / 100, trend };
}

// ── Sleep pattern ─────────────────────────────────────────────────

function computeSleepPattern(pivot) {
  const dates = Object.keys(pivot.dates).sort().slice(-14);
  let onTime = 0;
  let total = 0;
  let currentConsecutive = 0;
  let bestRun = 0;
  let run = 0;

  for (const date of dates) {
    const day = pivot.dates[date];
    if (day && day.sleep) {
      total++;
      if (day.sleep.value === "1") {
        onTime++;
        run++;
        if (run > bestRun) bestRun = run;
      } else {
        run = 0;
      }
    } else {
      run = 0;
    }
  }

  // Current consecutive from most recent
  const reversed = [...dates].reverse();
  currentConsecutive = 0;
  for (const date of reversed) {
    const day = pivot.dates[date];
    if (day && day.sleep && day.sleep.value === "1") {
      currentConsecutive++;
    } else {
      break;
    }
  }

  return {
    on_time_ratio_7d: total > 0 ? Math.round((onTime / total) * 100) / 100 : 0,
    current_consecutive_good: currentConsecutive,
    best_run_14d: bestRun,
  };
}

// ── Recovery windows (clean runs of 2+ days) ─────────────────────

function findRecoveryWindows(pivot) {
  const dates = Object.keys(pivot.dates).sort();
  const windows = [];
  let windowStart = null;
  let cleanSignals = new Set();

  for (let i = 0; i < dates.length; i++) {
    const date = dates[i];
    const day = pivot.dates[date];

    // A "clean" day: sleep on time + no vices active
    const sleepOk = day.sleep && day.sleep.value === "1";
    const noVices = ADDICTION_SIGNALS.every(v => !day[v] || day[v].value === "1");
    const clarityOk = !day.clarity || day.clarity.value === "1";

    if (sleepOk && noVices && clarityOk) {
      if (!windowStart) windowStart = date;
      if (day.gym && day.gym.value === "1") cleanSignals.add("gym");
      if (day.meditate && day.meditate.value === "1") cleanSignals.add("meditate");
      if (day.deep_work && day.deep_work.value === "1") cleanSignals.add("deep_work");
      if (sleepOk) cleanSignals.add("sleep");
    } else {
      if (windowStart) {
        const days = daysSince(windowStart, dates[i - 1]) + 1;
        if (days >= 2) {
          windows.push({ start: windowStart, end: dates[i - 1], days, clean_signals: [...cleanSignals] });
        }
      }
      windowStart = null;
      cleanSignals = new Set();
    }
  }

  // Close open window
  if (windowStart) {
    const days = daysSince(windowStart, dates[dates.length - 1]) + 1;
    if (days >= 2) {
      windows.push({ start: windowStart, end: dates[dates.length - 1], days, clean_signals: [...cleanSignals] });
    }
  }

  return windows;
}

// ── Dopamine balance ──────────────────────────────────────────────

function computeDopamineBalance(viceLoad, positiveInputs) {
  const net = positiveInputs.avg_7d - viceLoad.avg_7d;
  let interpretation;
  if (net >= 1) interpretation = "surplus";
  else if (net >= 0) interpretation = "balanced";
  else if (net >= -1) interpretation = "mild_deficit";
  else interpretation = "deficit";

  return { net_7d: Math.round(net * 100) / 100, interpretation };
}

// ── Feelings/mind entries (last 7 days) ───────────────────────────

function recentFeelings(signals) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  const cutoffStr = dateStr(cutoff);

  return signals
    .filter(r => r.date >= cutoffStr && (r.signal === "feeling" || r.signal === "mind"))
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(r => ({ date: r.date, signal: r.signal, value: r.value, context: r.context || "" }));
}

// ── Output ────────────────────────────────────────────────────────

try {
  const habitGrid = buildHabitGrid(pivot);
  const viceLoad = computeViceLoad(pivot);
  const positiveInputs = computePositiveInputs(pivot);
  const sleepPattern = computeSleepPattern(pivot);
  const recoveryWindows = findRecoveryWindows(pivot);
  const dopamineBalance = computeDopamineBalance(viceLoad, positiveInputs);
  const feelings = recentFeelings(signals);

  const output = {
    generated: new Date().toISOString(),
    today,
    streaks,
    habit_grid: habitGrid,
    vice_load: viceLoad,
    positive_inputs: positiveInputs,
    sleep_pattern: sleepPattern,
    recovery_windows: recoveryWindows,
    dopamine_balance: dopamineBalance,
    recent_feelings: feelings,
  };

  process.stdout.write(JSON.stringify(output, null, 2) + "\n");
} catch (err) {
  process.stderr.write(`compute-brain-state error: ${err.message}\n`);
  process.stdout.write(JSON.stringify({ error: err.message }) + "\n");
  process.exit(1);
}
