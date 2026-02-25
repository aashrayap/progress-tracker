"use client";

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

interface Pattern {
  type: "warning" | "positive" | "correlation" | "streak" | "dayofweek";
  message: string;
  priority: number;
}

export interface InsightData {
  date: string;
  streaks: Record<string, StreakInfo>;
  weight: WeightInsight;
  habits: {
    last7days: Record<string, number>;
    bestHabit: string | null;
    worstHabit: string | null;
  };
  patterns: Pattern[];
  todaysPlan: { itemCount: number; doneCount: number };
  resetDay: number;
}

const BORDER_COLORS: Record<string, string> = {
  warning: "border-l-red-500",
  positive: "border-l-emerald-500",
  correlation: "border-l-blue-500",
  streak: "border-l-amber-500",
  dayofweek: "border-l-violet-500",
};

const BADGE_STYLES: Record<string, string> = {
  warning: "bg-red-500/10 text-red-400",
  positive: "bg-emerald-500/10 text-emerald-400",
  correlation: "bg-blue-500/10 text-blue-400",
  streak: "bg-amber-500/10 text-amber-400",
  dayofweek: "bg-violet-500/10 text-violet-400",
};

function PatternCard({ pattern }: { pattern: Pattern }) {
  return (
    <div
      className={`border-l-2 ${BORDER_COLORS[pattern.type]} pl-3 py-2 bg-zinc-900/50 rounded-r`}
    >
      <div className="flex items-start gap-2">
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded font-medium uppercase shrink-0 mt-0.5 ${BADGE_STYLES[pattern.type]}`}
        >
          {pattern.type === "dayofweek" ? "pattern" : pattern.type}
        </span>
        <p className="text-sm text-zinc-300 leading-snug">{pattern.message}</p>
      </div>
    </div>
  );
}

function StreakBadge({ label, streak }: { label: string; streak: StreakInfo }) {
  const isClean = streak.current > 0;
  const isPersonalBest = streak.current > 0 && streak.current >= streak.best;

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
        isClean
          ? "bg-emerald-500/5 border-emerald-500/20"
          : "bg-red-500/5 border-red-500/20"
      }`}
    >
      <span
        className={`text-lg font-bold tabular-nums ${
          isClean ? "text-emerald-400" : "text-red-400"
        }`}
      >
        {streak.current}
      </span>
      <div className="flex flex-col">
        <span className="text-xs text-zinc-400">{label}</span>
        <span className="text-[10px] text-zinc-600">
          {isPersonalBest && streak.current > 0
            ? "BEST"
            : `best: ${streak.best}`}
        </span>
      </div>
    </div>
  );
}

function WeightStatus({ weight }: { weight: WeightInsight }) {
  if (weight.current === null) return null;

  const trendIcon =
    weight.trend === "down" ? "↓" : weight.trend === "up" ? "↑" : "→";
  const trendColor =
    weight.trend === "down"
      ? "text-emerald-400"
      : weight.trend === "up"
        ? "text-red-400"
        : "text-zinc-400";

  const diff =
    weight.weekAgo !== null
      ? (weight.current - weight.weekAgo).toFixed(1)
      : null;

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-zinc-500">Weight</span>
      <span className="font-medium text-zinc-200">{weight.current} lbs</span>
      {diff !== null && (
        <span className={`text-xs ${trendColor}`}>
          {trendIcon} {parseFloat(diff) > 0 ? "+" : ""}
          {diff} /wk
        </span>
      )}
      {weight.monthTarget !== null && (
        <span
          className={`text-xs px-1.5 py-0.5 rounded ${
            weight.onTrack
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-red-500/10 text-red-400"
          }`}
        >
          {weight.onTrack ? "on track" : `${weight.monthLabel} target: ${weight.monthTarget}`}
        </span>
      )}
    </div>
  );
}

function HabitBar({
  label,
  count,
  max,
}: {
  label: string;
  count: number;
  max: number;
}) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  const color =
    pct >= 60
      ? "bg-emerald-500"
      : pct >= 30
        ? "bg-amber-500"
        : "bg-red-500/60";

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-zinc-500 w-20 text-right">
        {label.replace("_", " ")}
      </span>
      <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-zinc-600 w-6 text-right tabular-nums">
        {count}/{max}
      </span>
    </div>
  );
}

export default function DailyInsight({ data }: { data: InsightData }) {
  const topPatterns = data.patterns.slice(0, 3);
  const addictionStreaks = ["weed", "lol", "poker"];
  const habitOrder = ["gym", "sleep", "meditate", "deep_work", "ate_clean"];

  const hasWarning = topPatterns.some((p) => p.type === "warning");

  return (
    <section className="mb-6 space-y-3">
      {/* Patterns — most important section */}
      {topPatterns.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs text-zinc-500 uppercase tracking-wide">
            {hasWarning ? "Alerts" : "Insights"}
          </span>
          {topPatterns.map((p, i) => (
            <PatternCard key={i} pattern={p} />
          ))}
        </div>
      )}

      {/* Addiction streaks */}
      <div className="space-y-2">
        <span className="text-xs text-zinc-500 uppercase tracking-wide">
          Streaks — Day {data.resetDay} of 90
        </span>
        <div className="flex gap-2">
          {addictionStreaks.map((m) => (
            <StreakBadge
              key={m}
              label={m === "lol" ? "LoL" : m}
              streak={data.streaks[m]}
            />
          ))}
        </div>
      </div>

      {/* Weight + Habits compact row */}
      <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-800 space-y-3">
        <WeightStatus weight={data.weight} />

        <div className="space-y-1.5">
          <span className="text-xs text-zinc-500">Last 7 days</span>
          {habitOrder.map((h) => (
            <HabitBar
              key={h}
              label={h}
              count={data.habits.last7days[h] ?? 0}
              max={7}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
