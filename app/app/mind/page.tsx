"use client";

import { useState, useEffect } from "react";
import type { MindLoopEntry } from "../lib/types";

interface MindData {
  streak: number;
  totalSessions30d: number;
  recentLoops: MindLoopEntry[];
  topTriggers: { trigger: string; count: number }[];
  topActions: { action: string; avgDelta: number; count: number }[];
}

function lensColor(lens: string): string {
  switch (lens) {
    case "CBT": return "text-blue-400 border-blue-500/30";
    case "DBT": return "text-purple-400 border-purple-500/30";
    case "IFS": return "text-amber-400 border-amber-500/30";
    case "ACT": return "text-emerald-400 border-emerald-500/30";
    case "somatic": return "text-rose-400 border-rose-500/30";
    default: return "text-zinc-400 border-white/10";
  }
}

function emotionDelta(before: number, after: number): { label: string; color: string } {
  const diff = after - before;
  if (diff > 0) return { label: `+${diff}`, color: "text-emerald-400" };
  if (diff < 0) return { label: `${diff}`, color: "text-red-400" };
  return { label: "0", color: "text-zinc-400" };
}

export default function MindPage() {
  const [data, setData] = useState<MindData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/mind")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch mind data");
        return res.json();
      })
      .then(setData)
      .catch((err) => console.error("Failed to load mind data:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center">
        <p className="text-zinc-400">Loading...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center">
        <p className="text-red-400">Failed to load data</p>
      </div>
    );
  }

  const empty = data.recentLoops.length === 0;

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <div className="p-4 sm:p-6 pb-24">
        <div className="max-w-lg mx-auto space-y-5">
          {/* Header stats */}
          <header className="space-y-3">
            <h1 className="text-2xl font-bold">Mind</h1>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-zinc-900/60 backdrop-blur-md border border-white/10 text-center">
                <p className="text-2xl font-bold text-emerald-400">{data.streak}</p>
                <p className="text-xs text-zinc-400">Day Streak</p>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/60 backdrop-blur-md border border-white/10 text-center">
                <p className="text-2xl font-bold text-blue-400">{data.totalSessions30d}</p>
                <p className="text-xs text-zinc-400">Loops (30d)</p>
              </div>
            </div>
          </header>

          {empty && (
            <div className="bg-zinc-900/60 backdrop-blur-md border border-white/10 rounded-xl p-4 text-center">
              <p className="text-zinc-400 text-sm">No loops yet. Log your first mind loop via the API.</p>
              <p className="text-zinc-500 text-xs mt-2">
                Trigger → Autopilot → Updated Action → Response
              </p>
            </div>
          )}

          {/* Recent loops */}
          {!empty && (
            <section className="space-y-3">
              <p className="text-xs text-zinc-400 uppercase">Recent Loops</p>
              {data.recentLoops.map((loop, i) => {
                const delta = emotionDelta(loop.emotionBefore, loop.emotionAfter);
                return (
                  <div
                    key={`${loop.date}-${i}`}
                    className="bg-zinc-900/60 backdrop-blur-md border border-white/10 rounded-xl p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-400">{loop.date}</span>
                      <div className="flex items-center gap-2">
                        {loop.lens && (
                          <span className={`text-xs px-1.5 py-0.5 rounded border ${lensColor(loop.lens)}`}>
                            {loop.lens}
                          </span>
                        )}
                        <span className={`text-sm font-mono ${delta.color}`}>{delta.label}</span>
                      </div>
                    </div>

                    <div className="space-y-1 text-sm">
                      <p className="text-zinc-300">
                        <span className="text-zinc-500">Trigger:</span> {loop.trigger}
                      </p>
                      {loop.autopilotAction && (
                        <p className="text-zinc-300">
                          <span className="text-zinc-500">Autopilot:</span> {loop.autopilotAction}
                        </p>
                      )}
                      {loop.updatedAction && (
                        <p className="text-zinc-300">
                          <span className="text-zinc-500">Chose:</span> {loop.updatedAction}
                        </p>
                      )}
                      {loop.response && (
                        <p className="text-zinc-300">
                          <span className="text-zinc-500">Result:</span> {loop.response}
                        </p>
                      )}
                    </div>

                    {(loop.bodySensation || loop.thoughtPattern) && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {loop.bodySensation && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                            {loop.bodySensation}
                          </span>
                        )}
                        {loop.thoughtPattern && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                            {loop.thoughtPattern}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </section>
          )}

          {/* Top triggers (7d) */}
          {data.topTriggers.length > 0 && (
            <section className="bg-zinc-900/60 backdrop-blur-md border border-white/10 rounded-xl p-3">
              <p className="text-xs text-zinc-400 uppercase mb-2">Top Triggers (7d)</p>
              <div className="space-y-1">
                {data.topTriggers.map((t) => (
                  <div key={t.trigger} className="flex items-center justify-between text-sm">
                    <span className="text-zinc-300">{t.trigger}</span>
                    <span className="text-zinc-500">{t.count}x</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Top effective actions (7d) */}
          {data.topActions.length > 0 && (
            <section className="bg-zinc-900/60 backdrop-blur-md border border-white/10 rounded-xl p-3">
              <p className="text-xs text-zinc-400 uppercase mb-2">Most Effective Actions (7d)</p>
              <div className="space-y-1">
                {data.topActions.map((a) => {
                  const sign = a.avgDelta > 0 ? "+" : "";
                  const color = a.avgDelta > 0 ? "text-emerald-400" : a.avgDelta < 0 ? "text-red-400" : "text-zinc-400";
                  return (
                    <div key={a.action} className="flex items-center justify-between text-sm">
                      <span className="text-zinc-300">{a.action}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-500">{a.count}x</span>
                        <span className={`font-mono ${color}`}>{sign}{a.avgDelta.toFixed(1)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
