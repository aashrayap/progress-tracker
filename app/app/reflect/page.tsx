"use client";

import { useEffect, useMemo, useState } from "react";

type TimeframeKey = "week" | "month";
type IdeaStatus = "inbox" | "archived";
type IdeaDomain = "app" | "health" | "life" | "system";

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

interface DeepWorkData {
  range: TimeframeWindow;
  stats: {
    totalMinutes: number;
    totalSessions: number;
    activeDays: number;
    avgSessionMin: number;
    avgActiveDayMin: number;
  };
  recent: {
    date: string;
    durationMin: number;
    topic: string;
    reflection: ReflectionEntry | null;
  }[];
}

interface ReflectInsightsData {
  range: TimeframeWindow;
  summary: {
    trackedDays: number;
    reflectionCount: number;
    deepWorkMinutes: number;
    deepWorkSessions: number;
    gymDoneDays: number;
    gymTrackedDays: number;
    sleepDoneDays: number;
    sleepTrackedDays: number;
    topDomain: { domain: string; count: number } | null;
  };
  insights: {
    type: "positive" | "warning" | "opportunity";
    title: string;
    message: string;
  }[];
}

interface Idea {
  id: number;
  createdAt: string;
  title: string;
  details: string;
  domain: IdeaDomain;
  status: IdeaStatus;
  source: string;
  captureId: string;
}

const TIMEFRAMES: { key: TimeframeKey; label: string }[] = [
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
];
const IDEA_STATUSES: IdeaStatus[] = ["inbox", "archived"];

function domainLabel(domain: string): string {
  if (domain === "deep_work") return "Deep Work";
  if (domain === "gym") return "Gym";
  if (domain === "eating") return "Eating";
  if (domain === "sleep") return "Sleep";
  if (domain === "addiction") return "Recovery";
  return domain;
}

function insightTone(type: "positive" | "warning" | "opportunity"): string {
  if (type === "positive") return "border-emerald-500/30 bg-emerald-500/5";
  if (type === "warning") return "border-amber-500/30 bg-amber-500/5";
  return "border-blue-500/30 bg-blue-500/5";
}

function insightTextTone(type: "positive" | "warning" | "opportunity"): string {
  if (type === "positive") return "text-emerald-300";
  if (type === "warning") return "text-amber-300";
  return "text-blue-300";
}

function mapReflectionDomainToIdeaDomain(domain: string): IdeaDomain {
  if (["gym", "eating", "sleep", "addiction"].includes(domain)) return "health";
  if (domain === "deep_work") return "life";
  return "system";
}

function ideaTitleFromReflection(reflection: ReflectionEntry): string {
  const raw = reflection.change || reflection.lesson || reflection.win;
  if (!raw.trim()) return `Follow-up: ${domainLabel(reflection.domain)}`;
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
  const [deepWorkData, setDeepWorkData] = useState<DeepWorkData | null>(null);
  const [insightsData, setInsightsData] = useState<ReflectInsightsData | null>(null);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionBusyKey, setActionBusyKey] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [promotedKeys, setPromotedKeys] = useState<Set<string>>(new Set());

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

    Promise.all([
      fetchJson<ReflectionData>(`/api/reflections${query}`),
      fetchJson<DeepWorkData>(`/api/deep-work${query}`),
      fetchJson<ReflectInsightsData>(`/api/reflect-insights${query}`),
      fetchJson<Idea[]>(`/api/ideas${query}`),
    ])
      .then(([r, d, i, a]) => {
        if (!active) return;
        setReflectionData(r);
        setDeepWorkData(d);
        setInsightsData(i);
        setIdeas(a);
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

  const actionsByStatus = useMemo(() => {
    const buckets: Record<IdeaStatus, Idea[]> = {
      inbox: [],
      archived: [],
    };
    for (const idea of ideas) {
      const status = idea.status === "archived" ? "archived" : "inbox";
      buckets[status].push(idea);
    }
    return buckets;
  }, [ideas]);

  const backlogActions = useMemo(
    () => ideas.filter((idea) => idea.status !== "archived"),
    [ideas]
  );

  const handlePromoteReflection = async (
    reflection: ReflectionEntry,
    promoteKey: string
  ) => {
    setActionBusyKey(promoteKey);
    setActionError(null);

    try {
      const title = ideaTitleFromReflection(reflection);
      const details = [
        `Source: reflection ${reflection.date} (${domainLabel(reflection.domain)})`,
        reflection.win ? `Win: ${reflection.win}` : "",
        reflection.lesson ? `Lesson: ${reflection.lesson}` : "",
        reflection.change ? `Change: ${reflection.change}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      const res = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          details,
          domain: mapReflectionDomainToIdeaDomain(reflection.domain),
          status: "inbox",
          source: "reflect",
          captureId: `${reflection.date}:${reflection.domain}`,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to promote reflection");
      }

      const createdIdea = (await res.json()) as Idea;
      setIdeas((prev) => {
        const exists = prev.some((row) => row.id === createdIdea.id);
        if (exists) {
          return prev.map((row) => (row.id === createdIdea.id ? createdIdea : row));
        }
        return [createdIdea, ...prev];
      });
      setPromotedKeys((prev) => {
        const next = new Set(prev);
        next.add(promoteKey);
        return next;
      });
    } catch (e) {
      console.error(e);
      setActionError("Could not create action from reflection.");
    } finally {
      setActionBusyKey(null);
    }
  };

  const handleIdeaStatusChange = async (idea: Idea, status: IdeaStatus) => {
    if (idea.status === status) return;

    const busyKey = `idea-${idea.id}`;
    setActionBusyKey(busyKey);
    setActionError(null);

    try {
      const res = await fetch("/api/ideas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: idea.id, status }),
      });

      if (!res.ok) {
        throw new Error("Failed to update action status");
      }

      setIdeas((prev) =>
        prev.map((row) => (row.id === idea.id ? { ...row, status } : row))
      );
    } catch (e) {
      console.error(e);
      setActionError("Could not update action status.");
    } finally {
      setActionBusyKey(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center">
        <span className="text-zinc-400">Loading...</span>
      </div>
    );
  }

  if (error || !reflectionData || !deepWorkData || !insightsData) {
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

          <section className="bg-zinc-900/60 backdrop-blur-md border border-blue-500/30 rounded-xl p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-zinc-400 uppercase">AI Timeframe Insight</p>
              <span className="text-xs text-blue-300">{insightsData.range.label}</span>
            </div>
            <p className="mt-2 text-sm text-zinc-300">
              {insightsData.summary.trackedDays} tracked days, {insightsData.summary.reflectionCount} reflections, {" "}
              {insightsData.summary.deepWorkMinutes} deep-work minutes.
            </p>
            <div className="mt-3 space-y-2">
              {insightsData.insights.map((insight, idx) => (
                <div
                  key={`${insight.title}-${idx}`}
                  className={`rounded border p-2 ${insightTone(insight.type)}`}
                >
                  <p className={`text-sm font-medium ${insightTextTone(insight.type)}`}>
                    {insight.title}
                  </p>
                  <p className="text-sm text-zinc-300">{insight.message}</p>
                </div>
              ))}
            </div>
          </section>

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
                  const promoted = promotedKeys.has(promoteKey);
                  const promoting = actionBusyKey === promoteKey;
                  return (
                    <div key={`${r.date}-${i}`} className="border border-white/10 rounded p-2">
                      <p className="text-xs text-zinc-400 mb-1">
                        {r.date} · {domainLabel(r.domain)}
                      </p>
                      {r.win && <p className="text-sm text-zinc-300">Win: {r.win}</p>}
                      {r.lesson && <p className="text-sm text-zinc-300">Lesson: {r.lesson}</p>}
                      {r.change && <p className="text-sm text-zinc-300">Change: {r.change}</p>}
                      <div className="mt-2">
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
                            ? "Added to Actions"
                            : promoting
                              ? "Adding..."
                              : "Promote to Action"}
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

          <section className="bg-zinc-900/60 backdrop-blur-md border border-white/10 rounded-xl p-3">
            <p className="text-xs text-zinc-400 uppercase">Actions</p>

            <div className="mt-2 flex flex-wrap gap-2">
              {IDEA_STATUSES.map((status) => (
                <span
                  key={status}
                  className="px-2 py-1 rounded text-xs border bg-zinc-800 border-white/20 text-zinc-300"
                >
                  {status}: {actionsByStatus[status].length}
                </span>
              ))}
            </div>

            {actionError && <p className="mt-2 text-xs text-red-400">{actionError}</p>}

            <div className="mt-3 space-y-2">
              {backlogActions.length === 0 && (
                <p className="text-sm text-zinc-600">No active actions in this timeframe.</p>
              )}
              {backlogActions.slice(0, 12).map((idea) => {
                const busyKey = `idea-${idea.id}`;
                const isBusy = actionBusyKey === busyKey;
                return (
                  <div key={idea.id} className="border border-white/10 rounded p-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-zinc-200 font-medium">{idea.title || "Untitled action"}</p>
                        {idea.details && <p className="text-xs text-zinc-400 mt-1 line-clamp-3">{idea.details}</p>}
                        <p className="text-xs text-zinc-400 mt-1">
                          {idea.domain} · {new Date(idea.createdAt).toLocaleDateString()} · {idea.source || "unknown"}
                        </p>
                      </div>
                      <button
                        disabled={isBusy}
                        onClick={() => handleIdeaStatusChange(idea, "archived")}
                        className={`shrink-0 px-2 py-1 rounded border text-xs transition-colors bg-zinc-800 border-white/20 text-zinc-300 hover:text-zinc-100 ${
                          isBusy ? "opacity-70" : ""
                        }`}
                      >
                        Archive
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="bg-zinc-900/60 backdrop-blur-md border border-white/10 rounded-xl p-3">
            <p className="text-xs text-zinc-400 uppercase mb-2">Deep Work</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="bg-zinc-800/50 border border-white/10 rounded p-2 text-center">
                <p className="text-[11px] text-zinc-400">Minutes</p>
                <p className="text-lg font-semibold">{deepWorkData.stats.totalMinutes}</p>
              </div>
              <div className="bg-zinc-800/50 border border-white/10 rounded p-2 text-center">
                <p className="text-[11px] text-zinc-400">Sessions</p>
                <p className="text-lg font-semibold">{deepWorkData.stats.totalSessions}</p>
              </div>
              <div className="bg-zinc-800/50 border border-white/10 rounded p-2 text-center">
                <p className="text-[11px] text-zinc-400">Active Days</p>
                <p className="text-lg font-semibold">{deepWorkData.stats.activeDays}</p>
              </div>
              <div className="bg-zinc-800/50 border border-white/10 rounded p-2 text-center">
                <p className="text-[11px] text-zinc-400">Avg / Session</p>
                <p className="text-lg font-semibold">{deepWorkData.stats.avgSessionMin}m</p>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-xs text-zinc-400 uppercase mb-2">Recent Sessions</p>
              <div className="space-y-2">
                {deepWorkData.recent.length === 0 && (
                  <p className="text-sm text-zinc-600">No sessions to show in this timeframe.</p>
                )}
                {deepWorkData.recent.slice(0, 10).map((s, i) => (
                  <div key={`${s.date}-${i}`} className="border border-white/10 rounded p-2">
                    <p className="text-xs text-zinc-400 mb-1">
                      {s.date} · {s.durationMin}m
                    </p>
                    <p className="text-sm text-zinc-300">{s.topic || "No topic"}</p>
                    {s.reflection?.lesson && (
                      <p className="text-xs text-zinc-400 mt-1">
                        Reflection: {s.reflection.lesson}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
