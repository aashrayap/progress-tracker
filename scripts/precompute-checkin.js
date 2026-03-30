#!/usr/bin/env node

// Pre-compute checkin display cards and digest data.
// Outputs JSON to stdout with { display: { card1, card2 }, digest: { ... } }.
// Reads: daily_signals.csv, plan.csv, todos.csv, reflections.csv

const path = require("path");
const { readCSV, todayStr } = require("./csv-utils");
const { HABIT_LIST, ADDICTION_SIGNALS, LIFESTYLE_SIGNALS } = require("./config");

const DATA_ROOT = path.join(__dirname, "..", "data");
const today = todayStr();

// Compute yesterday's date string
function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
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

// Format date for card header: "Sat Mar 7"
function formatCardDate(ds) {
  const d = new Date(ds + "T12:00:00");
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${days[d.getDay()]} ${months[d.getMonth()]} ${d.getDate()}`;
}

// Day-of-week program mapping (replaces old A-G rotation)
const DOW_TO_PROGRAM_KEY = { 0: null, 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: null };
const NEXT_DAY_MAP = { Mon: "Tue", Tue: "Wed", Wed: "Thu", Thu: "Fri", Fri: "Mon" };

// Label map for display
const HABIT_LABELS = {
  gym: "Gym", sleep: "Sleep", meditate: "Meditate",
  deep_work: "Deep work", ate_clean: "Ate clean",
  weed: "Weed", lol: "League", poker: "Poker", clarity: "Clarity",
  morning_review: "AM review", midday_review: "Mid review",
  evening_review: "PM review", wim_hof_am: "Wim Hof AM",
  wim_hof_pm: "Wim Hof PM",
};

// ── Read data ──────────────────────────────────────────────────────

const signals = readCSV(path.join(DATA_ROOT, "daily_signals.csv"));
const plans = readCSV(path.join(DATA_ROOT, "plan.csv"));
const todos = readCSV(path.join(DATA_ROOT, "todos.csv"));
const reflections = readCSV(path.join(DATA_ROOT, "reflections.csv"));

const yesterday = yesterdayStr();

// ── Build signal lookups ───────────────────────────────────────────

function getSignalsForDate(date) {
  const map = {};
  for (const row of signals) {
    if (row.date === date) {
      map[row.signal] = row;
    }
  }
  return map;
}

const todaySignals = getSignalsForDate(today);
const yesterdaySignals = getSignalsForDate(yesterday);

// ── Card 1: Habits ─────────────────────────────────────────────────

function buildCard1() {
  // Yesterday side: sleep first (logged on yesterday = night before yesterday), then rest
  const yesterdayLines = [];
  let yesterdayAllLogged = true;

  // Sleep for yesterday (the night before yesterday)
  const yesterdaySleep = yesterdaySignals["sleep"];
  if (!yesterdaySleep) {
    yesterdayAllLogged = false;
    yesterdayLines.push("· Sleep");
  } else if (yesterdaySleep.value === "1") {
    yesterdayLines.push("✓ Sleep");
  } else {
    yesterdayLines.push("✗ Sleep");
  }

  const yesterdayHabits = HABIT_LIST.filter(h => h !== "sleep");
  for (const habit of yesterdayHabits) {
    const sig = yesterdaySignals[habit];
    const label = HABIT_LABELS[habit];
    if (!sig) {
      yesterdayAllLogged = false;
      yesterdayLines.push(`· ${label}`);
    } else if (sig.value === "1") {
      // For gym, show workout day if available
      let extra = "";
      if (habit === "gym" && sig.context) {
        const dayMatch = sig.context.match(/Day\s*([A-G])/i);
        if (dayMatch) extra = ` (Day ${dayMatch[1].toUpperCase()})`;
      }
      if (ADDICTION_SIGNALS.includes(habit)) {
        yesterdayLines.push(`✓ ${label}`);
      } else {
        yesterdayLines.push(`✓ ${label}${extra}`);
      }
    } else {
      // value=0 means missed/relapsed
      if (ADDICTION_SIGNALS.includes(habit)) {
        yesterdayLines.push(`✗ ${label} (relapse)`);
      } else {
        yesterdayLines.push(`✗ ${label}`);
      }
    }
  }

  if (yesterdayAllLogged && yesterdayLines.length > 0) {
    yesterdayLines.push("All logged.");
  } else {
    const openCount = yesterdayHabits.filter(h => !yesterdaySignals[h]).length + (yesterdaySleep ? 0 : 1);
    if (openCount > 0) yesterdayLines.push(`${openCount} open.`);
  }

  // Today side: sleep first, then all habits + feeling/intention
  const todayLines = [];
  let todayOpenCount = 0;

  // Sleep is always today
  const sleepSig = todaySignals["sleep"];
  if (sleepSig) {
    todayLines.push(sleepSig.value === "1" ? "✓ Sleep" : "✗ Sleep");
  } else {
    todayLines.push("· Sleep");
    todayOpenCount++;
  }

  // Feeling
  const feelingSig = todaySignals["feeling"];
  if (feelingSig) {
    todayLines.push(`Feel: ${feelingSig.value}`);
  }

  // Intention
  const intentionSig = todaySignals["intention"];
  if (intentionSig && intentionSig.context) {
    const ctx = intentionSig.context.length > 30 ? intentionSig.context.substring(0, 27) + "..." : intentionSig.context;
    todayLines.push(`Intent: ${ctx}`);
  }

  // Rest of habits for today (except sleep)
  const todayHabits = HABIT_LIST.filter(h => h !== "sleep");
  for (const habit of todayHabits) {
    const sig = todaySignals[habit];
    const label = HABIT_LABELS[habit];
    if (!sig) {
      todayLines.push(`· ${label}`);
      todayOpenCount++;
    } else if (sig.value === "1") {
      if (ADDICTION_SIGNALS.includes(habit)) {
        todayLines.push(`✓ ${label}`);
      } else {
        let extra = "";
        if (habit === "gym" && sig.context) {
          const dayMatch = sig.context.match(/Day\s*([A-G])/i);
          if (dayMatch) extra = ` (Day ${dayMatch[1].toUpperCase()})`;
        }
        todayLines.push(`✓ ${label}${extra}`);
      }
    } else {
      if (ADDICTION_SIGNALS.includes(habit)) {
        todayLines.push(`✗ ${label} (relapse)`);
      } else {
        todayLines.push(`✗ ${label}`);
      }
    }
  }

  todayLines.push(`${todayOpenCount} open.`);

  // Build side-by-side card
  const headerDate = formatCardDate(today);
  const leftHeader = "YESTERDAY";
  const rightHeader = "TODAY";
  const leftWidth = 20;
  const rightWidth = 18;

  function pad(s, w) { return s + " ".repeat(Math.max(0, w - s.length)); }

  const maxLines = Math.max(yesterdayLines.length, todayLines.length);
  const rows = [];
  for (let i = 0; i < maxLines; i++) {
    const left = i < yesterdayLines.length ? yesterdayLines[i] : "";
    const right = i < todayLines.length ? todayLines[i] : "";
    rows.push(`│ ${pad(left, leftWidth)}│ ${pad(right, rightWidth)}│`);
  }

  const topBorder = `┌─ ${headerDate} ${"─".repeat(Math.max(0, leftWidth + rightWidth + 4 - headerDate.length - 3))}┐`;
  const headerRow = `│ ${pad(leftHeader, leftWidth)}│ ${pad(rightHeader, rightWidth)}│`;
  const bottomBorder = `└${"─".repeat(leftWidth + 2)}┴${"─".repeat(rightWidth + 2)}┘`;

  return [topBorder, headerRow, ...rows, bottomBorder].join("\n");
}

// ── Card 2: Actions ────────────────────────────────────────────────

function buildCard2() {
  const sections = [];

  // Todos: open count + oldest
  const openTodos = todos.filter(r => r.done !== "1");
  if (openTodos.length > 0) {
    let oldestAge = 0;
    let oldestItem = "";
    for (const t of openTodos) {
      const age = daysSince(t.created, today);
      if (age > oldestAge) { oldestAge = age; oldestItem = t.item; }
    }
    const oldestName = oldestItem.length > 20 ? oldestItem.substring(0, 17) + "..." : oldestItem;
    const line = `${openTodos.length} open (oldest: ${oldestName}, ${oldestAge}d)`;
    sections.push(`│ Todos        ${line}${" ".repeat(Math.max(0, 53 - line.length - 15))}│`);
  }

  // Reflection: yesterday status
  const yesterdayReflection = reflections.filter(r => r.date === yesterday);
  if (yesterdayReflection.length > 0) {
    const line = "yesterday — done";
    sections.push(`│ Reflection   ${line}${" ".repeat(Math.max(0, 53 - line.length - 15))}│`);
  } else {
    const line = "yesterday — missing";
    sections.push(`│ Reflection   ${line}${" ".repeat(Math.max(0, 53 - line.length - 15))}│`);
  }

  // Plan: today's status
  const todayPlan = plans.filter(r => r.date === today);
  if (todayPlan.length > 0) {
    const done = todayPlan.filter(r => r.done === "1").length;
    const line = `${todayPlan.length} blocks today (${done} done)`;
    sections.push(`│ Plan         ${line}${" ".repeat(Math.max(0, 53 - line.length - 15))}│`);
  } else {
    const line = "nothing scheduled today";
    sections.push(`│ Plan         ${line}${" ".repeat(Math.max(0, 53 - line.length - 15))}│`);
  }

  // Last gym + next workout day
  const gymSignals = signals.filter(r => r.signal === "gym" && r.value === "1").sort((a, b) => a.date.localeCompare(b.date));
  if (gymSignals.length > 0) {
    const lastGym = gymSignals[gymSignals.length - 1];
    const lastDate = new Date(lastGym.date + "T12:00:00");
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const lastDayName = dayNames[lastDate.getDay()];
    const lastDay = DOW_TO_PROGRAM_KEY[lastDate.getDay()] ?? null;
    const nextDay = lastDay ? (NEXT_DAY_MAP[lastDay] ?? null) : null;
    let line;
    if (lastDay && nextDay) {
      line = `${lastDay} (${lastDayName}) → next: ${nextDay}`;
    } else {
      line = `${lastDayName} ${lastGym.date}`;
    }
    sections.push(`│ Last gym     ${line}${" ".repeat(Math.max(0, 53 - line.length - 15))}│`);
  }

  const topBorder = "┌─ On Your Plate ──────────────────────────────────────┐";
  const bottomBorder = "└──────────────────────────────────────────────────────┘";

  return [topBorder, ...sections, bottomBorder].join("\n");
}

// ── Helpers ────────────────────────────────────────────────────────

// Extract context text from a signal row. Some signals store context text
// in the `unit` field (prefixed with "context: "), others in `context`.
function extractContext(row) {
  if (row.unit && row.unit.startsWith("context: ")) return row.unit.slice(9);
  if (row.context && row.context !== "chat" && row.context !== "") return row.context;
  if (row.unit && row.unit !== "") return row.unit;
  return row.value || "";
}

// ── Digest ─────────────────────────────────────────────────────────

function buildDigest() {
  // Mood arc: last 7 days of feeling/energy signals
  const moodArc = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = dateStr(d);
    const daySignals = signals.filter(r => r.date === ds);
    const mood = daySignals.find(r => r.signal === "feeling");
    const energy = daySignals.find(r => r.signal === "energy");
    if (mood || energy) {
      moodArc.push({
        date: ds,
        mood: mood ? mood.value : "",
        energy: energy ? energy.value : "",
      });
    }
  }

  // Habit misses: habits not logged for today
  const habitMisses = HABIT_LIST.filter(h => !todaySignals[h]);

  // Streak breaks: check for habits that had consecutive 1s then got a 0
  const streakBreaks = [];
  for (const habit of HABIT_LIST) {
    // Find last occurrence where value=0
    const lastMiss = [...signals].reverse().find(r => r.signal === habit && r.value === "0");
    if (lastMiss) {
      // Count streak before the miss
      const beforeMiss = signals.filter(r => r.signal === habit && r.value === "1" && r.date < lastMiss.date);
      if (beforeMiss.length > 0) {
        // Count consecutive 1s ending at last date before the miss
        let streak = 0;
        const sorted = beforeMiss.sort((a, b) => b.date.localeCompare(a.date));
        let prev = lastMiss.date;
        for (const s of sorted) {
          const gap = daysSince(s.date, prev);
          if (gap <= 2) { streak++; prev = s.date; }
          else break;
        }
        if (streak >= 3 && daysSince(lastMiss.date, today) <= 7) {
          streakBreaks.push({ habit, streak_was: streak, broken: lastMiss.date });
        }
      }
    }
  }

  // Stale todos: open todos older than 7 days
  const staleTodos = [];
  for (const t of todos.filter(r => r.done !== "1")) {
    const age = daysSince(t.created, today);
    if (age >= 7) {
      staleTodos.push({ id: t.id, item: t.item.substring(0, 60), age_days: age });
    }
  }

  // Weekly goals: current week's weekly_goal signals
  const weeklyGoals = [];
  for (const s of signals) {
    if (s.signal === "weekly_goal" && daysSince(s.date, today) <= 7) {
      weeklyGoals.push({ goal: extractContext(s), progress: "" });
    }
  }

  // Weekly intention
  const weeklyIntention = signals.filter(s => s.signal === "weekly_intention" && daysSince(s.date, today) <= 7)
    .sort((a, b) => b.date.localeCompare(a.date));
  const weeklyIntentionText = weeklyIntention.length > 0 ? extractContext(weeklyIntention[0]) : null;

  // Daily intention
  const dailyIntentionSig = todaySignals["intention"];
  const dailyIntention = dailyIntentionSig ? extractContext(dailyIntentionSig) : null;

  // Rollover items: yesterday's incomplete plan items
  const rolloverItems = [];
  const yesterdayPlan = plans.filter(r => r.date === yesterday && r.done !== "1");
  for (const p of yesterdayPlan) {
    const rollMatch = p.notes ? p.notes.match(/\[rolled:(\d+)\]/) : null;
    const rollCount = rollMatch ? parseInt(rollMatch[1]) : 0;
    rolloverItems.push({ item: p.item, roll_count: rollCount });
  }

  // Recent reflections (last 14 days)
  const recentReflections = [];
  for (const r of reflections) {
    if (daysSince(r.date, today) <= 14) {
      recentReflections.push({ date: r.date, domain: r.domain, lesson: (r.lesson || "").substring(0, 80) });
    }
  }

  // Last workout
  const gymSignals = signals.filter(r => r.signal === "gym" && r.value === "1").sort((a, b) => a.date.localeCompare(b.date));
  let lastWorkout = null;
  if (gymSignals.length > 0) {
    const last = gymSignals[gymSignals.length - 1];
    const lastDate = new Date(last.date + "T12:00:00");
    const lastDay = DOW_TO_PROGRAM_KEY[lastDate.getDay()] ?? null;
    const nextDay = lastDay ? (NEXT_DAY_MAP[lastDay] ?? null) : null;
    lastWorkout = { date: last.date, day: lastDay, next: nextDay ? `Day ${nextDay}` : null };
  }

  return {
    mood_arc: moodArc,
    habit_misses: habitMisses,
    streak_breaks: streakBreaks,
    stale_todos: staleTodos,
    weekly_goals: weeklyGoals,
    weekly_intention: weeklyIntentionText,
    daily_intention: dailyIntention,
    rollover_items: rolloverItems,
    recent_reflections: recentReflections,
    last_workout: lastWorkout,
  };
}

// ── Output ─────────────────────────────────────────────────────────

try {
  const output = {
    display: {
      card1: buildCard1(),
      card2: buildCard2(),
    },
    digest: buildDigest(),
  };
  process.stdout.write(JSON.stringify(output, null, 2) + "\n");
} catch (err) {
  process.stderr.write(`precompute-checkin error: ${err.message}\n`);
  // Output valid JSON even on error
  process.stdout.write(JSON.stringify({
    display: { card1: "", card2: "" },
    digest: {
      mood_arc: [], habit_misses: [], streak_breaks: [],
      stale_todos: [], weekly_goals: [], weekly_intention: null,
      daily_intention: null, rollover_items: [], recent_reflections: [],
      last_workout: null,
    },
  }) + "\n");
  process.exit(1);
}
