"use client";

import { useState, useEffect } from "react";
import type { MindLoopEntry } from "../lib/types";
import ReflectPanel from "../components/ReflectPanel";

type MindView = "overview" | "patterns" | "sessions" | "reflect";

interface CountItem {
  label: string;
  count: number;
}

interface TriggerItem {
  trigger: string;
  count: number;
}

interface ActionItem {
  action: string;
  avgRelief: number;
  count: number;
}

interface LensItem {
  lens: string;
  count: number;
  avgRelief: number;
}

interface Summary7d {
  startDate: string;
  endDate: string;
  totalLoops: number;
  avgIntensityBefore: number;
  avgIntensityAfter: number;
  avgRelief: number;
  improved: number;
  unchanged: number;
  worsened: number;
}

interface MindData {
  streak: number;
  totalSessions30d: number;
  summary7d: Summary7d;
  recentLoops: MindLoopEntry[];
  topTriggers: TriggerItem[];
  topActions: ActionItem[];
  topThoughtPatterns: CountItem[];
  topValueTargets: CountItem[];
  lensBreakdown: LensItem[];
}

function lensColor(lens: string): string {
  switch (lens.toLowerCase()) {
    case "cbt":
      return "text-blue-300 border-blue-500/30 bg-blue-500/10";
    case "dbt":
      return "text-violet-300 border-violet-500/30 bg-violet-500/10";
    case "ifs":
      return "text-amber-300 border-amber-500/30 bg-amber-500/10";
    case "act":
      return "text-emerald-300 border-emerald-500/30 bg-emerald-500/10";
    case "somatic":
      return "text-rose-300 border-rose-500/30 bg-rose-500/10";
    default:
      return "text-zinc-300 border-white/10 bg-zinc-800/60";
  }
}

function reliefTone(value: number): { label: string; color: string } {
  if (value > 0) return { label: `+${value.toFixed(1)}`, color: "text-emerald-400" };
  if (value < 0) return { label: value.toFixed(1), color: "text-red-400" };
  return { label: "0.0", color: "text-zinc-400" };
}

function prettyText(value: string): string {
  const cleaned = value.replace(/[_-]/g, " ").replace(/\s+/g, " ").trim();
  if (!cleaned) return "Unlabeled";
  return cleaned
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function splitTags(value: string): string[] {
  return value
    .split(/[+,/;|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function SummaryMetric({
  label,
  value,
  tone = "text-zinc-100",
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-3 text-center">
      <p className={`text-2xl font-bold ${tone}`}>{value}</p>
      <p className="text-xs text-zinc-400">{label}</p>
    </div>
  );
}

function CountList({
  title,
  items,
  emptyMessage,
}: {
  title: string;
  items: CountItem[] | TriggerItem[];
  emptyMessage: string;
}) {
  return (
    <section className="rounded-xl border border-white/10 bg-zinc-900/60 p-3">
      <p className="mb-2 text-xs uppercase text-zinc-400">{title}</p>
      {items.length === 0 && <p className="text-sm text-zinc-500">{emptyMessage}</p>}
      {items.length > 0 && (
        <div className="space-y-1.5">
          {items.map((item) => {
            const key = "trigger" in item ? item.trigger : item.label;
            const value = "trigger" in item ? item.trigger : item.label;
            return (
              <div key={key} className="flex items-center justify-between gap-2 text-sm">
                <span className="text-zinc-300">{prettyText(value)}</span>
                <span className="font-mono text-zinc-500">{item.count}x</span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function ActionList({
  title,
  items,
  emptyMessage,
}: {
  title: string;
  items: ActionItem[];
  emptyMessage: string;
}) {
  return (
    <section className="rounded-xl border border-white/10 bg-zinc-900/60 p-3">
      <p className="mb-2 text-xs uppercase text-zinc-400">{title}</p>
      {items.length === 0 && <p className="text-sm text-zinc-500">{emptyMessage}</p>}
      {items.length > 0 && (
        <div className="space-y-1.5">
          {items.map((item) => {
            const tone = reliefTone(item.avgRelief);
            return (
              <div key={item.action} className="flex items-center justify-between gap-2 text-sm">
                <span className="text-zinc-300">{item.action}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-zinc-500">{item.count}x</span>
                  <span className={`font-mono ${tone.color}`}>{tone.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function LensList({
  items,
  emptyMessage,
}: {
  items: LensItem[];
  emptyMessage: string;
}) {
  return (
    <section className="rounded-xl border border-white/10 bg-zinc-900/60 p-3">
      <p className="mb-2 text-xs uppercase text-zinc-400">Lens Usage (30d)</p>
      {items.length === 0 && <p className="text-sm text-zinc-500">{emptyMessage}</p>}
      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((item) => {
            const tone = reliefTone(item.avgRelief);
            return (
              <div key={item.lens} className="rounded-lg border border-white/10 bg-black/30 p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className={`rounded border px-2 py-0.5 text-xs ${lensColor(item.lens)}`}>
                    {item.lens}
                  </span>
                  <span className="text-xs text-zinc-500">{item.count} sessions</span>
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  Avg relief: <span className={`font-mono ${tone.color}`}>{tone.label}</span>
                </p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default function MindPage() {
  const [data, setData] = useState<MindData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<MindView>("overview");
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

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
  const summaryTone = reliefTone(data.summary7d.avgRelief);
  const bestAction = data.topActions[0];
  const topTrigger = data.topTriggers[0];

  const snapshotText =
    data.summary7d.totalLoops === 0
      ? "No loops logged in the last 7 days. Capture at least one session to generate trend feedback."
      : `You logged ${data.summary7d.totalLoops} loop${
          data.summary7d.totalLoops === 1 ? "" : "s"
        } this week. Most repeated trigger: ${
          topTrigger ? prettyText(topTrigger.trigger) : "none"
        }. Strongest average relief came from ${
          bestAction ? `"${bestAction.action}"` : "no repeated action yet"
        }.`;

  const toggleLoop = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <div className="p-4 sm:p-6 pb-24">
        <div className="mx-auto max-w-4xl space-y-5">
          <header className="space-y-4">
            <h1 className="text-2xl font-bold">Mind</h1>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <SummaryMetric label="Day Streak" value={String(data.streak)} tone="text-emerald-400" />
              <SummaryMetric
                label="Loops (30d)"
                value={String(data.totalSessions30d)}
                tone="text-blue-400"
              />
              <SummaryMetric
                label="Loops (7d)"
                value={String(data.summary7d.totalLoops)}
                tone="text-zinc-100"
              />
              <SummaryMetric label="Avg Relief (7d)" value={summaryTone.label} tone={summaryTone.color} />
            </div>

            <section className="rounded-xl border border-white/10 bg-zinc-900/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs uppercase text-zinc-400">Mind Snapshot</p>
                <p className="text-xs text-zinc-500">
                  {data.summary7d.startDate} to {data.summary7d.endDate}
                </p>
              </div>
              <p className="mt-2 text-sm text-zinc-300">{snapshotText}</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <div className="rounded-lg border border-white/10 bg-black/30 p-2.5">
                  <p className="text-xs text-zinc-500">Avg Intensity</p>
                  <p className="text-sm text-zinc-200">
                    {data.summary7d.avgIntensityBefore.toFixed(1)} →{" "}
                    {data.summary7d.avgIntensityAfter.toFixed(1)}
                  </p>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/30 p-2.5">
                  <p className="text-xs text-zinc-500">Sessions Improved</p>
                  <p className="text-sm text-emerald-300">{data.summary7d.improved}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/30 p-2.5">
                  <p className="text-xs text-zinc-500">No Change / Worsened</p>
                  <p className="text-sm text-zinc-300">
                    {data.summary7d.unchanged} /{" "}
                    <span className="text-red-300">{data.summary7d.worsened}</span>
                  </p>
                </div>
              </div>
            </section>

            <nav className="rounded-xl border border-white/10 bg-zinc-900/60 p-1.5">
              <div className="grid grid-cols-4 gap-1">
                {(["overview", "patterns", "sessions", "reflect"] as MindView[]).map((view) => (
                  <button
                    key={view}
                    onClick={() => setActiveView(view)}
                    className={`rounded-md px-3 py-2 text-sm capitalize transition-colors ${
                      activeView === view
                        ? "border border-white/20 bg-zinc-800 text-zinc-100"
                        : "border border-transparent text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-200"
                    }`}
                  >
                    {view}
                  </button>
                ))}
              </div>
            </nav>
          </header>

          {empty && activeView !== "reflect" && (
            <div className="rounded-xl border border-white/10 bg-zinc-900/60 p-4 text-center">
              <p className="text-sm text-zinc-400">No loops yet. Log your first mind loop via the API.</p>
              <p className="text-zinc-500 text-xs mt-2">
                Trigger → Autopilot → Updated Action → Response
              </p>
            </div>
          )}

          {activeView === "reflect" && <ReflectPanel />}

          {!empty && activeView === "overview" && (
            <section className="grid gap-3 sm:grid-cols-2">
              <CountList
                title="Top Triggers (7d)"
                items={data.topTriggers.slice(0, 5)}
                emptyMessage="No repeating triggers yet."
              />
              <ActionList
                title="Best Interventions (7d)"
                items={data.topActions.slice(0, 5)}
                emptyMessage="Need repeated actions to rank relief."
              />
              <CountList
                title="Thought Patterns (7d)"
                items={data.topThoughtPatterns.slice(0, 5)}
                emptyMessage="No thought patterns logged."
              />
              <CountList
                title="Value Targets (7d)"
                items={data.topValueTargets.slice(0, 5)}
                emptyMessage="No value targets logged."
              />
              <div className="sm:col-span-2">
                <LensList
                  items={data.lensBreakdown}
                  emptyMessage="No lens usage logged in the last 30 days."
                />
              </div>
            </section>
          )}

          {!empty && activeView === "patterns" && (
            <section className="grid gap-3 sm:grid-cols-2">
              <CountList
                title="Trigger Breakdown (7d)"
                items={data.topTriggers}
                emptyMessage="No repeating triggers yet."
              />
              <ActionList
                title="Action Effectiveness (7d)"
                items={data.topActions}
                emptyMessage="Need repeated actions to rank relief."
              />
              <CountList
                title="Thought Pattern Breakdown (7d)"
                items={data.topThoughtPatterns}
                emptyMessage="No thought patterns logged."
              />
              <CountList
                title="Value Target Breakdown (7d)"
                items={data.topValueTargets}
                emptyMessage="No value targets logged."
              />
              <div className="sm:col-span-2">
                <LensList
                  items={data.lensBreakdown}
                  emptyMessage="No lens usage logged in the last 30 days."
                />
              </div>
            </section>
          )}

          {!empty && activeView === "sessions" && (
            <section className="space-y-3">
              <p className="text-xs uppercase text-zinc-400">Recent Sessions</p>
              {data.recentLoops.map((loop, i) => {
                const key = `${loop.date}-${i}-${loop.trigger}`;
                const relief = loop.emotionBefore - loop.emotionAfter;
                const reliefView = reliefTone(relief);
                const isExpanded = expandedKeys.has(key);
                const triggerTags = splitTags(loop.trigger);
                const thoughtTags = splitTags(loop.thoughtPattern);
                const bodyTags = splitTags(loop.bodySensation);
                const valueTags = splitTags(loop.valueTarget);

                return (
                  <article
                    key={key}
                    className="rounded-xl border border-white/10 bg-zinc-900/60 p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-xs text-zinc-500">{loop.date}</p>
                        <p className="text-sm text-zinc-200">
                          {triggerTags.length > 0
                            ? triggerTags.map(prettyText).join(" • ")
                            : "No trigger text"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {loop.lens && (
                          <span className={`rounded border px-1.5 py-0.5 text-xs ${lensColor(loop.lens)}`}>
                            {loop.lens}
                          </span>
                        )}
                        <span className={`font-mono text-sm ${reliefView.color}`}>{reliefView.label}</span>
                      </div>
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-2">
                      <p className="text-xs text-zinc-500">
                        Intensity: {loop.emotionBefore} → {loop.emotionAfter}
                      </p>
                      <button
                        onClick={() => toggleLoop(key)}
                        className="rounded border border-white/10 bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300 hover:bg-zinc-700"
                      >
                        {isExpanded ? "Hide Details" : "Show Details"}
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="mt-3 space-y-3 border-t border-white/10 pt-3">
                        <div className="grid gap-2 sm:grid-cols-3">
                          <div className="rounded-lg border border-white/10 bg-black/30 p-2.5">
                            <p className="text-xs uppercase text-zinc-500">Autopilot</p>
                            <p className="mt-1 text-sm text-zinc-300">
                              {loop.autopilotAction || "Not captured"}
                            </p>
                          </div>
                          <div className="rounded-lg border border-white/10 bg-black/30 p-2.5">
                            <p className="text-xs uppercase text-zinc-500">Updated Action</p>
                            <p className="mt-1 text-sm text-zinc-300">
                              {loop.updatedAction || "Not captured"}
                            </p>
                          </div>
                          <div className="rounded-lg border border-white/10 bg-black/30 p-2.5">
                            <p className="text-xs uppercase text-zinc-500">Response</p>
                            <p className="mt-1 text-sm text-zinc-300">{loop.response || "Not captured"}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {thoughtTags.map((item) => (
                            <span
                              key={`thought-${item}`}
                              className="rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-300"
                            >
                              Thought: {prettyText(item)}
                            </span>
                          ))}
                          {bodyTags.map((item) => (
                            <span
                              key={`body-${item}`}
                              className="rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-300"
                            >
                              Body: {prettyText(item)}
                            </span>
                          ))}
                          {valueTags.map((item) => (
                            <span
                              key={`value-${item}`}
                              className="rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-300"
                            >
                              Value: {prettyText(item)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
