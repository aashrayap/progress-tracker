"use client";

import { useEffect, useMemo, useState } from "react";

interface ReflectionEntry {
  date: string;
  domain: string;
  win: string;
  lesson: string;
  change: string;
}

interface ReflectionData {
  today: ReflectionEntry[];
  week: { count: number };
  yesterdayChanges: ReflectionEntry[];
  recent: ReflectionEntry[];
  patterns: { lesson: string; count: number }[];
}

interface DeepWorkData {
  stats: {
    todayMinutes: number;
    todaySessions: number;
    weekMinutes: number;
    weekSessions: number;
    weekDays: number;
  };
  categoryBreakdown: { category: string; minutes: number; pct: number }[];
  recent: {
    date: string;
    durationMin: number;
    topic: string;
    category: string;
    reflection: ReflectionEntry | null;
  }[];
}

const DOMAINS = ["deep_work", "gym", "eating", "sleep", "addiction"];

function domainLabel(domain: string): string {
  if (domain === "deep_work") return "Deep Work";
  if (domain === "gym") return "Gym";
  if (domain === "eating") return "Eating";
  if (domain === "sleep") return "Sleep";
  if (domain === "addiction") return "Recovery";
  return domain;
}

export default function ReflectPage() {
  const [reflectionData, setReflectionData] = useState<ReflectionData | null>(null);
  const [deepWorkData, setDeepWorkData] = useState<DeepWorkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"reflections" | "deep_work">("reflections");

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/reflections").then((r) => r.json()),
      fetch("/api/deep-work").then((r) => r.json()),
    ])
      .then(([r, d]) => {
        setReflectionData(r);
        setDeepWorkData(d);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const todaysDomainSet = useMemo(() => {
    return new Set((reflectionData?.today || []).map((r) => r.domain));
  }, [reflectionData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
        <span className="text-zinc-500">Loading...</span>
      </div>
    );
  }

  if (!reflectionData || !deepWorkData) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4">
        <p className="text-zinc-500">Failed to load reflection dashboard.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="p-4 sm:p-6 pb-24">
        <div className="max-w-lg mx-auto space-y-5">
          <h1 className="text-2xl font-bold">Reflect</h1>

          <section className="bg-zinc-900 border border-zinc-800 rounded-lg p-1 grid grid-cols-2 gap-1">
            <button
              onClick={() => setView("reflections")}
              className={`py-2 rounded text-sm transition-colors ${
                view === "reflections"
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Reflections
            </button>
            <button
              onClick={() => setView("deep_work")}
              className={`py-2 rounded text-sm transition-colors ${
                view === "deep_work"
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Deep Work
            </button>
          </section>

          {view === "reflections" && reflectionData.yesterdayChanges.length > 0 && (
            <section className="bg-zinc-900 border border-amber-500/30 rounded-lg p-3">
              <p className="text-xs text-zinc-500 uppercase mb-2">Yesterday&apos;s Changes</p>
              <div className="space-y-1 text-sm">
                {reflectionData.yesterdayChanges.map((r, idx) => (
                  <p key={`${r.domain}-${idx}`} className="text-zinc-300">
                    - {r.change} <span className="text-zinc-500">({domainLabel(r.domain)})</span>
                  </p>
                ))}
              </div>
            </section>
          )}

          {view === "deep_work" && (
            <>
              <section className="grid grid-cols-3 gap-2">
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-center">
                  <p className="text-xs text-zinc-500">Today</p>
                  <p className="text-xl font-bold">{deepWorkData.stats.todayMinutes}m</p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-center">
                  <p className="text-xs text-zinc-500">Week</p>
                  <p className="text-xl font-bold">{deepWorkData.stats.weekMinutes}m</p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-center">
                  <p className="text-xs text-zinc-500">Days</p>
                  <p className="text-xl font-bold">{deepWorkData.stats.weekDays}/7</p>
                </div>
              </section>

              <section className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
                <p className="text-xs text-zinc-500 uppercase mb-2">Category Breakdown (Week)</p>
                <div className="space-y-2">
                  {deepWorkData.categoryBreakdown.length === 0 && <p className="text-sm text-zinc-600">No deep work yet.</p>}
                  {deepWorkData.categoryBreakdown.map((c) => (
                    <div key={c.category}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-zinc-300">{c.category}</span>
                        <span className="text-zinc-500">{c.minutes}m ({c.pct}%)</span>
                      </div>
                      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500" style={{ width: `${c.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
                <p className="text-xs text-zinc-500 uppercase mb-2">Recent Sessions</p>
                <div className="space-y-2">
                  {deepWorkData.recent.slice(0, 8).map((s, i) => (
                    <div key={`${s.date}-${i}`} className="border border-zinc-800 rounded p-2">
                      <p className="text-xs text-zinc-500 mb-1">{s.date} · {s.category} · {s.durationMin}m</p>
                      <p className="text-sm text-zinc-300">{s.topic || "No topic"}</p>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {view === "reflections" && (
            <>
              <section className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
                <p className="text-xs text-zinc-500 uppercase mb-2">Today by Domain</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {DOMAINS.map((d) => (
                    <span
                      key={d}
                      className={`px-2 py-1 rounded text-xs border ${todaysDomainSet.has(d) ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" : "bg-zinc-800 border-zinc-700 text-zinc-500"}`}
                    >
                      {domainLabel(d)}
                    </span>
                  ))}
                </div>
                <div className="space-y-2">
                  {reflectionData.recent.slice(0, 8).map((r, i) => (
                    <div key={`${r.date}-${i}`} className="border border-zinc-800 rounded p-2">
                      <p className="text-xs text-zinc-500 mb-1">{r.date} · {domainLabel(r.domain)}</p>
                      {r.win && <p className="text-sm text-zinc-300">Win: {r.win}</p>}
                      {r.lesson && <p className="text-sm text-zinc-300">Lesson: {r.lesson}</p>}
                      {r.change && <p className="text-sm text-zinc-300">Change: {r.change}</p>}
                    </div>
                  ))}
                </div>
              </section>

              {reflectionData.patterns.length > 0 && (
                <section className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
                  <p className="text-xs text-zinc-500 uppercase mb-2">Recurring Lessons</p>
                  <div className="space-y-1">
                    {reflectionData.patterns.slice(0, 8).map((p) => (
                      <p key={p.lesson} className="text-sm text-zinc-300">{p.count}x - {p.lesson}</p>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
