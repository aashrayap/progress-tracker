"use client";

import { config } from "../lib/config";

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

interface StructuredInsight {
  streak: string;
  opportunity: string;
  warning: string | null;
  momentum: string;
}

interface GroupedStreaks {
  avoid: Record<string, StreakInfo>;
  build: Record<string, StreakInfo>;
}

export interface InsightData {
  date: string;
  streaks: GroupedStreaks;
  weight: WeightInsight;
  habits: {
    last7days: Record<string, number>;
    yesterday: Record<string, boolean>;
    bestHabit: string | null;
    worstHabit: string | null;
  };
  patterns: {
    type: string;
    message: string;
    priority: number;
  }[];
  insight: StructuredInsight;
  todaysPlan: { itemCount: number; doneCount: number };
  resetDay: number;
}

const STREAK_LABELS: Record<string, string> = {
  weed: "Weed",
  lol: "LoL",
  poker: "Poker",
  gym: "Gym",
  ate_clean: "Clean",
  sleep: "Sleep",
};

function streakColor(current: number): string {
  if (current === 0) return "text-red-400";
  if (current === 1) return "text-amber-400";
  return "text-emerald-400";
}

function streakDot(current: number): string {
  if (current === 0) return "bg-red-400";
  if (current === 1) return "bg-amber-400";
  return "bg-emerald-400";
}

function StreakRow({ label, streak }: { label: string; streak: StreakInfo }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${streakDot(streak.current)}`} />
      <span className={`text-sm tabular-nums ${streakColor(streak.current)}`}>
        {streak.current}d
      </span>
      <span className="text-sm text-zinc-400">{label}</span>
      {streak.current > 0 && streak.current >= streak.best && (
        <span className="text-[10px] text-amber-500 ml-auto">BEST</span>
      )}
    </div>
  );
}

export default function DailyInsight({ data }: { data: InsightData }) {
  const { insight, streaks, weight } = data;

  const trendArrow =
    weight.trend === "down" ? "▼" : weight.trend === "up" ? "▲" : "―";
  const trendColor =
    weight.trend === "down"
      ? "text-emerald-400"
      : weight.trend === "up"
        ? "text-red-400"
        : "text-zinc-500";
  const trackLabel = weight.onTrack ? "on track" : "off track";
  const trackColor = weight.onTrack
    ? "text-emerald-400"
    : "text-red-400";

  return (
    <section className="mb-5 bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-3 pb-2 border-b border-zinc-800/50">
        <span className="text-xs text-zinc-500 uppercase tracking-wide">
          Daily Insight
        </span>
      </div>

      {/* Structured insights */}
      <div className="px-4 py-3 space-y-2">
        <div className="flex items-start gap-2">
          <span className="text-amber-400 shrink-0 text-sm mt-px">⚡</span>
          <p className="text-sm text-zinc-300">{insight.streak}</p>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-blue-400 shrink-0 text-sm mt-px">◆</span>
          <p className="text-sm text-zinc-300">{insight.opportunity}</p>
        </div>
        {insight.warning && (
          <div className="flex items-start gap-2">
            <span className="text-red-400 shrink-0 text-sm mt-px">⚠</span>
            <p className="text-sm text-red-300">{insight.warning}</p>
          </div>
        )}
        <div className="flex items-start gap-2">
          <span className="text-zinc-400 shrink-0 text-sm mt-px">↗</span>
          <p className="text-sm text-zinc-300">{insight.momentum}</p>
        </div>
      </div>

      {/* Streaks: avoid + build side by side */}
      <div className="px-4 py-3 border-t border-zinc-800/50">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-[10px] text-zinc-600 uppercase tracking-wide">
              Avoid
            </span>
            <div className="mt-1.5 space-y-1">
              {Object.entries(streaks.avoid).map(([key, info]) => (
                <StreakRow
                  key={key}
                  label={STREAK_LABELS[key] || key}
                  streak={info}
                />
              ))}
            </div>
          </div>
          <div>
            <span className="text-[10px] text-zinc-600 uppercase tracking-wide">
              Build
            </span>
            <div className="mt-1.5 space-y-1">
              {Object.entries(streaks.build).map(([key, info]) => (
                <StreakRow
                  key={key}
                  label={STREAK_LABELS[key] || key}
                  streak={info}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Weight */}
      {weight.current !== null && (
        <div className="px-4 py-3 border-t border-zinc-800/50 flex items-center gap-3 text-sm">
          <span className="text-zinc-500">Weight</span>
          <span className="font-medium text-zinc-200">{weight.current}</span>
          <span className="text-zinc-600">→</span>
          <span className="text-zinc-400">{config.weight.goal}</span>
          <span className={`${trendColor}`}>{trendArrow}</span>
          <span className={`text-xs ml-auto ${trackColor}`}>
            {trackLabel}
          </span>
        </div>
      )}
    </section>
  );
}
