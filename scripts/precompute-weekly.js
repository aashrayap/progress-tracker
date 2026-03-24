#!/usr/bin/env node

// Pre-compute weekly score card and digest data for weekly review.
// Outputs JSON to stdout with `display` (formatted text) and `digest` (structured data).

const path = require("path");
const { readCSV, todayStr } = require("./csv-utils");
const { HABIT_LIST, ADDICTION_SIGNALS, LIFESTYLE_SIGNALS, DOMAINS } = require("./config");

const DATA_ROOT = path.join(__dirname, "..", "data");
const SIGNALS_PATH = path.join(DATA_ROOT, "daily_signals.csv");
const REFLECTIONS_PATH = path.join(DATA_ROOT, "reflections.csv");
const TODOS_PATH = path.join(DATA_ROOT, "todos.csv");
const FEEDBACK_PATH = path.join(DATA_ROOT, "briefing_feedback.csv");
const PLAN_PATH = path.join(DATA_ROOT, "plan.csv");

// Habit-to-domain mapping (from SKILL.md)
const HABIT_DOMAIN = {
  gym: "health",
  ate_clean: "health",
  sleep: "health",
  deep_work: "career",
  meditate: "personal_growth",
  weed: "personal_growth",
  lol: "personal_growth",
  poker: "personal_growth",
  clarity: "personal_growth",
};

// --- Date helpers ---

function parseDate(str) {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function dateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function dayName(d) {
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
}

function monthDay(d) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

// Get Monday..Sunday week range ending on or before `refDate`
// If refDate is Sunday, that's the end. Otherwise, find most recent Sunday.
function getWeekRange(refDate) {
  const ref = new Date(refDate);
  const dayOfWeek = ref.getDay(); // 0=Sun
  // End of week = most recent Sunday (or today if Sunday)
  const end = new Date(ref);
  if (dayOfWeek !== 0) {
    end.setDate(end.getDate() - dayOfWeek);
  }
  const start = new Date(end);
  start.setDate(start.getDate() - 6); // Monday
  return { start, end };
}

// --- Data loading ---

function loadSignals() {
  try { return readCSV(SIGNALS_PATH); } catch (e) { process.stderr.write(`warn: ${e.message}\n`); return []; }
}

function loadReflections() {
  try { return readCSV(REFLECTIONS_PATH); } catch (e) { return []; }
}

function loadTodos() {
  try { return readCSV(TODOS_PATH); } catch (e) { return []; }
}

function loadFeedback() {
  try { return readCSV(FEEDBACK_PATH); } catch (e) { return []; }
}

function loadPlan() {
  try { return readCSV(PLAN_PATH); } catch (e) { return []; }
}

// --- Score computation ---
// Weed is gatekeeper: if weed=0, day score=0
// 5 habit points: gym, sleep, meditate, deep_work, ate_clean (+1 each if value=1)
// 3 vice adjustments: lol, poker, clarity (+1 if clean/value=1, -1 if relapse/value=0)
// Wim Hof: 0.5 per round (AM + PM), max 1 point
// Protocol reviews: 0 points (tracked but not scored)
// Daily score = max(0, habit_sum + wim_hof + vice_adjustments), range 0-9

function computeDayScore(daySignals) {
  const lookup = {};
  for (const s of daySignals) {
    if (HABIT_LIST.includes(s.signal)) {
      lookup[s.signal] = s.value;
    }
  }

  // Gatekeeper: weed must be 1 (clean)
  if (lookup.weed === "0") return 0;

  let score = 0;
  // 5 habit points
  for (const h of ["gym", "sleep", "meditate", "deep_work", "ate_clean"]) {
    if (lookup[h] === "1") score++;
  }
  // Wim Hof: 0.5 per round
  if (lookup.wim_hof_am === "1") score += 0.5;
  if (lookup.wim_hof_pm === "1") score += 0.5;
  // 3 vice adjustments
  for (const v of ["lol", "poker", "clarity"]) {
    if (lookup[v] === "1") score++;
    else if (lookup[v] === "0") score--;
  }

  return Math.max(0, Math.min(9, score));
}

function getHabitCount(signals, dateRange, habit) {
  let count = 0;
  const start = dateStr(dateRange.start);
  const end = dateStr(dateRange.end);
  for (const s of signals) {
    if (s.signal === habit && s.date >= start && s.date <= end && s.value === "1") {
      count++;
    }
  }
  return count;
}

function getDatesInRange(range) {
  const dates = [];
  const d = new Date(range.start);
  while (d <= range.end) {
    dates.push(dateStr(d));
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

function computeStreak(signals, habit, refDate) {
  // Get all dates with this habit logged as value=1, sorted desc
  const cleanDates = new Set();
  const loggedDates = new Set();
  for (const s of signals) {
    if (s.signal === habit) {
      loggedDates.add(s.date);
      if (s.value === "1") cleanDates.add(s.date);
    }
  }

  let streak = 0;
  const d = new Date(refDate);
  while (true) {
    const ds = dateStr(d);
    if (cleanDates.has(ds)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else if (loggedDates.has(ds)) {
      // Logged but not clean — streak broken
      break;
    } else {
      // Not logged — stop counting
      break;
    }
  }
  return streak;
}

function findStreakBreak(signals, habit, dateRange) {
  const dates = getDatesInRange(dateRange);
  for (let i = dates.length - 1; i >= 0; i--) {
    const d = dates[i];
    const logged = signals.find((s) => s.signal === habit && s.date === d);
    if (logged && logged.value === "0") {
      return d;
    }
  }
  return null;
}

// --- Bar chart helpers ---

function bar(score, max) {
  const filled = Math.round((score / max) * 8);
  return "█".repeat(filled) + "░".repeat(8 - filled);
}

function trend(thisVal, lastVal) {
  if (thisVal > lastVal) return "↑";
  if (thisVal < lastVal) return "↓";
  return "━";
}

// --- Main ---

function main() {
  const today = parseDate(todayStr());
  const thisWeek = getWeekRange(today);
  const lastWeekEnd = new Date(thisWeek.start);
  lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
  const lastWeek = getWeekRange(lastWeekEnd);

  const signals = loadSignals();
  const reflections = loadReflections();
  const todos = loadTodos();
  const feedback = loadFeedback();
  const plan = loadPlan();

  const thisWeekDates = getDatesInRange(thisWeek);
  const lastWeekDates = getDatesInRange(lastWeek);

  // Group signals by date
  const signalsByDate = {};
  for (const s of signals) {
    if (!signalsByDate[s.date]) signalsByDate[s.date] = [];
    signalsByDate[s.date].push(s);
  }

  // --- Compute daily scores ---
  const thisWeekScores = thisWeekDates.map((d) => ({
    date: d,
    day: dayName(parseDate(d)),
    score: computeDayScore(signalsByDate[d] || []),
  }));

  const lastWeekScores = lastWeekDates.map((d) => ({
    date: d,
    day: dayName(parseDate(d)),
    score: computeDayScore(signalsByDate[d] || []),
  }));

  const thisTotal = thisWeekScores.reduce((sum, d) => sum + d.score, 0);
  const lastTotal = lastWeekScores.reduce((sum, d) => sum + d.score, 0);
  const maxTotal = 56;
  const thisPct = Math.round((thisTotal / maxTotal) * 100);
  const lastPct = Math.round((lastTotal / maxTotal) * 100);

  const bestDay = thisWeekScores.reduce((best, d) => (d.score > best.score ? d : best), thisWeekScores[0]);
  const worstDay = thisWeekScores.reduce((worst, d) => (d.score < worst.score ? d : worst), thisWeekScores[0]);

  // --- Habit detail ---
  const habitDetail = HABIT_LIST.map((h) => {
    const thisCount = getHabitCount(signals, thisWeek, h);
    const lastCount = getHabitCount(signals, lastWeek, h);
    return { habit: h, thisWeek: thisCount, lastWeek: lastCount };
  });

  // --- Streaks (addiction signals) ---
  const streakSignals = ADDICTION_SIGNALS;
  const streaks = streakSignals.map((h) => {
    const currentStreak = computeStreak(signals, h, today);
    const lastWeekStreak = computeStreak(signals, h, lastWeek.end);
    const brokeDate = findStreakBreak(signals, h, thisWeek);
    return { habit: h, current: currentStreak, lastWeek: lastWeekStreak, broke: brokeDate };
  });

  // --- Execution stats ---
  const thisWeekStart = dateStr(thisWeek.start);
  const thisWeekEnd = dateStr(thisWeek.end);

  const weekPlan = plan.filter((p) => p.date >= thisWeekStart && p.date <= thisWeekEnd);
  const planDone = weekPlan.filter((p) => p.done === "1").length;
  const planTotal = weekPlan.length;

  const todosOpen = todos.filter((t) => t.done !== "1").length;
  const todosDone = todos.filter((t) => t.done === "1").length;

  const weekInbox = signals.filter(
    (s) => s.date >= thisWeekStart && s.date <= thisWeekEnd &&
      (s.signal === "inbox_processed" || s.source === "voice")
  );

  const checkinDays = thisWeekDates.filter((d) =>
    signals.some((s) => s.date === d && s.signal === "checkin_daily" && s.value === "1")
  );
  const missedCheckins = thisWeekDates.filter((d) =>
    !signals.some((s) => s.date === d && s.signal === "checkin_daily" && s.value === "1")
  );

  // --- Briefing feedback ---
  const weekFeedback = feedback.filter((f) => f.date >= thisWeekStart && f.date <= thisWeekEnd);
  const feedbackGood = weekFeedback.filter((f) => f.rating === "good").length;
  const feedbackBad = weekFeedback.filter((f) => f.rating === "bad").length;

  // --- Format score card ---
  const weekLabel = `${monthDay(thisWeek.start)} to ${monthDay(thisWeek.end)}`;

  let card = "";
  card += `WEEK IN REVIEW — ${weekLabel}\n`;
  card += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

  card += "HABIT SCORE\n";
  card += `  Total:    ${thisTotal}/${maxTotal} (${thisPct}%)\n`;
  card += `  Trend:    ${trend(thisTotal, lastTotal)} from ${lastTotal}/${maxTotal} last week (${lastPct}%)\n`;
  card += `  Best day: ${bestDay.day} ${bestDay.score}/8\n`;
  card += `  Worst day: ${worstDay.day} ${worstDay.score}/8\n\n`;

  card += "DAILY BREAKDOWN\n";
  card += "  This Week              Last Week\n";
  for (let i = 0; i < 7; i++) {
    const tw = thisWeekScores[i] || { day: "???", score: 0 };
    const lw = lastWeekScores[i] || { day: "???", score: 0 };
    card += `  ${tw.day}  ${bar(tw.score, 8)}  ${tw.score}/8     ${lw.day}  ${bar(lw.score, 8)}  ${lw.score}/8\n`;
  }
  card += "\n";

  // Habit names for display
  const habitNames = {
    gym: "Gym", sleep: "Sleep", ate_clean: "Ate clean", deep_work: "Deep work",
    meditate: "Meditate", weed: "Weed", lol: "League", poker: "Poker", clarity: "Clarity",
  };

  card += "HABIT DETAIL\n";
  card += "  This Week              Last Week\n";
  for (const h of habitDetail) {
    const name = (habitNames[h.habit] || h.habit).padEnd(12);
    const t = trend(h.thisWeek, h.lastWeek);
    const warn = ADDICTION_SIGNALS.includes(h.habit) && h.thisWeek < 7 ? " ⚠" : "";
    const check = ADDICTION_SIGNALS.includes(h.habit) && h.thisWeek === 7 ? " ✓" : "";
    const lastCheck = ADDICTION_SIGNALS.includes(h.habit) && h.lastWeek === 7 ? " ✓" : "";
    card += `  ${name}${h.thisWeek}/7  ${t}${warn}     ${name}${h.lastWeek}/7${lastCheck}\n`;
  }
  card += "\n";

  card += "STREAKS\n";
  card += "  Now                    Last Week\n";
  for (const s of streaks) {
    const name = (habitNames[s.habit] || s.habit);
    const brokeNote = s.broke ? ` (broke ${dayName(parseDate(s.broke))})` : "";
    card += `  ${name} ${s.current}d${brokeNote}`.padEnd(25) + `${name} ${s.lastWeek}d\n`;
  }
  card += "\n";

  card += "EXECUTION\n";
  const planPct = planTotal > 0 ? Math.round((planDone / planTotal) * 100) : 0;
  card += `  Plan: ${planDone}/${planTotal} blocks (${planPct}%)`;
  card += ` · Todos: ${todosOpen} open, ${todosDone} done`;
  card += `\n  Check-ins: ${checkinDays.length}/7 daily`;
  if (missedCheckins.length > 0 && missedCheckins.length <= 3) {
    const missed = missedCheckins.map((d) => dayName(parseDate(d)));
    card += ` — missed ${missed.join(", ")}`;
  }
  card += "\n";

  if (weekFeedback.length > 0) {
    card += `\nBRIEFING FEEDBACK\n`;
    card += `  ${feedbackGood} good, ${feedbackBad} bad\n`;
    const texts = weekFeedback.filter((f) => f.feedback_text).map((f) => f.feedback_text);
    if (texts.length > 0) {
      card += `  → ${texts[texts.length - 1]}\n`;
    }
  }

  // --- Digest: mood arc ---
  const moodArc = [];
  for (const d of thisWeekDates) {
    const daySignals = signalsByDate[d] || [];
    const feeling = daySignals.find((s) => s.signal === "feeling");
    const energy = daySignals.find((s) => s.signal === "energy");
    const mood = daySignals.find((s) => s.signal === "mood");
    if (feeling || energy || mood) {
      moodArc.push({
        date: d,
        mood: mood ? mood.value : (feeling ? feeling.value : ""),
        energy: energy ? energy.value : "",
        feeling: feeling ? feeling.value : "",
        context: feeling ? (feeling.context || "") : "",
      });
    }
  }

  // --- Digest: triggers ---
  const triggers = [];
  for (const d of thisWeekDates) {
    const daySignals = signalsByDate[d] || [];
    for (const s of daySignals) {
      if (s.signal === "mind") {
        triggers.push({
          date: d,
          signal: s.signal,
          value: s.value || "",
          context: s.context || "",
        });
      }
    }
  }

  // --- Digest: habit_by_domain ---
  const habitByDomain = {};
  for (const domain of DOMAINS) {
    const domainHabits = Object.entries(HABIT_DOMAIN)
      .filter(([, dom]) => dom === domain)
      .map(([h]) => h);
    if (domainHabits.length === 0) continue;

    let thisWeekTotal = 0;
    let lastWeekTotal = 0;
    for (const h of domainHabits) {
      thisWeekTotal += getHabitCount(signals, thisWeek, h);
      lastWeekTotal += getHabitCount(signals, lastWeek, h);
    }
    habitByDomain[domain] = {
      this_week: thisWeekTotal,
      last_week: lastWeekTotal,
      max: domainHabits.length * 7,
      habits: domainHabits,
    };
  }

  // --- Digest: domain spotlight candidates ---
  const spotlightCandidates = [];

  for (const [domain, data] of Object.entries(habitByDomain)) {
    const delta = data.this_week - data.last_week;
    if (delta < 0) {
      spotlightCandidates.push({
        domain,
        reason: "biggest_decline",
        delta: `${delta}`,
        this_week: data.this_week,
        last_week: data.last_week,
      });
    }
    if (delta > 0) {
      spotlightCandidates.push({
        domain,
        reason: "biggest_improvement",
        delta: `+${delta}`,
        this_week: data.this_week,
        last_week: data.last_week,
      });
    }
  }

  // Check for stalled domains (need 3+ weeks of data)
  const twoWeeksAgoEnd = new Date(lastWeek.start);
  twoWeeksAgoEnd.setDate(twoWeeksAgoEnd.getDate() - 1);
  const twoWeeksAgo = getWeekRange(twoWeeksAgoEnd);

  for (const [domain, data] of Object.entries(habitByDomain)) {
    let twoWeeksAgoTotal = 0;
    const domainHabits = data.habits;
    for (const h of domainHabits) {
      twoWeeksAgoTotal += getHabitCount(signals, twoWeeksAgo, h);
    }
    if (data.this_week === data.last_week && data.last_week === twoWeeksAgoTotal) {
      spotlightCandidates.push({
        domain,
        reason: "stalled",
        delta: "0",
        this_week: data.this_week,
        last_week: data.last_week,
        weeks_flat: 3,
      });
    }
  }

  // Check for vision-misaligned (low score domains)
  for (const [domain, data] of Object.entries(habitByDomain)) {
    const pct = data.max > 0 ? data.this_week / data.max : 0;
    if (pct < 0.5) {
      spotlightCandidates.push({
        domain,
        reason: "vision_misaligned",
        delta: `${Math.round(pct * 100)}%`,
        this_week: data.this_week,
        last_week: data.last_week,
      });
    }
  }

  // Sort: biggest absolute delta first, then stalled, then vision_misaligned
  const priorityOrder = { biggest_decline: 0, biggest_improvement: 1, stalled: 2, vision_misaligned: 3 };
  spotlightCandidates.sort((a, b) => {
    const pa = priorityOrder[a.reason] ?? 4;
    const pb = priorityOrder[b.reason] ?? 4;
    if (pa !== pb) return pa - pb;
    return Math.abs(parseInt(b.delta) || 0) - Math.abs(parseInt(a.delta) || 0);
  });

  // Top 3 unique domains
  const seenDomains = new Set();
  const topCandidates = [];
  for (const c of spotlightCandidates) {
    if (seenDomains.has(c.domain)) continue;
    seenDomains.add(c.domain);
    topCandidates.push(c);
    if (topCandidates.length >= 3) break;
  }

  // --- Digest: experiment_last_week ---
  const lastWeekStart = dateStr(lastWeek.start);
  const lastWeekEnd2 = dateStr(lastWeek.end);
  const experimentSignal = signals.find(
    (s) => s.signal === "weekly_experiment" && s.date >= lastWeekStart && s.date <= lastWeekEnd2
  );
  const experimentLastWeek = experimentSignal ? (experimentSignal.context || experimentSignal.value || null) : null;

  // --- Digest: goals_last_week ---
  const goalsLastWeek = signals
    .filter((s) => s.signal === "weekly_goal" && s.date >= lastWeekStart && s.date <= lastWeekEnd2)
    .map((s) => ({ goal: s.context || s.value, domain: s.category || s.value }));

  // --- Digest: stale todos ---
  const todayDate = parseDate(todayStr());
  const staleTodos = todos
    .filter((t) => t.done !== "1" && t.created)
    .map((t) => {
      const created = parseDate(t.created);
      const ageDays = Math.floor((todayDate - created) / (1000 * 60 * 60 * 24));
      return { id: t.id, item: t.item, age_days: ageDays };
    })
    .filter((t) => t.age_days >= 7)
    .sort((a, b) => b.age_days - a.age_days);

  // --- Output ---
  const output = {
    display: {
      score_card: card,
    },
    digest: {
      mood_arc: moodArc,
      triggers,
      habit_by_domain: habitByDomain,
      domain_spotlight_candidates: topCandidates,
      experiment_last_week: experimentLastWeek,
      goals_last_week: goalsLastWeek,
      stale_todos: staleTodos,
      briefing_feedback: { good: feedbackGood, bad: feedbackBad },
    },
  };

  process.stdout.write(JSON.stringify(output, null, 2) + "\n");
}

main();
