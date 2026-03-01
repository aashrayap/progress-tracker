"use client";

import { useEffect, useMemo, useState } from "react";

type TimeframeKey = "week" | "month";

interface ReflectionEntry {
  date: string;
  domain: string;
  win: string;
  lesson: string;
  change: string;
}

interface TimeframeWindow {
  key: TimeframeKey;
  label: string;
  startDate: string;
  endDate: string;
}

interface ReflectionData {
  range: TimeframeWindow;
  total: number;
  today: ReflectionEntry[];
  byDomain: { domain: string; count: number }[];
  yesterdayChanges: ReflectionEntry[];
  recent: ReflectionEntry[];
  patterns: { lesson: string; count: number }[];
}

const TIMEFRAMES: { key: TimeframeKey; label: string }[] = [
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
];

function domainLabel(domain: string): string {
  if (domain === "deep_work") return "Deep Work";
  if (domain === "gym") return "Gym";
  if (domain === "eating") return "Eating";
  if (domain === "sleep") return "Sleep";
  if (domain === "addiction") return "Recovery";
  return domain;
}

function todoTitleFromReflection(reflection: ReflectionEntry): string {
  const raw = reflection.change || reflection.lesson || reflection.win;
  if (!raw.trim()) return `Follow up: ${domainLabel(reflection.domain)}`;
  const trimmed = raw.trim();
  return trimmed.length <= 90 ? trimmed : `${trimmed.slice(0, 87)}...`;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Request failed: ${url}`);
  }
  return res.json();
}

export default function ReflectPage() {
  const [timeframe, setTimeframe] = useState<TimeframeKey>("week");
  const [reflectionData, setReflectionData] = useState<ReflectionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionBusyKey, setActionBusyKey] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [promotedKeys, setPromotedKeys] = useState<Set<string>>(new Set());
  const [archiveBusyKey, setArchiveBusyKey] = useState<string | null>(null);
  const [archivedKeys, setArchivedKeys] = useState<Set<string>>(new Set());

  const handleTimeframeChange = (next: TimeframeKey) => {
    if (next === timeframe) return;
    setLoading(true);
    setError(null);
    setActionError(null);
    setPromotedKeys(new Set());
    setTimeframe(next);
  };

  useEffect(() => {
    let active = true;
    const query = `?range=${timeframe}`;

    fetchJson<ReflectionData>(`/api/reflections${query}`)
      .then((r) => {
        if (!active) return;
        setReflectionData(r);
      })
      .catch((e: unknown) => {
        if (!active) return;
        const message = e instanceof Error ? e.message : "Failed to load reflect data";
        setError(message);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [timeframe]);

  const todaysDomainSet = useMemo(() => {
    return new Set((reflectionData?.today || []).map((r) => r.domain));
  }, [reflectionData]);

  const domainCountMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of reflectionData?.byDomain || []) {
      map.set(d.domain, d.count);
    }
    return map;
  }, [reflectionData]);

  const visibleDomains = useMemo(() => {
    const present = (reflectionData?.byDomain || [])
      .map((entry) => entry.domain)
      .filter((domain) => domain !== "gym" && domain !== "sleep");
    return present.length > 0 ? present : ["deep_work", "eating", "addiction"];
  }, [reflectionData]);

  const handlePromoteReflection = async (
    reflection: ReflectionEntry,
    promoteKey: string
  ) => {
    setActionBusyKey(promoteKey);
    setActionError(null);

    try {
      const item = todoTitleFromReflection(reflection);
      const res = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create todo");
      }

      await res.json();
      setPromotedKeys((prev) => {
        const next = new Set(prev);
        next.add(promoteKey);
        return next;
      });
    } catch (e) {
      console.error(e);
      setActionError("Could not add todo from reflection.");
    } finally {
      setActionBusyKey(null);
    }
  };

  const handleArchive = async (
    reflection: ReflectionEntry,
    archiveKey: string,
    indexInDomain: number
  ) => {
    setArchiveBusyKey(archiveKey);
    setActionError(null);

    try {
      const res = await fetch("/api/reflections", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: reflection.date,
          domain: reflection.domain,
          index: indexInDomain,
        }),
      });

      if (!res.ok) throw new Error("Failed to archive");

      setArchivedKeys((prev) => {
        const next = new Set(prev);
        next.add(archiveKey);
        return next;
      });
    } catch (e) {
      console.error(e);
      setActionError("Could not archive reflection.");
    } finally {
      setArchiveBusyKey(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center">
        <span className="text-zinc-400">Loading...</span>
      </div>
    );
  }

  if (error || !reflectionData) {
    return (
      <div className="min-h-screen bg-black text-zinc-100 p-4">
        <p className="text-zinc-400">{error || "Failed to load reflection dashboard."}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <div className="p-4 sm:p-6 pb-24">
        <div className="max-w-3xl mx-auto space-y-5">
          <header className="space-y-3">
            <h1 className="text-2xl font-bold">Reflect</h1>
            <section className="bg-zinc-900/60 backdrop-blur-md border border-white/10 rounded-xl p-3">
              <p className="text-xs text-zinc-400 uppercase mb-2">Timeline</p>
              <div className="flex gap-2">
                {TIMEFRAMES.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => handleTimeframeChange(t.key)}
                    className={`px-3 py-1.5 rounded text-sm border transition-colors ${
                      timeframe === t.key
                        ? "bg-zinc-800 border-white/20 text-zinc-100"
                        : "bg-zinc-900/60 backdrop-blur-md border-white/10 text-zinc-400 hover:text-zinc-300"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-zinc-400">
                {reflectionData.range.startDate} to {reflectionData.range.endDate}
              </p>
            </section>
          </header>

          <section className="bg-zinc-900/60 backdrop-blur-md border border-white/10 rounded-xl p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-zinc-400 uppercase">Reflections</p>
              <span className="text-xs text-zinc-400">{reflectionData.total} entries</span>
            </div>
            <p className="mt-2 text-sm text-zinc-300">By Domain</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {visibleDomains.map((d) => {
                const count = domainCountMap.get(d) || 0;
                const isToday = todaysDomainSet.has(d);
                return (
                  <span
                    key={d}
                    className={`px-2 py-1 rounded text-xs border ${
                      isToday
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                        : "bg-zinc-800 border-white/20 text-zinc-300"
                    }`}
                  >
                    {domainLabel(d)}: {count}
                  </span>
                );
              })}
            </div>

            {actionError && <p className="mt-3 text-xs text-red-400">{actionError}</p>}

            {reflectionData.yesterdayChanges.length > 0 && (
              <div className="mt-4 border border-amber-500/20 rounded p-2">
                <p className="text-xs text-zinc-400 uppercase mb-1">Yesterday&apos;s Changes</p>
                <div className="space-y-1">
                  {reflectionData.yesterdayChanges.map((r, idx) => (
                    <p key={`${r.domain}-${idx}`} className="text-sm text-zinc-300">
                      - {r.change} <span className="text-zinc-400">({domainLabel(r.domain)})</span>
                    </p>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4">
              <p className="text-xs text-zinc-400 uppercase mb-2">Recent in Range</p>
              <div className="space-y-2">
                {reflectionData.recent.length === 0 && (
                  <p className="text-sm text-zinc-600">No reflections in this timeframe.</p>
                )}
                {reflectionData.recent.slice(0, 10).map((r, i) => {
                  const promoteKey = `${r.date}:${r.domain}:${i}`;
                  const archiveKey = `archive:${r.date}:${r.domain}:${i}`;
                  const promoted = promotedKeys.has(promoteKey);
                  const promoting = actionBusyKey === promoteKey;
                  const archived = archivedKeys.has(archiveKey);
                  const archiving = archiveBusyKey === archiveKey;
                  if (archived) return null;
                  const domainIndex = reflectionData.recent
                    .slice(0, 10)
                    .filter((x, j) => j < i && x.date === r.date && x.domain === r.domain)
                    .length;
                  return (
                    <div key={`${r.date}-${i}`} className="border border-white/10 rounded p-2">
                      <p className="text-xs text-zinc-400 mb-1">
                        {r.date} · {domainLabel(r.domain)}
                      </p>
                      {r.win && <p className="text-sm text-zinc-300">Win: {r.win}</p>}
                      {r.lesson && <p className="text-sm text-zinc-300">Lesson: {r.lesson}</p>}
                      {r.change && <p className="text-sm text-zinc-300">Change: {r.change}</p>}
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => handlePromoteReflection(r, promoteKey)}
                          disabled={promoting || promoted}
                          className={`px-2 py-1 text-xs rounded border transition-colors ${
                            promoted
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                              : "bg-zinc-800 border-white/20 text-zinc-300 hover:text-zinc-100"
                          } ${promoting ? "opacity-70" : ""}`}
                        >
                          {promoted
                            ? "Added to Todos"
                            : promoting
                              ? "Adding..."
                              : "Add to Todos"}
                        </button>
                        <button
                          onClick={() => handleArchive(r, archiveKey, domainIndex)}
                          disabled={archiving}
                          className={`px-2 py-1 text-xs rounded border transition-colors bg-zinc-800 border-white/20 text-zinc-400 hover:text-red-300 hover:border-red-500/30 ${archiving ? "opacity-70" : ""}`}
                        >
                          {archiving ? "Archiving..." : "Archive"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {reflectionData.patterns.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-zinc-400 uppercase mb-1">Recurring Lessons</p>
                <div className="space-y-1">
                  {reflectionData.patterns.slice(0, 8).map((p) => (
                    <p key={p.lesson} className="text-sm text-zinc-300">
                      {p.count}x - {p.lesson}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
