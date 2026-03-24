import { NextResponse } from "next/server";
import { todayStr as todayLocal, daysAgoStr } from "../../lib/utils";
import {
  getCurrentIntentions,
  readBriefing,
  readDailySignals,
  readExperiments,
  getDaysSince,
  getHabitsForDate,
  getStreak,
  getTodaysPlan,
  readPlan,
  readQuotes,
  readReflections,
  readTodos,
  readWorkouts,
  type DailySignalEntry,
  type ExperimentEntry,
  type WorkoutSetEntry,
} from "../../lib/csv";
import { config, HABIT_CONFIG } from "../../lib/config";
import { computeInsightResponse } from "../../lib/insight";
import { getWeekStartStr } from "../../lib/date-utils";

function getNowWindow(): "morning" | "day" | "evening" {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour >= 20) return "evening";
  return "day";
}

function getMonthStartDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

function computeCheckinStatus(signals: DailySignalEntry[], today: string) {
  const weekStart = getWeekStartStr();
  const monthStart = getMonthStartDate();

  const dailyDone = signals.some(
    (s) => s.date === today && s.signal === "checkin_daily" && s.value === "1"
  );

  const weeklyDone = signals.some(
    (s) => s.date >= weekStart && s.signal === "checkin_weekly" && s.value === "1"
  );
  const lastWeekly = signals
    .filter((s) => s.signal === "checkin_weekly" && s.value === "1")
    .sort((a, b) => b.date.localeCompare(a.date))[0]?.date || null;

  const monthlyDone = signals.some(
    (s) => s.date >= monthStart && s.signal === "checkin_monthly" && s.value === "1"
  );
  const lastMonthly = signals
    .filter((s) => s.signal === "checkin_monthly" && s.value === "1")
    .sort((a, b) => b.date.localeCompare(a.date))[0]?.date || null;

  // Daily streak: count consecutive days with checkin_daily going backwards from yesterday
  const dailyCheckins = new Set(
    signals
      .filter((s) => s.signal === "checkin_daily" && s.value === "1")
      .map((s) => s.date)
  );
  let dailyStreak = 0;
  for (let i = 1; i <= 90; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (dailyCheckins.has(ds)) dailyStreak++;
    else break;
  }

  return {
    daily: { done: dailyDone, streak: dailyStreak },
    weekly: { done: weeklyDone, lastDate: lastWeekly },
    monthly: { done: monthlyDone, lastDate: lastMonthly },
  };
}

function getBool(
  entries: DailySignalEntry[],
  signal: string
): boolean | null {
  const row = entries.findLast((e) => e.signal === signal);
  if (!row) return null;
  return row.value === "1";
}

// Compact reflections: group by domain, prioritize change > lesson > win, max 5 bullets
function buildReflectionsSummary(
  reflections: { date: string; domain: string; win: string; lesson: string; change: string; archived?: string }[]
): { domain: string; insight: string }[] {
  const sevenDaysAgo = daysAgoStr(7);
  const recent = reflections.filter((r) => r.date >= sevenDaysAgo && r.archived !== "1");

  const bullets: { domain: string; insight: string; priority: number }[] = [];
  for (const r of recent) {
    if (r.change.trim()) {
      bullets.push({ domain: r.domain, insight: r.change.trim(), priority: 0 });
    } else if (r.lesson.trim()) {
      bullets.push({ domain: r.domain, insight: r.lesson.trim(), priority: 1 });
    } else if (r.win.trim()) {
      bullets.push({ domain: r.domain, insight: r.win.trim(), priority: 2 });
    }
  }

  bullets.sort((a, b) => a.priority - b.priority);

  const seen = new Set<string>();
  const result: { domain: string; insight: string }[] = [];
  for (const b of bullets) {
    if (seen.has(b.domain)) continue;
    seen.add(b.domain);
    result.push({ domain: b.domain, insight: b.insight });
    if (result.length >= 5) break;
  }

  return result;
}

interface HabitLogEntry {
  date: string;
  value: boolean | null;
  context: string;
  workoutSummary?: string;
}

function buildHabitLogs(
  signals: DailySignalEntry[],
  workoutSets: WorkoutSetEntry[],
  ninetyDayDates: string[]
): Record<string, HabitLogEntry[]> {
  const habitSignals = Object.keys(HABIT_CONFIG);
  const allExercises = Object.values(config.exercises).flat();

  // Pre-index workout sets by date for gym summaries
  const workoutsByDate: Record<string, WorkoutSetEntry[]> = {};
  for (const ws of workoutSets) {
    if (!workoutsByDate[ws.date]) workoutsByDate[ws.date] = [];
    workoutsByDate[ws.date].push(ws);
  }

  // Pre-index signals by date+signal
  const signalIndex: Record<string, DailySignalEntry> = {};
  for (const s of signals) {
    if (habitSignals.includes(s.signal)) {
      signalIndex[`${s.date}:${s.signal}`] = s;
    }
  }

  const result: Record<string, HabitLogEntry[]> = {};

  for (const key of habitSignals) {
    const entries: HabitLogEntry[] = [];
    for (const date of ninetyDayDates) {
      const sig = signalIndex[`${date}:${key}`];
      if (!sig) continue; // omit days with no log

      const entry: HabitLogEntry = {
        date,
        value: sig.value === "1" ? true : sig.value === "0" ? false : null,
        context: sig.context || "",
      };

      // For gym, add compact workout summary
      if (key === "gym" && sig.value === "1") {
        const daySets = workoutsByDate[date];
        if (daySets && daySets.length > 0) {
          const byExercise: Record<string, WorkoutSetEntry[]> = {};
          for (const s of daySets) {
            if (!byExercise[s.exercise]) byExercise[s.exercise] = [];
            byExercise[s.exercise].push(s);
          }
          const parts: string[] = [];
          for (const [exId, sets] of Object.entries(byExercise)) {
            const best = sets.reduce((b, s) => {
              if (s.weight > b.weight) return s;
              if (s.weight === b.weight && s.reps > b.reps) return s;
              return b;
            }, sets[0]);
            const def = allExercises.find((e) => e.id === exId);
            const name = def?.name || exId;
            if (best.weight > 0) {
              parts.push(`${name} ${best.weight}x${best.reps}`);
            } else if (best.reps > 0) {
              parts.push(`${name} x${best.reps}`);
            } else {
              parts.push(name);
            }
          }
          entry.workoutSummary = parts.join(", ");
        }
      }

      entries.push(entry);
    }
    // Most recent first
    entries.reverse();
    result[key] = entries;
  }

  return result;
}

export async function GET() {
  try {
    const signals = readDailySignals();
    const plan = readPlan();
    const reflections = readReflections();
    const todos = readTodos();
    const todaysPlan = getTodaysPlan(plan);
    const yesterday = daysAgoStr(1);
    const yesterdaysPlan = plan
      .filter((p) => p.date === yesterday)
      .sort((a, b) => a.start - b.start);

    const dayNumber = getDaysSince(config.dopamineReset.startDate) + 1;
    const dopamineDates = [
      ...new Set(
        signals
          .filter((e) => ["lol", "weed", "poker", "clarity", "gym", "sleep", "meditate", "deep_work", "ate_clean", "morning_review", "midday_review", "evening_review", "wim_hof_am", "wim_hof_pm"].includes(e.signal))
          .map((e) => e.date)
      ),
    ].sort();

    const dopamineLog = dopamineDates.map((date) => {
      const dayEntries = signals.filter((e) => e.date === date);
      const get = (m: string): boolean | null => {
        const entry = dayEntries.findLast((e) => e.signal === m);
        if (!entry) return null;
        return entry.value === "1";
      };
      return {
        date,
        weed: get("weed"),
        lol: get("lol"),
        poker: get("poker"),
        gym: get("gym"),
        sleep: get("sleep"),
        meditate: get("meditate"),
        deepWork: get("deep_work"),
        ateClean: get("ate_clean"),
        clarity: get("clarity"),
        morningReview: get("morning_review"),
        middayReview: get("midday_review"),
        eveningReview: get("evening_review"),
        wimHofAm: get("wim_hof_am"),
        wimHofPm: get("wim_hof_pm"),
      };
    });

    const todayStr = todayLocal();

    const yesterdayChanges = reflections
      .filter((r) => r.date === yesterday && r.change.trim())
      .map((r) => ({ domain: r.domain, change: r.change }));

    const insight = computeInsightResponse(
      signals.map((s) => ({
        date: s.date,
        metric: s.signal,
        value: s.value,
        notes: s.context || "",
      })),
      todaysPlan
    );

    const checkinStatus = computeCheckinStatus(signals, todayStr);
    const intentions = getCurrentIntentions();

    const todayEntries = signals.filter((e) => e.date === todayStr);
    const sleepToday = getBool(todayEntries, "sleep");
    const latestPriorSleep = signals
      .filter((e) => e.signal === "sleep" && e.date < todayStr)
      .sort((a, b) => b.date.localeCompare(a.date))[0];
    const sleepFallback = latestPriorSleep ? latestPriorSleep.value === "1" : null;
    const todayHabits = {
      weed: getBool(todayEntries, "weed"),
      lol: getBool(todayEntries, "lol"),
      poker: getBool(todayEntries, "poker"),
      gym: getBool(todayEntries, "gym"),
      sleep: sleepToday ?? sleepFallback,
      meditate: getBool(todayEntries, "meditate"),
      deepWork: getBool(todayEntries, "deep_work"),
      ateClean: getBool(todayEntries, "ate_clean"),
    };

    // 90-day habit tracker: always start on a Monday, show through today
    const todayDow = new Date(todayLocal() + "T12:00:00").getDay(); // 0=Sun, from local date
    const daysBack = 89 + ((todayDow + 6) % 7); // extend back to nearest Monday, 90+ days
    const habitDates = Array.from({ length: daysBack + 1 }, (_, i) => daysAgoStr(daysBack - i));
    const habitTracker = {
      dates: habitDates,
      days: habitDates.map((date) => getHabitsForDate(signals, date)),
    };

    const workoutSets = readWorkouts();
    const habitTrendDates = Array.from({ length: 90 }, (_, i) => daysAgoStr(89 - i));
    const habitKeys = Object.keys(HABIT_CONFIG);
    const habitTrends = habitKeys.reduce<Record<string, { date: string; value: boolean | null }[]>>(
      (acc, key) => {
        acc[key] = habitTrendDates.map((date) => {
          const habitsForDate = getHabitsForDate(signals, date);
          const value = key in habitsForDate ? habitsForDate[key] : null;
          return { date, value };
        });
        return acc;
      },
      {}
    );

    const habitLogs = buildHabitLogs(signals, workoutSets, habitTrendDates);

    // Compact reflections for Hub
    const reflectionsSummary = buildReflectionsSummary(reflections);

    // Open todos peek
    const openTodos = todos
      .filter((t) => !t.done)
      .sort((a, b) => b.created.localeCompare(a.created))
      .slice(0, 3)
      .map((t) => ({ id: t.id, item: t.item }));
    const openTodosCount = todos.filter((t) => !t.done).length;

    // Briefing card data (from pipeline-generated briefing.json)
    const briefing = readBriefing();

    // Fallback quote if no briefing: match mantra domain, fall back to any quote
    const allQuotes = readQuotes();
    let dailyQuote: { text: string; author: string; source: string } | null = null;
    if (!briefing && allQuotes.length > 0) {
      const mantraDomain = intentions.dailyIntention?.domain || intentions.weeklyIntention?.domain || "";
      const domainQuotes = mantraDomain ? allQuotes.filter((q) => q.domain === mantraDomain) : [];
      const pool = domainQuotes.length > 0 ? domainQuotes : allQuotes;
      const daysSinceEpoch = Math.floor(Date.now() / 86400000);
      const pick = pool[daysSinceEpoch % pool.length];
      dailyQuote = { text: pick.text, author: pick.author, source: pick.source };
    }

    // Experiments: split into current (active) and past (concluded)
    const allExperiments = readExperiments();
    const todayMs = new Date(todayStr).getTime();
    const experimentsCurrent = allExperiments
      .filter((e) => e.status === "active")
      .map((e) => {
        const startMs = new Date(e.startDate).getTime();
        const dayCount = Math.floor((todayMs - startMs) / 86400000) + 1;
        const isExpired = dayCount > e.durationDays;
        return {
          name: e.name,
          dayCount,
          durationDays: e.durationDays,
          domain: e.domain,
          isExpired,
        };
      })
      .sort((a, b) => {
        if (a.isExpired !== b.isExpired) return a.isExpired ? -1 : 1;
        return b.dayCount - a.dayCount;
      });
    const experimentsPast = allExperiments
      .filter((e) => e.status === "concluded")
      .sort((a, b) => b.startDate.localeCompare(a.startDate))
      .slice(0, 10)
      .map((e) => ({
        name: e.name,
        verdict: e.verdict,
        reflection: e.reflection,
        startDate: e.startDate,
      }));

    return NextResponse.json({
      briefing,
      checkinStatus,
      dailyIntention: intentions.dailyIntention,
      weeklyIntention: intentions.weeklyIntention,
      nowWindow: getNowWindow(),
      dopamineReset: {
        startDate: config.dopamineReset.startDate,
        dayNumber,
        days: config.dopamineReset.days,
        log: dopamineLog,
        streaks: {
          lol: getStreak(signals, "lol"),
          weed: getStreak(signals, "weed"),
          poker: getStreak(signals, "poker"),
          clarity: getStreak(signals, "clarity"),
        },
      },
      todaysPlan: todaysPlan.map((p) => ({
        date: p.date,
        start: p.start,
        end: p.end,
        item: p.item,
        done: p.done,
        notes: p.notes || "",
      })),
      yesterdaysPlan: yesterdaysPlan.map((p) => ({
        start: p.start,
        end: p.end,
        item: p.item,
        done: p.done,
        notes: p.notes || "",
      })),
      yesterdayChanges,
      insight,
      todayHabits,
      habitTracker,
      habitTrends,
      habitLogs,
      reflectionsSummary,
      openTodos,
      openTodosCount,
      dailyQuote,
      experiments: {
        current: experimentsCurrent,
        past: experimentsPast,
      },
    });
  } catch (e) {
    console.error("GET /api/hub error:", e);
    return NextResponse.json({ error: "Failed to load hub data" }, { status: 500 });
  }
}
