import type { WeightData } from "../lib/types";
import { fmtDate } from "../lib/utils";

interface WeightChartProps {
  weight: WeightData;
}

export default function WeightChart({ weight }: WeightChartProps) {
  const weightLost = weight.start - weight.current;
  const weightTotal = weight.start - weight.goal;
  const weightPct = Math.max(0, Math.min(100, (weightLost / weightTotal) * 100));
  const weeklyTarget = weight.current - 2;
  const currentMonthName = new Date().toLocaleString("en-US", { month: "short" });
  const currentCheckpoint = weight.checkpoints.find(
    (c) => c.month === currentMonthName
  );

  return (
    <section className="mb-6 p-5 bg-zinc-900/60 backdrop-blur-md rounded-xl border border-white/10">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Weight</h2>
        <span className="text-sm text-zinc-400">
          Goal: {weight.goal} lbs by{" "}
          {new Date(weight.deadline + "T12:00:00").toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </span>
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
    </section>
  );
}
