import { NextResponse } from "next/server";
import { readLog, readPlan, getTodaysPlan, LogEntry } from "../../lib/csv";
import { config } from "../../lib/config";

// ─── Types ───

interface StreakInfo {
  current: number;
  best: number;
}

interface WeightInsight {
  current: number | null;
  weekAgo: number | null;
  twoWeeksAgo: number | null;
  trend: "up" | "down" | "stable" | "unknown";
  onTrack: boolean;
  monthTarget: number | null;
  monthLabel: string | null;
}

interface HabitSummary {
  last7days: Record<string, number>;
  bestHabit: string | null;
  worstHabit: string | null;
}

interface Pattern {
  type: "warning" | "positive" | "correlation" | "streak" | "dayofweek";
  message: string;
  priority: number; // higher = show first
}

interface InsightResponse {
  date: string;
  streaks: Record<string, StreakInfo>;
  weight: WeightInsight;
  habits: HabitSummary;
  patterns: Pattern[];
  todaysPlan: { itemCount: number; doneCount: number };
  resetDay: number;
}

// ─── Helpers ───

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

function getDayOfWeek(dateStr: string): string {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", { weekday: "long" });
}

function buildDayMap(log: LogEntry[]): Map<string, Map<string, string>> {
  const map = new Map<string, Map<string, string>>();
  for (const e of log) {
    if (!map.has(e.date)) map.set(e.date, new Map());
    map.get(e.date)!.set(e.metric, e.value);
  }
  return map;
}

// ─── Streak Calculator ───

function computeStreaks(log: LogEntry[], metric: string): StreakInfo {
  const entries = log
    .filter((e) => e.metric === metric)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (entries.length === 0) return { current: 0, best: 0 };

  let current = 0;
  let best = 0;
  let streak = 0;

  for (const e of entries) {
    if (e.value === "1") {
      streak++;
      if (streak > best) best = streak;
    } else {
      streak = 0;
    }
  }
  current = streak;

  return { current, best };
}

// ─── Weight Insight ───

function computeWeight(log: LogEntry[]): WeightInsight {
  const weights = log
    .filter((e) => e.metric === "weight")
    .map((e) => ({ date: e.date, value: parseFloat(e.value) }))
    .sort((a, b) => a.date.localeCompare(b.date));

  if (weights.length === 0) {
    return { current: null, weekAgo: null, twoWeeksAgo: null, trend: "unknown", onTrack: false, monthTarget: null, monthLabel: null };
  }

  const currentEntry = weights[weights.length - 1];
  const current = currentEntry.value;

  const weekAgoDate = daysAgo(7);
  const twoWeeksAgoDate = daysAgo(14);

  const findClosest = (targetDate: string): number | null => {
    const before = weights.filter((w) => w.date <= targetDate);
    return before.length > 0 ? before[before.length - 1].value : null;
  };

  const weekAgo = findClosest(weekAgoDate);
  const twoWeeksAgo = findClosest(twoWeeksAgoDate);

  let trend: "up" | "down" | "stable" | "unknown" = "unknown";
  if (weekAgo !== null) {
    const diff = current - weekAgo;
    if (diff > 1) trend = "up";
    else if (diff < -1) trend = "down";
    else trend = "stable";
  }

  const currentMonthName = new Date().toLocaleString("en-US", { month: "short" });
  const checkpoint = config.weight.checkpoints.find((c) => c.month === currentMonthName);
  const monthTarget = checkpoint?.target ?? null;
  const monthLabel = checkpoint?.month ?? null;
  const onTrack = monthTarget !== null ? current <= monthTarget : false;

  return { current, weekAgo, twoWeeksAgo, trend, onTrack, monthTarget, monthLabel };
}

// ─── Habit Summary (last 7 days) ───

function computeHabits(log: LogEntry[]): HabitSummary {
  const habitMetrics = ["gym", "sleep", "meditate", "deep_work", "ate_clean"];
  const sevenDaysAgo = daysAgo(7);
  const today = getToday();

  const recent = log.filter(
    (e) => habitMetrics.includes(e.metric) && e.date >= sevenDaysAgo && e.date <= today
  );

  const counts: Record<string, number> = {};
  for (const m of habitMetrics) {
    counts[m] = recent.filter((e) => e.metric === m && e.value === "1").length;
  }

  const sorted = [...habitMetrics].sort((a, b) => counts[b] - counts[a]);
  const bestHabit = sorted[0] && counts[sorted[0]] > 0 ? sorted[0] : null;
  const worstHabit = sorted[sorted.length - 1] ?? null;

  return { last7days: counts, bestHabit, worstHabit };
}

// ─── Pattern Detectors ───

function detectCascades(log: LogEntry[], dayMap: Map<string, Map<string, string>>): Pattern[] {
  const patterns: Pattern[] = [];
  const addictionMetrics = ["weed", "lol", "poker"];
  const habitMetrics = ["gym", "sleep", "meditate", "deep_work", "ate_clean"];

  // For each habit, check: when missed 2+ consecutive days, did relapse follow within 3 days?
  for (const habit of habitMetrics) {
    const dates = [...dayMap.keys()].sort();
    let missRun = 0;
    let relapseAfterMiss = 0;
    let totalMissStreaks = 0;

    for (let i = 0; i < dates.length; i++) {
      const dayData = dayMap.get(dates[i])!;
      const habitVal = dayData.get(habit);

      if (habitVal === "0") {
        missRun++;
      } else {
        if (missRun >= 2) {
          totalMissStreaks++;
          // Check next 3 days for relapse
          for (let j = i; j < Math.min(i + 3, dates.length); j++) {
            const futureDay = dayMap.get(dates[j]);
            if (futureDay) {
              for (const addiction of addictionMetrics) {
                if (futureDay.get(addiction) === "0") {
                  relapseAfterMiss++;
                  j = dates.length; // break outer
                  break;
                }
              }
            }
          }
        }
        missRun = 0;
      }
    }

    if (totalMissStreaks >= 2 && relapseAfterMiss > 0) {
      const rate = Math.round((relapseAfterMiss / totalMissStreaks) * 100);
      if (rate >= 50) {
        const habitLabel = habit.replace("_", " ");
        patterns.push({
          type: "warning",
          message: `Missing ${habitLabel} 2+ days led to relapse ${rate}% of the time (${relapseAfterMiss}/${totalMissStreaks})`,
          priority: 90,
        });
      }
    }
  }

  // Check trigger log for explicit cascade patterns
  const triggers = log.filter((e) => e.metric === "trigger");
  const cascadeKeywords = ["cascade", "→", "->", "led to"];
  const recentTriggers = triggers.filter((t) => t.date >= daysAgo(14));
  if (recentTriggers.length >= 2) {
    patterns.push({
      type: "warning",
      message: `${recentTriggers.length} trigger events in the last 14 days — high relapse pressure`,
      priority: 85,
    });
  }

  return patterns;
}

function detectCorrelations(dayMap: Map<string, Map<string, string>>): Pattern[] {
  const patterns: Pattern[] = [];
  const pairs: [string, string][] = [
    ["gym", "ate_clean"],
    ["sleep", "gym"],
    ["sleep", "meditate"],
    ["sleep", "deep_work"],
    ["meditate", "deep_work"],
    ["gym", "deep_work"],
  ];

  for (const [a, b] of pairs) {
    let aDays = 0, aAndB = 0;
    let noADays = 0, noAAndB = 0;

    for (const [, metrics] of dayMap) {
      const aVal = metrics.get(a);
      const bVal = metrics.get(b);
      if (aVal === undefined || bVal === undefined) continue;

      if (aVal === "1") {
        aDays++;
        if (bVal === "1") aAndB++;
      } else {
        noADays++;
        if (bVal === "1") noAAndB++;
      }
    }

    if (aDays >= 3) {
      const withRate = Math.round((aAndB / aDays) * 100);
      const withoutRate = noADays > 0 ? Math.round((noAAndB / noADays) * 100) : 0;

      if (withRate >= 60 && withRate - withoutRate >= 20) {
        const aLabel = a.replace("_", " ");
        const bLabel = b.replace("_", " ");
        patterns.push({
          type: "correlation",
          message: `On ${aLabel} days, you ${bLabel} ${withRate}% of the time (vs ${withoutRate}% without)`,
          priority: 50,
        });
      }
    }
  }

  return patterns;
}

function detectStreakPatterns(streaks: Record<string, StreakInfo>): Pattern[] {
  const patterns: Pattern[] = [];
  const addictionMetrics = ["weed", "lol", "poker"];

  // Highlight current streaks
  for (const metric of addictionMetrics) {
    const s = streaks[metric];
    if (!s) continue;
    if (s.current > 0 && s.current >= s.best) {
      const label = metric === "lol" ? "LoL" : metric;
      patterns.push({
        type: "positive",
        message: `${label}: ${s.current}-day streak — personal best!`,
        priority: 70,
      });
    } else if (s.current === 0 && s.best > 0) {
      const label = metric === "lol" ? "LoL" : metric;
      patterns.push({
        type: "warning",
        message: `${label}: streak broken. Previous best was ${s.best} days — restart today`,
        priority: 80,
      });
    }
  }

  return patterns;
}

function detectDayOfWeekPatterns(dayMap: Map<string, Map<string, string>>): Pattern[] {
  const patterns: Pattern[] = [];
  const addictionMetrics = ["weed", "lol", "poker"];
  const habitMetrics = ["gym", "sleep", "ate_clean"];

  // Count clean rate by day of week for addictions
  const dowCounts: Record<string, { total: number; clean: number }> = {};
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  for (const d of days) dowCounts[d] = { total: 0, clean: 0 };

  for (const [dateStr, metrics] of dayMap) {
    const dow = getDayOfWeek(dateStr);
    let hasAddictionData = false;
    let allClean = true;

    for (const m of addictionMetrics) {
      const v = metrics.get(m);
      if (v !== undefined) {
        hasAddictionData = true;
        if (v === "0") allClean = false;
      }
    }

    if (hasAddictionData) {
      dowCounts[dow].total++;
      if (allClean) dowCounts[dow].clean++;
    }
  }

  // Find worst day
  let worstDay = "";
  let worstRate = 100;
  for (const [day, c] of Object.entries(dowCounts)) {
    if (c.total >= 2) {
      const rate = Math.round((c.clean / c.total) * 100);
      if (rate < worstRate) {
        worstRate = rate;
        worstDay = day;
      }
    }
  }

  if (worstDay && worstRate <= 30) {
    patterns.push({
      type: "dayofweek",
      message: `${worstDay}s are your hardest day — ${worstRate}% clean rate`,
      priority: 55,
    });
  }

  // Find best gym day
  const gymDow: Record<string, { total: number; done: number }> = {};
  for (const d of days) gymDow[d] = { total: 0, done: 0 };

  for (const [dateStr, metrics] of dayMap) {
    const dow = getDayOfWeek(dateStr);
    const gymVal = metrics.get("gym");
    if (gymVal !== undefined) {
      gymDow[dow].total++;
      if (gymVal === "1") gymDow[dow].done++;
    }
  }

  let bestGymDay = "";
  let bestGymRate = 0;
  for (const [day, c] of Object.entries(gymDow)) {
    if (c.total >= 2) {
      const rate = Math.round((c.done / c.total) * 100);
      if (rate > bestGymRate) {
        bestGymRate = rate;
        bestGymDay = day;
      }
    }
  }

  if (bestGymDay && bestGymRate >= 70) {
    patterns.push({
      type: "positive",
      message: `${bestGymDay}s are your strongest gym day — ${bestGymRate}% attendance`,
      priority: 30,
    });
  }

  return patterns;
}

function detectRecentDanger(log: LogEntry[], dayMap: Map<string, Map<string, string>>): Pattern[] {
  const patterns: Pattern[] = [];
  const today = getToday();
  const threeDaysAgo = daysAgo(3);

  // Count consecutive red days (all addictions relapsed)
  const dates = [...dayMap.keys()].filter((d) => d <= today).sort().reverse();
  let redStreak = 0;

  for (const date of dates) {
    const metrics = dayMap.get(date)!;
    const weed = metrics.get("weed");
    const lol = metrics.get("lol");
    if (weed === "0" || lol === "0") {
      redStreak++;
    } else {
      break;
    }
  }

  if (redStreak >= 3) {
    patterns.push({
      type: "warning",
      message: `${redStreak} consecutive relapse days. Every streak started from a day like today.`,
      priority: 100,
    });
  }

  // Check if no positive habits in last 3 days
  const recentHabits = ["gym", "sleep", "meditate", "deep_work", "ate_clean"];
  let anyPositive = false;
  for (const date of dates.filter((d) => d >= threeDaysAgo)) {
    const metrics = dayMap.get(date);
    if (metrics) {
      for (const h of recentHabits) {
        if (metrics.get(h) === "1") {
          anyPositive = true;
          break;
        }
      }
    }
    if (anyPositive) break;
  }

  if (!anyPositive && dates.length >= 3) {
    patterns.push({
      type: "warning",
      message: "Zero positive habits in 3 days — one small win today breaks the spiral",
      priority: 95,
    });
  }

  return patterns;
}

// ─── Main ───

export async function GET() {
  const log = readLog();
  const plan = readPlan();
  const todaysPlan = getTodaysPlan(plan);
  const today = getToday();

  const dayMap = buildDayMap(log);

  // Streaks
  const addictionMetrics = ["weed", "lol", "poker"];
  const habitMetrics = ["gym", "sleep", "meditate", "deep_work", "ate_clean"];
  const allStreakMetrics = [...addictionMetrics, ...habitMetrics];

  const streaks: Record<string, StreakInfo> = {};
  for (const m of allStreakMetrics) {
    streaks[m] = computeStreaks(log, m);
  }

  // Weight
  const weight = computeWeight(log);

  // Habits
  const habits = computeHabits(log);

  // Patterns
  const patterns: Pattern[] = [
    ...detectCascades(log, dayMap),
    ...detectCorrelations(dayMap),
    ...detectStreakPatterns(streaks),
    ...detectDayOfWeekPatterns(dayMap),
    ...detectRecentDanger(log, dayMap),
  ];

  // Sort by priority descending
  patterns.sort((a, b) => b.priority - a.priority);

  // Today's plan
  const todaysPlanSummary = {
    itemCount: todaysPlan.length,
    doneCount: todaysPlan.filter((p) => p.done === "1").length,
  };

  // Reset day
  const resetDay = Math.floor(
    (new Date().getTime() - new Date(config.dopamineReset.startDate).getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;

  const response: InsightResponse = {
    date: today,
    streaks,
    weight,
    habits,
    patterns,
    todaysPlan: todaysPlanSummary,
    resetDay,
  };

  return NextResponse.json(response);
}
