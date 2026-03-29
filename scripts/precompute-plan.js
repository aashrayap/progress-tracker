#!/usr/bin/env node

// Pre-compute plan data for today's-plan and set-tomorrow agents.
// Outputs JSON with { display, digest } sections.
// Reads: plan.csv, daily_signals.csv, todos.csv

const path = require("path");
const { readCSV, todayStr, dateStr, daysSince } = require("./csv-utils");
const { SIGNAL_TO_PLAN_KEYWORD } = require("./config");

const DATA_ROOT = path.join(__dirname, "..", "data");
const today = todayStr();

function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dateStr(d);
}

function tomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return dateStr(d);
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

function extractContext(row) {
  if (row.unit && row.unit.startsWith("context: ")) return row.unit.slice(9);
  if (row.context && row.context !== "chat" && row.context !== "") return row.context;
  if (row.unit && row.unit !== "") return row.unit;
  return row.value || "";
}

function getRollCount(notes) {
  const m = (notes || "").match(/\[rolled:(\d+)\]/);
  return m ? parseInt(m[1], 0) : 0;
}

// ── Read data ────────────────────────────────────────────────────

const plans = readCSV(path.join(DATA_ROOT, "plan.csv"));
const signals = readCSV(path.join(DATA_ROOT, "daily_signals.csv"));
const todos = readCSV(path.join(DATA_ROOT, "todos.csv"));

// ── Today's blocks ───────────────────────────────────────────────

function buildTodayBlocks() {
  const todayRows = plans.filter(r => r.date === today);
  const scheduled = [];
  const drafts = [];

  for (const row of todayRows) {
    const start = parseFloat(row.start);
    const end = parseFloat(row.end);
    if (start === 0 && end === 0) {
      drafts.push({ item: row.item, domain: row.domain || "", done: row.done === "1" });
    } else {
      scheduled.push({
        time: start === end ? decimalToTime(start) : `${decimalToTime(start)}–${decimalToTime(end)}`,
        item: row.item,
        domain: row.domain || "",
        done: row.done === "1",
        start,
        end,
      });
    }
  }

  scheduled.sort((a, b) => a.start - b.start);
  return { scheduled, drafts };
}

// ── Rollover (yesterday's undone) ────────────────────────────────

function buildRollover() {
  const yesterday = yesterdayStr();
  return plans
    .filter(r => r.date === yesterday && r.done !== "1")
    .map(r => ({
      item: r.item,
      domain: r.domain || "",
      roll_count: getRollCount(r.notes),
    }));
}

// ── Tomorrow's blocks ────────────────────────────────────────────

function buildTomorrowBlocks() {
  const tomorrow = tomorrowStr();
  const tomorrowRows = plans.filter(r => r.date === tomorrow);
  const scheduled = [];
  const drafts = [];

  for (const row of tomorrowRows) {
    const start = parseFloat(row.start);
    const end = parseFloat(row.end);
    if (start === 0 && end === 0) {
      drafts.push({ item: row.item, domain: row.domain || "" });
    } else {
      scheduled.push({
        time: start === end ? decimalToTime(start) : `${decimalToTime(start)}–${decimalToTime(end)}`,
        item: row.item,
        domain: row.domain || "",
        _start: start,
      });
    }
  }

  scheduled.sort((a, b) => a._start - b._start);
  return { scheduled, drafts, date: tomorrow };
}

// ── Stale todos ──────────────────────────────────────────────────

function buildStaleTodos() {
  return todos
    .filter(r => r.done !== "1" && r.created && daysSince(r.created, today) >= 7)
    .map(r => ({
      id: r.id,
      item: r.item,
      domain: r.domain || "",
      age_days: daysSince(r.created, today),
    }))
    .sort((a, b) => b.age_days - a.age_days)
    .slice(0, 5);
}

// ── Context (goals, intentions) ──────────────────────────────────

function buildContext() {
  const weeklyGoals = [];
  for (const s of signals) {
    if (s.signal === "weekly_goal" && daysSince(s.date, today) <= 7 && daysSince(s.date, today) >= 0) {
      weeklyGoals.push({ goal: extractContext(s), domain: s.category || s.value || "" });
    }
  }

  const weeklyIntentionRows = signals
    .filter(s => s.signal === "weekly_intention" && daysSince(s.date, today) <= 7 && daysSince(s.date, today) >= 0)
    .sort((a, b) => b.date.localeCompare(a.date));
  const weeklyIntention = weeklyIntentionRows.length > 0 ? extractContext(weeklyIntentionRows[0]) : null;

  const dailyIntentionRow = signals.find(s => s.date === today && s.signal === "intention");
  const dailyIntention = dailyIntentionRow ? extractContext(dailyIntentionRow) : null;

  return { weekly_goals: weeklyGoals, weekly_intention: weeklyIntention, daily_intention: dailyIntention };
}

// ── Display card ─────────────────────────────────────────────────

function buildDisplayCard() {
  const { scheduled, drafts } = buildTodayBlocks();
  const rollover = buildRollover();
  const staleTodos = buildStaleTodos();
  const ctx = buildContext();

  const W = 56;
  const pad = (s, w) => s + " ".repeat(Math.max(0, w - s.length));
  const lines = [];

  lines.push("┌─ TODAY'S PLAN ────────────────────────────────────────────┐");

  // Scheduled blocks
  if (scheduled.length > 0) {
    for (const b of scheduled) {
      const mark = b.done ? "✓" : "·";
      const timeCol = b.time.padEnd(16);
      const maxItem = W - 16 - 4;
      const item = b.item.length > maxItem ? b.item.substring(0, maxItem - 1) + "…" : b.item;
      lines.push(`│  ${mark} ${timeCol}${pad(item, W - 16 - 4)}  │`);
    }
  } else {
    lines.push(`│  No blocks scheduled.${" ".repeat(W - 22)}│`);
  }

  // Drafts
  if (drafts.length > 0) {
    lines.push(`│${" ".repeat(W + 2)}│`);
    lines.push(`│  DRAFTS (unscheduled)${" ".repeat(W - 21)}│`);
    for (const d of drafts) {
      const mark = d.done ? "✓" : "–";
      const maxItem = W - 6;
      const item = d.item.length > maxItem ? d.item.substring(0, maxItem - 1) + "…" : d.item;
      lines.push(`│  ${mark} ${pad(item, W - 2)}│`);
    }
  }

  // Rollover
  if (rollover.length > 0) {
    lines.push(`│${" ".repeat(W + 2)}│`);
    lines.push(`│  ROLLOVER (yesterday, undone)${" ".repeat(W - 29)}│`);
    for (const r of rollover) {
      const tag = r.roll_count >= 2 ? ` [${r.roll_count}x]` : "";
      const maxItem = W - 6 - tag.length;
      const item = r.item.length > maxItem ? r.item.substring(0, maxItem - 1) + "…" : r.item;
      lines.push(`│  → ${pad(item + tag, W - 2)}│`);
    }
  }

  // Stale todos (top 3 for display)
  const displayStale = staleTodos.slice(0, 3);
  if (displayStale.length > 0) {
    lines.push(`│${" ".repeat(W + 2)}│`);
    const label = `STALE TODOS (${staleTodos.length} open, 7+ days)`;
    lines.push(`│  ${pad(label, W)}│`);
    for (const t of displayStale) {
      const age = `${t.age_days}d`;
      const maxItem = W - 8 - age.length;
      const item = t.item.length > maxItem ? t.item.substring(0, maxItem - 1) + "…" : t.item;
      lines.push(`│  · ${pad(item, W - 4 - age.length)}${age}  │`);
    }
  }

  // Context footer
  lines.push(`│${" ".repeat(W + 2)}│`);
  if (ctx.weekly_intention) {
    const wk = `Week: "${ctx.weekly_intention}"`;
    lines.push(`│  ${pad(wk, W)}│`);
  }
  if (ctx.daily_intention) {
    const dy = `Today: "${ctx.daily_intention}"`;
    lines.push(`│  ${pad(dy, W)}│`);
  }

  lines.push("└──────────────────────────────────────────────────────────┘");

  return lines.join("\n");
}

// ── Tomorrow display card ────────────────────────────────────────

function buildTomorrowCard() {
  const { scheduled, drafts, date } = buildTomorrowBlocks();
  const d = new Date(date + "T12:00:00");
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayLabel = days[d.getDay()];

  const W = 56;
  const pad = (s, w) => s + " ".repeat(Math.max(0, w - s.length));
  const lines = [];

  lines.push(`┌─ TOMORROW (${dayLabel} ${date}) ${"─".repeat(Math.max(0, W - 18 - date.length))}┐`);

  if (scheduled.length === 0 && drafts.length === 0) {
    lines.push(`│  Nothing planned yet.${" ".repeat(W - 21)}│`);
  } else {
    for (const b of scheduled) {
      const timeCol = b.time.padEnd(16);
      const maxItem = W - 16 - 2;
      const item = b.item.length > maxItem ? b.item.substring(0, maxItem - 1) + "…" : b.item;
      lines.push(`│  ${timeCol}${pad(item, W - 16)}│`);
    }
    if (drafts.length > 0) {
      if (scheduled.length > 0) lines.push(`│${" ".repeat(W + 2)}│`);
      lines.push(`│  Drafts:${" ".repeat(W - 8)}│`);
      for (const d of drafts) {
        const maxItem = W - 6;
        const item = d.item.length > maxItem ? d.item.substring(0, maxItem - 1) + "…" : d.item;
        lines.push(`│  – ${pad(item, W - 2)}│`);
      }
    }
  }

  lines.push(`└${"─".repeat(W + 2)}┘`);
  return lines.join("\n");
}

// ── Output ───────────────────────────────────────────────────────

try {
  const output = {
    display: {
      today_card: buildDisplayCard(),
      tomorrow_card: buildTomorrowCard(),
    },
    digest: {
      today: buildTodayBlocks(),
      rollover: buildRollover(),
      tomorrow: buildTomorrowBlocks(),
      stale_todos: buildStaleTodos(),
      context: buildContext(),
      signal_map: { ...SIGNAL_TO_PLAN_KEYWORD },
    },
  };
  process.stdout.write(JSON.stringify(output, null, 2) + "\n");
} catch (err) {
  process.stderr.write(`precompute-plan error: ${err.message}\n`);
  process.exit(1);
}
