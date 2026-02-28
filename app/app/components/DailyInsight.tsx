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

interface StructuredInsight {
  streak: string;
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

export default function DailyInsight({ data }: { data: InsightData }) {
  const { insight } = data;

  return (
    <section className="mb-5 bg-zinc-900/60 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden">
      <div className="px-4 py-2 border-b border-white/5">
        <span className="text-xs text-zinc-400 uppercase tracking-wide">
          Daily Insight
        </span>
      </div>

      <div className="px-4 py-3 space-y-2">
        <p className="text-sm text-zinc-200">{insight.streak}</p>
        <p className="text-sm text-zinc-400">{insight.momentum}</p>
      </div>

      {insight.warning && (
        <div className="px-4 py-3 border-t border-white/5 bg-red-500/5">
          <p className="text-xs text-red-300 uppercase tracking-wide mb-1">Risk</p>
          <p className="text-sm text-red-200">{insight.warning}</p>
        </div>
      )}
    </section>
  );
}
