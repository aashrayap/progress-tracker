"use client";

import { useMemo, useState } from "react";
import type { WeightData } from "../lib/types";
import { fmtDate } from "../lib/utils";
import LineTrendChart from "./LineTrendChart";
import TrendModal from "./TrendModal";

interface WeightChartProps {
  weight: WeightData;
}

export default function WeightChart({ weight }: WeightChartProps) {
  const [showTrendModal, setShowTrendModal] = useState(false);
  const [chartMode, setChartMode] = useState<"raw" | "smoothed">("raw");

  const weightLost = weight.start - weight.current;
  const weightTotal = weight.start - weight.goal;
  const weightPct = Math.max(0, Math.min(100, (weightLost / weightTotal) * 100));
  const weeklyTarget = weight.current - 2;
  const currentMonthName = new Date().toLocaleString("en-US", { month: "short" });
  const currentCheckpoint = weight.checkpoints.find(
    (c) => c.month === currentMonthName
  );

  const chronologicalHistory = useMemo(
    () => [...weight.history].sort((a, b) => a.date.localeCompare(b.date)),
    [weight.history]
  );

  const rawPoints = useMemo(
    () => chronologicalHistory.map((entry) => ({ date: entry.date, value: entry.value })),
    [chronologicalHistory]
  );

  const smoothedPoints = useMemo(
    () =>
      chronologicalHistory.map((entry, index) => {
        const windowStart = Math.max(0, index - 6);
        const window = chronologicalHistory.slice(windowStart, index + 1);
        const avg = window.reduce((sum, value) => sum + value.value, 0) / window.length;
        return { date: entry.date, value: Number(avg.toFixed(1)) };
      }),
    [chronologicalHistory]
  );

  const activeTrend = chartMode === "raw" ? rawPoints : smoothedPoints;

  const trendStats = useMemo(() => {
    if (chronologicalHistory.length === 0) return null;
    const first = chronologicalHistory[0];
    const latest = chronologicalHistory[chronologicalHistory.length - 1];
    const values = chronologicalHistory.map((entry) => entry.value);
    return {
      first,
      latest,
      delta: Number((latest.value - first.value).toFixed(1)),
      low: Math.min(...values),
      high: Math.max(...values),
    };
  }, [chronologicalHistory]);

  return (
    <section className="mb-6 p-5 bg-zinc-900/60 backdrop-blur-md rounded-xl border border-white/10">
      <div className="flex justify-between items-start mb-4 gap-3">
        <h2 className="text-lg font-semibold">Weight</h2>
        <div className="flex flex-wrap items-center justify-end gap-2 text-right">
          <span className="text-xs sm:text-sm text-zinc-400">
            Goal: {weight.goal} lbs by{" "}
            {new Date(weight.deadline + "T12:00:00").toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
          <button
            onClick={() => {
              setChartMode("raw");
              setShowTrendModal(true);
            }}
            className="px-2.5 py-1 rounded-md border border-white/15 bg-zinc-800 text-xs text-zinc-300 hover:text-zinc-100 hover:border-white/30"
          >
            Trend
          </button>
        </div>
      </div>

      {/* Big current weight */}
      <div className="text-center mb-4">
        <p className="text-5xl font-bold tracking-tight">{weight.current}</p>
        <p className="text-sm text-zinc-400 mt-1">
          {weightLost > 0 ? (
            <>
              <span className="text-emerald-400">-{weightLost} lbs</span> from{" "}
              {weight.start}
            </>
          ) : weightLost < 0 ? (
            <>
              <span className="text-red-400">+{Math.abs(weightLost)} lbs</span>{" "}
              from {weight.start}
            </>
          ) : (
            <>Same as start ({weight.start})</>
          )}
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-zinc-400 mb-1">
          <span>{weight.start}</span>
          <span className="text-blue-400">{Math.round(weightPct)}%</span>
          <span className="text-emerald-400">{weight.goal}</span>
        </div>
        <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-emerald-400 rounded-full transition-all"
            style={{ width: `${weightPct}%` }}
          />
        </div>
      </div>

      {/* Checkpoints */}
      <div className="grid grid-cols-5 gap-1 mb-4">
        {weight.checkpoints.map((cp) => {
          const hit = weight.current <= cp.target;
          const isCurrent = cp.month === currentMonthName;
          return (
            <div
              key={cp.month}
              className={`text-center p-2 rounded ${
                isCurrent
                  ? "bg-blue-500/10 border border-blue-500/30"
                  : "bg-zinc-800/50"
              }`}
            >
              <p className="text-xs text-zinc-400">{cp.month}</p>
              <p
                className={`text-sm font-mono ${
                  hit ? "text-emerald-400" : "text-zinc-400"
                }`}
              >
                {cp.target}
              </p>
            </div>
          );
        })}
      </div>

      {/* Target this week */}
      {currentCheckpoint && (
        <div className="flex justify-between items-center text-sm p-3 rounded-xl bg-zinc-800/50 border border-white/10">
          <span className="text-zinc-400">This week&apos;s target</span>
          <span className="font-mono">{weeklyTarget} lbs</span>
        </div>
      )}

      {/* Weight history (last 10) */}
      {weight.history.length > 0 && (
        <div className="mt-4">
          <p className="text-xs text-zinc-400 uppercase tracking-wide mb-2">
            Recent Weigh-ins
          </p>
          <div className="space-y-1">
            {[...weight.history]
              .reverse()
              .slice(0, 10)
              .map((w, i, arr) => {
                const prev = arr[i + 1];
                const diff = prev ? w.value - prev.value : 0;
                return (
                  <div
                    key={w.date}
                    className="flex justify-between items-center text-sm py-1"
                  >
                    <span className="text-zinc-400">{fmtDate(w.date)}</span>
                    <div className="flex items-center gap-3">
                      {diff !== 0 && (
                        <span
                          className={`text-xs ${
                            diff < 0 ? "text-emerald-400" : "text-red-400"
                          }`}
                        >
                          {diff > 0 ? "+" : ""}
                          {diff}
                        </span>
                      )}
                      <span className="font-mono w-12 text-right">
                        {w.value}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      <TrendModal
        open={showTrendModal}
        onClose={() => setShowTrendModal(false)}
        title="Weight Trend"
        subtitle={`${chronologicalHistory.length} weigh-ins`}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="inline-flex rounded-lg border border-white/10 bg-zinc-900 p-1">
              <button
                onClick={() => setChartMode("raw")}
                className={`rounded-md px-3 py-1.5 text-xs ${
                  chartMode === "raw"
                    ? "bg-blue-500/20 text-blue-300"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Raw
              </button>
              <button
                onClick={() => setChartMode("smoothed")}
                className={`rounded-md px-3 py-1.5 text-xs ${
                  chartMode === "smoothed"
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                7-day Avg
              </button>
            </div>
            <p className="text-xs text-zinc-500">{fmtDate(weight.deadline)} target date</p>
          </div>

          <LineTrendChart
            points={activeTrend}
            color={chartMode === "raw" ? "#60a5fa" : "#34d399"}
            valueFormatter={(value) => `${value.toFixed(1)} lbs`}
          />

          {trendStats ? (
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg border border-white/10 bg-zinc-900/60 p-3">
                <p className="text-[11px] uppercase tracking-wide text-zinc-500">Change</p>
                <p
                  className={`mt-1 font-mono text-sm ${
                    trendStats.delta < 0
                      ? "text-emerald-400"
                      : trendStats.delta > 0
                        ? "text-red-400"
                        : "text-zinc-300"
                  }`}
                >
                  {trendStats.delta > 0 ? "+" : ""}
                  {trendStats.delta} lbs
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  {fmtDate(trendStats.first.date)} to {fmtDate(trendStats.latest.date)}
                </p>
              </div>
              <div className="rounded-lg border border-white/10 bg-zinc-900/60 p-3">
                <p className="text-[11px] uppercase tracking-wide text-zinc-500">Low</p>
                <p className="mt-1 font-mono text-sm text-zinc-100">{trendStats.low} lbs</p>
                <p className="mt-1 text-xs text-zinc-500">Best scale reading</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-zinc-900/60 p-3">
                <p className="text-[11px] uppercase tracking-wide text-zinc-500">High</p>
                <p className="mt-1 font-mono text-sm text-zinc-100">{trendStats.high} lbs</p>
                <p className="mt-1 text-xs text-zinc-500">Highest scale reading</p>
              </div>
            </div>
          ) : null}
        </div>
      </TrendModal>
    </section>
  );
}
