"use client";

import { useEffect, useState } from "react";

interface ReflectionEntry {
  date: string;
  domain: string;
  win: string;
  lesson: string;
  change: string;
}

interface WorkData {
  today: ReflectionEntry[];
  week: { count: number; deepWorkDays: number };
  yesterdayChanges: ReflectionEntry[];
  recent: ReflectionEntry[];
  patterns: { lesson: string; count: number }[];
}

const DOMAIN_COLORS: Record<string, string> = {
  gym: "text-emerald-400",
  deep_work: "text-indigo-400",
  addiction: "text-amber-400",
  eating: "text-teal-400",
  sleep: "text-blue-400",
};

const DOMAIN_LABELS: Record<string, string> = {
  gym: "Gym",
  deep_work: "Deep Work",
  addiction: "Recovery",
  eating: "Nutrition",
  sleep: "Sleep",
};

function domainColor(domain: string): string {
  return DOMAIN_COLORS[domain] || "text-zinc-400";
}

function domainLabel(domain: string): string {
  return DOMAIN_LABELS[domain] || domain;
}

export default function WorkPage() {
  const [data, setData] = useState<WorkData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/work")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
        <span className="text-zinc-500">Loading...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 pb-24">
        <p className="text-zinc-500">Failed to load data.</p>
      </div>
    );
  }

  // Group today's reflections by domain
  const todayByDomain: Record<string, ReflectionEntry[]> = {};
  for (const r of data.today) {
    if (!todayByDomain[r.domain]) todayByDomain[r.domain] = [];
    todayByDomain[r.domain].push(r);
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="p-4 sm:p-6 pb-24">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-bold mb-4">Reflections</h1>

          {/* Weekly stats */}
          <div className="grid grid-cols-2 gap-2 mb-5">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-center">
              <p className="text-xs text-zinc-500 mb-1">This Week</p>
              <p className="text-2xl font-bold text-indigo-400">{data.week.count}</p>
              <p className="text-[10px] text-zinc-600">reflections</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-center">
              <p className="text-xs text-zinc-500 mb-1">Deep Work</p>
              <p className="text-2xl font-bold text-indigo-400">{data.week.deepWorkDays}/7</p>
              <p className="text-[10px] text-zinc-600">days this week</p>
            </div>
          </div>

          {/* Morning priming — yesterday's changes */}
          {data.yesterdayChanges.length > 0 && (
            <section className="mb-5">
              <h2 className="text-xs text-zinc-500 uppercase tracking-wide mb-2">
                Morning Priming
              </h2>
              <div className="bg-zinc-900 border border-amber-500/30 rounded-lg p-3">
                <p className="text-[10px] text-zinc-600 mb-2">
                  Yesterday you said you&apos;d change:
                </p>
                <div className="space-y-1.5">
                  {data.yesterdayChanges.map((r, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <span className="text-amber-400 mt-0.5 shrink-0">▸</span>
                      <div>
                        <span className="text-zinc-200">{r.change}</span>
                        <span className={`ml-1.5 ${domainColor(r.domain)}`}>
                          {domainLabel(r.domain)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Today's reflections grouped by domain */}
          <section className="mb-5">
            <h2 className="text-xs text-zinc-500 uppercase tracking-wide mb-2">Today</h2>
            {data.today.length === 0 ? (
              <p className="text-sm text-zinc-600">No reflections yet today.</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(todayByDomain).map(([domain, entries]) => (
                  <div
                    key={domain}
                    className="bg-zinc-900 border border-zinc-800 rounded-lg p-3"
                  >
                    <p className={`text-xs font-medium mb-2 ${domainColor(domain)}`}>
                      {domainLabel(domain)}
                    </p>
                    <div className="space-y-2">
                      {entries.map((r, i) => (
                        <div key={i} className="space-y-1">
                          {r.win && (
                            <p className="text-xs text-zinc-300">
                              <span className="text-emerald-400">Win:</span> {r.win}
                            </p>
                          )}
                          {r.lesson && (
                            <p className="text-xs text-zinc-300">
                              <span className="text-blue-400">Lesson:</span> {r.lesson}
                            </p>
                          )}
                          {r.change && (
                            <p className="text-xs text-zinc-300">
                              <span className="text-amber-400">Change:</span> {r.change}
                            </p>
                          )}
                          {i < entries.length - 1 && (
                            <div className="border-t border-zinc-800 mt-2 pt-1" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Recurring patterns */}
          {data.patterns.length > 0 && (
            <section className="mb-5">
              <h2 className="text-xs text-zinc-500 uppercase tracking-wide mb-2">
                Recurring Patterns
              </h2>
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
                <div className="space-y-1.5">
                  {data.patterns.slice(0, 10).map((p, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <span className="text-indigo-400 shrink-0">{p.count}x</span>
                      <span className="text-zinc-300">{p.lesson}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Recent reflections */}
          <section className="mb-5">
            <h2 className="text-xs text-zinc-500 uppercase tracking-wide mb-2">
              Recent
            </h2>
            {data.recent.length === 0 ? (
              <p className="text-sm text-zinc-600">No reflections logged yet.</p>
            ) : (
              <div className="space-y-2">
                {data.recent.map((r, i) => (
                  <div
                    key={i}
                    className="bg-zinc-900 border border-zinc-800 rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-xs font-medium ${domainColor(r.domain)}`}>
                        {domainLabel(r.domain)}
                      </span>
                      <span className="text-[10px] text-zinc-600">{r.date}</span>
                    </div>
                    {r.win && (
                      <p className="text-xs text-zinc-300">
                        <span className="text-emerald-400">Win:</span> {r.win}
                      </p>
                    )}
                    {r.lesson && (
                      <p className="text-xs text-zinc-300 mt-0.5">
                        <span className="text-blue-400">Lesson:</span> {r.lesson}
                      </p>
                    )}
                    {r.change && (
                      <p className="text-xs text-zinc-300 mt-0.5">
                        <span className="text-amber-400">Change:</span> {r.change}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
