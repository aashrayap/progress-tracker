import { todayStr as todayLocal, daysAgoStr } from "./utils";
import { config } from "./config";

interface InsightMetricEntry {
  date: string;
  metric: string;
  value: string;
  notes: string;
}

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
  yesterday: Record<string, boolean>;
}

interface Pattern {
  type: "warning" | "positive";
  message: string;
  priority: number;
}

interface StructuredInsight {
  streak: string;
  warning: string | null;
  momentum: string;
}

interface GroupedStreaks {
  avoid: Record<string, StreakInfo>;
  build: Record<string, StreakInfo>;
}

interface InsightResponse {
  date: string;
  streaks: GroupedStreaks;
  weight: WeightInsight;
  habits: HabitSummary;
  patterns: Pattern[];
  insight: StructuredInsight;
  todaysPlan: { itemCount: number; doneCount: number };
  resetDay: number;
}

export function computeInsightResponse(
  log: InsightMetricEntry[],
  todaysPlan: { done: string }[]
): InsightResponse {
  const today = getToday();
  const dayMap = buildDayMap(log);

  const avoidMetrics = ["weed", "lol", "poker"];
  const buildMetrics = ["gym", "ate_clean", "sleep"];
  const allStreakMetrics = [...avoidMetrics, ...buildMetrics];

  const flatStreaks: Record<string, StreakInfo> = {};
  for (const metric of allStreakMetrics) {
    flatStreaks[metric] = computeStreaks(log, metric);
  }

  const streaks: GroupedStreaks = {
    avoid: {},
    build: {},
  };
  for (const metric of avoidMetrics) streaks.avoid[metric] = flatStreaks[metric];
  for (const metric of buildMetrics) streaks.build[metric] = flatStreaks[metric];

  const weight = computeWeight(log);
  const habits = computeHabits(log, dayMap);

  const patterns: Pattern[] = [
    ...detectStreakPatterns(flatStreaks),
    ...detectRecentDanger(dayMap),
  ].sort((a, b) => b.priority - a.priority);

  const insight = buildStructuredInsight(flatStreaks, patterns, habits);

  const todaysPlanSummary = {
    itemCount: todaysPlan.length,
    doneCount: todaysPlan.filter((p) => p.done === "1").length,
  };

  const resetDay =
    Math.floor(
      (new Date().getTime() -
        new Date(config.dopamineReset.startDate).getTime()) /
        (1000 * 60 * 60 * 24)
    ) + 1;

  return {
    date: today,
    streaks,
    weight,
    habits,
    patterns,
    insight,
    todaysPlan: todaysPlanSummary,
    resetDay,
  };
}

function getToday(): string {
  return todayLocal();
}

function daysAgo(n: number): string {
  return daysAgoStr(n);
}

function buildDayMap(log: InsightMetricEntry[]): Map<string, Map<string, string>> {
  const map = new Map<string, Map<string, string>>();
  for (const entry of log) {
    if (!map.has(entry.date)) map.set(entry.date, new Map());
    map.get(entry.date)!.set(entry.metric, entry.value);
  }
  return map;
}

function computeStreaks(log: InsightMetricEntry[], metric: string): StreakInfo {
  const entries = log
    .filter((entry) => entry.metric === metric)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (entries.length === 0) return { current: 0, best: 0 };

  let best = 0;
  let running = 0;
  for (const entry of entries) {
    if (entry.value === "1") {
      running += 1;
      best = Math.max(best, running);
      continue;
    }
    running = 0;
  }

  return { current: running, best };
}

function computeWeight(log: InsightMetricEntry[]): WeightInsight {
  const weights = log
    .filter((entry) => entry.metric === "weight")
    .map((entry) => ({ date: entry.date, value: parseFloat(entry.value) }))
    .sort((a, b) => a.date.localeCompare(b.date));

  if (weights.length === 0) {
    return {
      current: null,
      weekAgo: null,
      twoWeeksAgo: null,
      trend: "unknown",
      onTrack: false,
      monthTarget: null,
      monthLabel: null,
    };
  }

  const current = weights[weights.length - 1].value;
  const weekAgoDate = daysAgo(7);
  const twoWeeksAgoDate = daysAgo(14);

  const findClosest = (targetDate: string): number | null => {
    const before = weights.filter((weight) => weight.date <= targetDate);
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
  const checkpoint = config.weight.checkpoints.find(
    (entry) => entry.month === currentMonthName
  );
  const monthTarget = checkpoint?.target ?? null;
  const monthLabel = checkpoint?.month ?? null;
  const onTrack = monthTarget !== null ? current <= monthTarget : false;

  return { current, weekAgo, twoWeeksAgo, trend, onTrack, monthTarget, monthLabel };
}

function computeHabits(
  log: InsightMetricEntry[],
  dayMap: Map<string, Map<string, string>>
): HabitSummary {
  const habitMetrics = ["gym", "sleep", "meditate", "deep_work", "ate_clean"];
  const sevenDaysAgo = daysAgo(7);
  const today = getToday();
  const yesterday = daysAgo(1);

  const recent = log.filter(
    (entry) =>
      habitMetrics.includes(entry.metric) &&
      entry.date >= sevenDaysAgo &&
      entry.date <= today
  );

  const counts: Record<string, number> = {};
  for (const metric of habitMetrics) {
    counts[metric] = recent.filter(
      (entry) => entry.metric === metric && entry.value === "1"
    ).length;
  }

  const yesterdayData = dayMap.get(yesterday);
  const yesterdayHabits: Record<string, boolean> = {};
  for (const metric of habitMetrics) {
    yesterdayHabits[metric] = yesterdayData?.get(metric) === "1";
  }

  return { last7days: counts, yesterday: yesterdayHabits };
}

function detectStreakPatterns(streaks: Record<string, StreakInfo>): Pattern[] {
  const patterns: Pattern[] = [];
  const addictionMetrics = ["weed", "lol", "poker"];

  for (const metric of addictionMetrics) {
    const streak = streaks[metric];
    if (!streak) continue;

    if (streak.current > 0 && streak.current >= streak.best) {
      const label = metric === "lol" ? "LoL" : metric;
      patterns.push({
        type: "positive",
        message: `${label}: ${streak.current}-day streak — personal best!`,
        priority: 70,
      });
      continue;
    }

    if (streak.current === 0 && streak.best > 0) {
      const label = metric === "lol" ? "LoL" : metric;
      patterns.push({
        type: "warning",
        message: `${label}: streak broken. Previous best was ${streak.best} days — restart today`,
        priority: 80,
      });
    }
  }

  return patterns;
}

function detectRecentDanger(
  dayMap: Map<string, Map<string, string>>
): Pattern[] {
  const patterns: Pattern[] = [];
  const today = getToday();
  const threeDaysAgo = daysAgo(3);

  const dates = [...dayMap.keys()].filter((d) => d <= today).sort().reverse();
  let redStreak = 0;

  for (const date of dates) {
    const metrics = dayMap.get(date)!;
    if (metrics.get("weed") === "0" || metrics.get("lol") === "0") {
      redStreak += 1;
      continue;
    }
    break;
  }

  if (redStreak >= 3) {
    patterns.push({
      type: "warning",
      message: `${redStreak} consecutive relapse days. Every streak started from a day like today.`,
      priority: 100,
    });
  }

  const recentHabits = ["gym", "sleep", "meditate", "deep_work", "ate_clean"];
  let anyPositive = false;
  for (const date of dates.filter((d) => d >= threeDaysAgo)) {
    const metrics = dayMap.get(date);
    if (!metrics) continue;
    for (const habit of recentHabits) {
      if (metrics.get(habit) === "1") {
        anyPositive = true;
        break;
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

function buildStructuredInsight(
  allStreaks: Record<string, StreakInfo>,
  patterns: Pattern[],
  habits: HabitSummary
): StructuredInsight {
  const activeStreaks = Object.entries(allStreaks)
    .filter(([, streak]) => streak.current > 0)
    .sort((a, b) => b[1].current - a[1].current);

  let streakMsg = "No active streaks";
  if (activeStreaks.length > 0) {
    const [metric, info] = activeStreaks[0];
    const label =
      metric === "lol"
        ? "LoL"
        : metric === "ate_clean"
          ? "Ate clean"
          : metric.charAt(0).toUpperCase() + metric.slice(1);
    const bestNote =
      info.current >= info.best ? " (personal best!)" : ` (best: ${info.best})`;
    streakMsg = `${label}: ${info.current} day streak${bestNote}`;
  }

  const warnings = patterns.filter((pattern) => pattern.type === "warning");
  const warningMsg = warnings.length > 0 ? warnings[0].message : null;

  const habitKeys = ["gym", "sleep", "meditate", "deep_work", "ate_clean"];
  const yesterdayCount = habitKeys.filter((key) => habits.yesterday[key]).length;
  const totalHabits = habitKeys.length;
  const lastWeekTotal = habitKeys.reduce(
    (sum, key) => sum + (habits.last7days[key] ?? 0),
    0
  );
  const lastWeekAvg = Math.round(lastWeekTotal / 7);

  let momentumMsg: string;
  if (yesterdayCount === 0 && lastWeekAvg === 0) {
    momentumMsg = "Fresh start — pick one habit to own today";
  } else if (yesterdayCount > lastWeekAvg) {
    momentumMsg = `${yesterdayCount}/${totalHabits} habits yesterday, up from ~${lastWeekAvg}/day last week`;
  } else if (yesterdayCount < lastWeekAvg) {
    momentumMsg = `${yesterdayCount}/${totalHabits} habits yesterday, down from ~${lastWeekAvg}/day last week`;
  } else {
    momentumMsg = `${yesterdayCount}/${totalHabits} habits yesterday, steady at ~${lastWeekAvg}/day`;
  }

  return {
    streak: streakMsg,
    warning: warningMsg,
    momentum: momentumMsg,
  };
}
