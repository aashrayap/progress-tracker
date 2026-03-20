"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { VisionData, VisionDomain, Distractions, InputControl, HabitAudit, RitualBlueprint } from "../lib/types";
import LineTrendChart from "../components/LineTrendChart";
import TrendModal from "../components/TrendModal";
import HabitTooltip from "../components/HabitTooltip";
import HabitLogHistory, { type HabitLogEntry } from "../components/HabitLogHistory";
import { HABIT_CONFIG } from "../lib/config";
import BriefingCard from "../components/BriefingCard";
import ExperimentsTable from "../components/ExperimentsTable";
import PlanCard from "../components/PlanCard";

// ── Hub data types (mirrored from page.tsx) ──────────────────────────

interface DopamineDay {
  date: string;
  weed: boolean | null;
  lol: boolean | null;
  poker: boolean | null;
  clarity: boolean | null;
  gym: boolean | null;
  sleep: boolean | null;
  meditate: boolean | null;
  deepWork: boolean | null;
  ateClean: boolean | null;
  visionReviewed: boolean | null;
}

interface IntentionSummary {
  date: string;
  domain: string;
  mantra: string;
}

interface CheckinStatus {
  daily: { done: boolean; streak: number };
  weekly: { done: boolean; lastDate: string | null };
  monthly: { done: boolean; lastDate: string | null };
}

interface DailyQuote {
  text: string;
  author: string;
  source: string;
}

interface BriefingData {
  state: "momentum" | "recovery" | "neutral" | "danger" | "explore" | "disruption";
  insight: string;
  priorities: string[];
  quote: { text: string; author: string };
  generated_at: string;
  input_hash: string;
  verified: boolean;
  planInsight?: string;
}

interface HubData {
  briefing: BriefingData | null;
  checkinStatus: CheckinStatus;
  nowWindow: "morning" | "day" | "evening";
  dopamineReset: {
    startDate: string;
    dayNumber: number;
    days: number;
    log: DopamineDay[];
    streaks: { lol: number; weed: number; poker: number; clarity: number };
  };
  todaysPlan: { date: string; start: number; end: number; item: string; done: string; notes: string }[];
  habitTracker: {
    dates: string[];
    days: Record<string, boolean>[];
  };
  habitTrends: Record<string, { date: string; value: boolean | null }[]>;
  habitLogs: Record<string, HabitLogEntry[]>;
  dailyIntention: IntentionSummary | null;
  weeklyIntention: IntentionSummary | null;
  dailyQuote: DailyQuote | null;
  insight: {
    insight: { streak: string; warning: string | null; momentum: string };
  };
  experiments: {
    current: { name: string; dayCount: number; durationDays: number; domain: string; isExpired: boolean }[];
    past: { name: string; verdict: string; reflection: string; startDate: string }[];
  };
}

// ── Habit grid constants ─────────────────────────────────────────────

const HABIT_ORDER = [
  "sleep",
  "gym",
  "weed",
  "ate_clean",
  "deep_work",
  "meditate",
  "lol",
  "poker",
  "clarity",
  "vision_reviewed",
] as const;
type HabitKey = keyof typeof HABIT_CONFIG;
type ActiveKey = HabitKey | "score";

function computeDayScore(entry: DopamineDay | undefined, isToday: boolean): { score: number | null; color: string } {
  if (!entry) {
    return isToday ? { score: null, color: "bg-zinc-800" } : { score: 0, color: "bg-red-500" };
  }
  if (isToday) {
    const all = [entry.weed, entry.lol, entry.poker, entry.clarity, entry.gym, entry.sleep, entry.meditate, entry.deepWork, entry.ateClean];
    if (!all.every((v) => v !== null)) return { score: null, color: "bg-zinc-800" };
  }
  const weed = entry.weed ?? false;
  if (!weed) return { score: 0, color: "bg-red-500" };
  const habitScore = [entry.gym, entry.sleep, entry.meditate, entry.deepWork, entry.ateClean].filter(Boolean).length;
  const viceScore = [entry.lol, entry.poker, entry.clarity].reduce((s, v) => s + (v === true ? 1 : -1), 0);
  const score = Math.max(0, habitScore + viceScore);
  if (score <= 2) return { score, color: "bg-red-500" };
  if (score <= 4) return { score, color: "bg-orange-500" };
  if (score <= 6) return { score, color: "bg-lime-500" };
  return { score, color: "bg-emerald-400" };
}

// ── Review signal types ──────────────────────────────────────────────

type RitualTab = "morning" | "midday" | "evening";
const RITUAL_TABS: RitualTab[] = ["morning", "midday", "evening"];
const RITUAL_CONTEXT: Record<RitualTab, string> = {
  morning: "morning",
  midday: "afternoon",
  evening: "evening",
};

// ── Collapsible section ──────────────────────────────────────────────

function CollapsibleSection({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-zinc-900/60 backdrop-blur-md border border-white/10 rounded-xl">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 cursor-pointer"
      >
        <span className="text-xs text-zinc-400 uppercase tracking-wide font-medium">{title}</span>
        <span className="text-zinc-500 text-sm">{open ? "\u25BC" : "\u25B6"}</span>
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

// ── Chip ─────────────────────────────────────────────────────────────

function Chip({ label, variant }: { label: string; variant: "use" | "forbid" }) {
  const cls = variant === "use"
    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
    : "bg-red-500/15 text-red-400 border-red-500/30";
  return (
    <span className={`inline-block text-xs px-2 py-0.5 rounded-full border ${cls}`}>
      {label}
    </span>
  );
}

// ── Page ─────────────────────────────────────────────────────────────

export default function VisionPage() {
  const [vision, setVision] = useState<VisionData | null>(null);
  const [hub, setHub] = useState<HubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [ritualTab, setRitualTab] = useState<RitualTab>(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "morning";
    if (hour < 17) return "midday";
    return "evening";
  });
  const [reviewChecked, setReviewChecked] = useState<Record<string, boolean>>({ morning: false, afternoon: false, evening: false });
  const [activeHabitKey, setActiveHabitKey] = useState<ActiveKey | null>(null);
  const [hoveredCol, setHoveredCol] = useState<number | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const today = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  const fetchAll = useCallback(() => {
    Promise.all([
      fetch("/api/vision").then((r) => r.ok ? r.json() : null),
      fetch("/api/hub").then((r) => r.ok ? r.json() : null),
      fetch(`/api/daily-signals?signal=vision_reviewed&start=${today}&end=${today}`).then((r) => r.ok ? r.json() : []),
    ]).then(([visionData, hubData, signals]) => {
      setVision(visionData);
      setHub(hubData);
      // Pre-fill review checkboxes from today's signals
      const checked: Record<string, boolean> = { morning: false, afternoon: false, evening: false };
      if (Array.isArray(signals)) {
        for (const s of signals) {
          if (s.signal === "vision_reviewed" && s.value === "1" && s.date === today) {
            if (s.context === "morning" || s.context === "afternoon" || s.context === "evening") {
              checked[s.context] = true;
            }
          }
        }
      }
      setReviewChecked(checked);
      setLoading(false);
    }).catch((err) => {
      console.error("Failed to load vision data:", err);
      setLoading(false);
    });
  }, [today]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleReview = useCallback(async (context: string) => {
    if (reviewChecked[context]) return;
    setReviewChecked((prev) => ({ ...prev, [context]: true }));
    try {
      await fetch("/api/daily-signals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entries: [{
            date: today,
            signal: "vision_reviewed",
            value: "1",
            unit: "",
            context,
            source: "app",
            captureId: "",
            category: "personal_growth",
          }],
        }),
      });
    } catch (err) {
      console.error("Failed to log vision review:", err);
      setReviewChecked((prev) => ({ ...prev, [context]: false }));
    }
  }, [reviewChecked, today]);

  // ── Habit trend computations (mirrored from Hub) ───────────────────

  const isScoreActive = activeHabitKey === "score";

  const activeHabitTrendSeries = useMemo(() => {
    if (!hub || !activeHabitKey || isScoreActive) return [];
    return hub.habitTrends[activeHabitKey] || [];
  }, [activeHabitKey, isScoreActive, hub]);

  const scoreTrendPoints = useMemo(() => {
    if (!hub || !isScoreActive) return [];
    const { startDate, log } = hub.dopamineReset;
    const [year, month, day] = startDate.split("-").map(Number);
    const resetDay = Math.max(1, Math.min(hub.dopamineReset.dayNumber, hub.dopamineReset.days));
    return Array.from({ length: resetDay }, (_, i) => {
      const d = new Date(year, month - 1, day + i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const entry = log.find((l) => l.date === dateStr);
      const { score } = computeDayScore(entry, i + 1 === resetDay);
      return { date: dateStr, value: score };
    });
  }, [hub, isScoreActive]);

  const activeHabitTrendPoints = useMemo(() => {
    if (isScoreActive) {
      return scoreTrendPoints.map((entry, index) => {
        const windowStart = Math.max(0, index - 6);
        const window = scoreTrendPoints.slice(windowStart, index + 1).filter((p) => p.value !== null);
        if (window.length === 0) return { date: entry.date, value: null };
        const avg = window.reduce((s, p) => s + p.value!, 0) / window.length;
        return { date: entry.date, value: Number(((avg / 8) * 100).toFixed(1)) };
      });
    }
    return activeHabitTrendSeries.map((entry, index) => {
      const windowStart = Math.max(0, index - 6);
      const window = activeHabitTrendSeries
        .slice(windowStart, index + 1)
        .filter((point) => point.value !== null);
      if (window.length === 0) return { date: entry.date, value: null };
      const done = window.filter((point) => point.value === true).length;
      return { date: entry.date, value: Number(((done / window.length) * 100).toFixed(1)) };
    });
  }, [isScoreActive, scoreTrendPoints, activeHabitTrendSeries]);

  const activeHabitSummary = useMemo(() => {
    if (!activeHabitKey) return null;
    if (isScoreActive) {
      const logged = scoreTrendPoints.filter((p) => p.value !== null);
      if (logged.length === 0) return null;
      const avg = logged.reduce((s, p) => s + p.value!, 0) / logged.length;
      const recent = scoreTrendPoints.slice(-14).filter((p) => p.value !== null);
      const recentAvg = recent.length === 0 ? 0 : recent.reduce((s, p) => s + p.value!, 0) / recent.length;
      let currentStreak = 0;
      for (let i = scoreTrendPoints.length - 1; i >= 0; i--) {
        if (scoreTrendPoints[i].value !== null && scoreTrendPoints[i].value! >= 5) currentStreak++;
        else break;
      }
      return { loggedDays: logged.length, adherence: Math.round((avg / 8) * 100), recentAdherence: Math.round((recentAvg / 8) * 100), currentStreak };
    }
    if (activeHabitTrendSeries.length === 0) return null;
    const loggedDays = activeHabitTrendSeries.filter((point) => point.value !== null).length;
    const doneDays = activeHabitTrendSeries.filter((point) => point.value === true).length;
    const adherence = loggedDays === 0 ? 0 : Math.round((doneDays / loggedDays) * 100);
    const recent = activeHabitTrendSeries.slice(-14).filter((point) => point.value !== null);
    const recentDone = recent.filter((point) => point.value === true).length;
    const recentAdherence = recent.length === 0 ? 0 : Math.round((recentDone / recent.length) * 100);
    let currentStreak = 0;
    for (let i = activeHabitTrendSeries.length - 1; i >= 0; i--) {
      const value = activeHabitTrendSeries[i].value;
      if (value === true) { currentStreak++; continue; }
      if (value === null) continue;
      break;
    }
    return { loggedDays, adherence, recentAdherence, currentStreak };
  }, [activeHabitKey, isScoreActive, scoreTrendPoints, activeHabitTrendSeries]);

  // ── Loading / error states ─────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center">
        <p className="text-zinc-400">Loading...</p>
      </div>
    );
  }

  if (!vision) {
    return (
      <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center">
        <p className="text-red-400">Failed to load vision data</p>
      </div>
    );
  }

  const resetDay = hub ? Math.max(1, Math.min(hub.dopamineReset.dayNumber, hub.dopamineReset.days)) : 0;
  const currentRitual: RitualBlueprint[RitualTab] = vision.ritualBlueprint[ritualTab];
  const reviewContext = RITUAL_CONTEXT[ritualTab];

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <div className="p-4 sm:p-6 pb-24">
        <div className="max-w-5xl mx-auto space-y-5">

          {/* ═══════════════════════════════════════════════════════════
              ZONE 1: Daily Read (fits in ~1 viewport)
              ═══════════════════════════════════════════════════════ */}

          {/* ── 1. Identity Script (trimmed) ───────────────────────── */}
          <section className="p-4 bg-zinc-900/60 backdrop-blur-md border border-white/10 rounded-xl space-y-4">
            <h2 className="text-xs text-zinc-400 uppercase tracking-wide font-medium">Identity Script</h2>

            <IdentityField label="Core Traits" value={vision.identityScript.coreTraits} />
            <IdentityField label="Non-Negotiables" value={vision.identityScript.nonNegotiables} />

            {/* Language Rules */}
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1.5">Language</p>
              {vision.identityScript.languageRules.use.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-1.5">
                  {vision.identityScript.languageRules.use.map((w, i) => (
                    <Chip key={`use-${i}`} label={w} variant="use" />
                  ))}
                </div>
              )}
              {vision.identityScript.languageRules.forbid.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {vision.identityScript.languageRules.forbid.map((w, i) => (
                    <Chip key={`forbid-${i}`} label={w} variant="forbid" />
                  ))}
                </div>
              )}
              {vision.identityScript.languageRules.use.length === 0 && vision.identityScript.languageRules.forbid.length === 0 && (
                <p className="text-xs text-zinc-600 italic">Not set</p>
              )}
            </div>
          </section>

          {/* ── 2. Anti-Vision (always visible) ────────────────────── */}
          <section className="p-4 bg-zinc-900/60 backdrop-blur-md border border-white/10 border-l-2 border-l-red-500/30 rounded-xl">
            <h2 className="text-xs text-zinc-400 uppercase tracking-wide font-medium mb-3">Anti-Vision</h2>
            {vision.antiVision ? (
              <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">{vision.antiVision}</p>
            ) : (
              <p className="text-xs text-zinc-600 italic">Not set</p>
            )}
          </section>

          {/* ── 3. Intentions + Briefing (side by side) ────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Left: Intentions */}
            {hub && (() => {
              const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
              const weekly = hub.weeklyIntention && hub.weeklyIntention.date >= sevenDaysAgo ? hub.weeklyIntention : null;
              const daily = hub.dailyIntention && hub.dailyIntention.date === today ? hub.dailyIntention : null;
              return (
                <div className="px-4 py-3 bg-zinc-900/60 backdrop-blur-md border border-white/10 rounded-xl space-y-1">
                  <p className="text-sm text-zinc-400">This week: {weekly ? <span className="text-zinc-200">{weekly.mantra}</span> : <span className="text-zinc-500">not set</span>}</p>
                  <p className="text-sm text-zinc-400">Today: {daily ? <span className="text-zinc-200">{daily.mantra}</span> : <span className="text-zinc-500">not set</span>}</p>
                </div>
              );
            })()}
            {/* Right: Briefing */}
            {hub && (
              <BriefingCard
                briefing={hub.briefing}
                fallbackInsight={hub.insight.insight}
                fallbackQuote={hub.dailyQuote}
              />
            )}
          </div>

          {/* ── 4. Ritual Checklist + Today's Plan (side by side) ─── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Left: Ritual Blueprint (auto-detected phase) */}
            <section className="bg-zinc-900/60 backdrop-blur-md border border-white/10 rounded-xl">
              <div className="p-4 pb-0">
                <h2 className="text-xs text-zinc-400 uppercase tracking-wide font-medium mb-3">Ritual Blueprint</h2>
                <div className="flex gap-3">
                  {RITUAL_TABS.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setRitualTab(tab)}
                      className={`text-xs cursor-pointer pb-1.5 capitalize ${
                        ritualTab === tab
                          ? "text-zinc-100 border-b border-zinc-100"
                          : "text-zinc-500"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-4 space-y-3">
                {currentRitual.steps.length > 0 ? (
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1.5">Steps</p>
                    <ol className="space-y-1">
                      {currentRitual.steps.map((step, i) => (
                        <li key={i} className="text-sm text-zinc-300 flex gap-2">
                          <span className="text-zinc-600 shrink-0">{i + 1}.</span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-600 italic">No steps defined</p>
                )}

                {currentRitual.habitStacks.length > 0 && (
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1.5">Habit Stacks</p>
                    <ul className="space-y-1">
                      {currentRitual.habitStacks.map((stack, i) => (
                        <li key={i} className="text-sm text-zinc-300 flex gap-2">
                          <span className="text-zinc-600">-</span>
                          {stack}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Review checkbox */}
                <div className="pt-2 border-t border-white/5">
                  <label className={`flex items-center gap-2 ${reviewChecked[reviewContext] ? "opacity-60" : "cursor-pointer"}`}>
                    <input
                      type="checkbox"
                      checked={reviewChecked[reviewContext]}
                      disabled={reviewChecked[reviewContext]}
                      onChange={() => handleReview(reviewContext)}
                      className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-emerald-500 focus:ring-0 focus:ring-offset-0 accent-emerald-500"
                    />
                    <span className="text-sm text-zinc-300 capitalize">
                      {ritualTab} review complete
                    </span>
                  </label>
                </div>
              </div>
            </section>

            {/* Right: Today's Plan */}
            {hub && (
              <PlanCard
                plan={hub.todaysPlan}
                planInsight={hub.briefing?.planInsight}
                onRefresh={fetchAll}
              />
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════════
              ZONE SEPARATOR
              ═══════════════════════════════════════════════════════ */}
          <div className="flex items-center gap-3 py-2">
            <div className="flex-1 border-t border-white/10" />
            <span className="text-xs text-zinc-600 uppercase tracking-wide">Weekly / Monthly Review</span>
            <div className="flex-1 border-t border-white/10" />
          </div>

          {/* ═══════════════════════════════════════════════════════════
              ZONE 2: Deep Review (all collapsed by default)
              ═══════════════════════════════════════════════════════ */}

          {/* ── 5. North Star (collapsed) ──────────────────────────── */}
          <CollapsibleSection title="North Star">
            <div className="space-y-3">
              {vision.domains.map((domain) => (
                <NorthStarCard key={domain.id} domain={domain} />
              ))}
            </div>
          </CollapsibleSection>

          {/* ── 6. Habit Grid (collapsed) ──────────────────────────── */}
          {hub && (
            <CollapsibleSection title="Daily Habits — 28 Days">
              <div>
                <div className="flex items-center justify-end mb-2">
                  <span className="text-xs text-zinc-600">Day {resetDay}/90</span>
                </div>
                {(() => {
                  const dates = hub.habitTracker.dates;
                  const weeks: number[][] = [];
                  let currentWeek: number[] = [];
                  for (let i = 0; i < dates.length; i++) {
                    const [y, m, d] = dates[i].split("-").map(Number);
                    const dow = new Date(y, m - 1, d).getDay();
                    currentWeek.push(i);
                    if (dow === 0 || i === dates.length - 1) {
                      weeks.push(currentWeek);
                      currentWeek = [];
                    }
                  }
                  const CELL = 28;
                  const GAP = 4;
                  const fullWeekWidth = 7 * CELL + 6 * GAP;
                  const fmtDate = (d: string) => {
                    const [y, m, day] = d.split("-").map(Number);
                    return new Date(y, m - 1, day).toLocaleDateString("en-US", { month: "short", day: "numeric" });
                  };
                  const weekCells = (indices: number[], weekIndex: number, renderCell: (i: number) => React.ReactNode) => (
                    <div key={weekIndex} className="flex gap-1" style={{ width: `${fullWeekWidth}px` }}>{indices.map(renderCell)}</div>
                  );
                  return (
                    <div
                      ref={gridRef}
                      className="relative space-y-2.5"
                      onMouseLeave={() => setHoveredCol(null)}
                    >
                      {hoveredCol !== null && dates[hoveredCol] && (() => {
                        const entry = hub.dopamineReset.log.find((l) => l.date === dates[hoveredCol]);
                        const isToday = hoveredCol === dates.length - 1;
                        const { score } = computeDayScore(entry, isToday);
                        return (
                          <HabitTooltip
                            dateStr={dates[hoveredCol]}
                            columnIndex={hoveredCol}
                            gridRef={gridRef}
                            score={score}
                          />
                        );
                      })()}
                      {/* Date labels */}
                      <div className="flex items-center gap-2.5">
                        <span className="w-[4.5rem] shrink-0" />
                        <div className="flex gap-3">
                          {weeks.map((wk, wi) => (
                            <div key={wi} style={{ width: `${fullWeekWidth}px` }}>
                              <span className="text-[10px] text-zinc-600">{fmtDate(dates[wk[0]])}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* Score row */}
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs text-zinc-300 w-[4.5rem] shrink-0 text-right font-medium">Score</span>
                        <div className="flex gap-3">
                          {weeks.map((wk, wi) => weekCells(wk, wi, (i) => {
                            const dateStr = dates[i];
                            const entry = hub.dopamineReset.log.find((l) => l.date === dateStr);
                            const isToday = i === dates.length - 1;
                            const { score, color } = computeDayScore(entry, isToday);
                            return (
                              <div
                                key={dateStr}
                                data-col={i}
                                className={`w-7 h-7 rounded cursor-pointer ${color} ${isToday ? "ring-2 ring-zinc-400 ring-offset-1 ring-offset-zinc-950" : ""}`}
                                title={score !== null ? `${score}/8` : "Not logged"}
                                onMouseEnter={() => setHoveredCol(i)}
                                onClick={() => setActiveHabitKey("score")}
                              />
                            );
                          }))}
                        </div>
                      </div>
                      {/* Separator */}
                      <div className="flex items-center gap-2.5">
                        <span className="w-[4.5rem] shrink-0" />
                        <div className="flex-1 border-t border-white/5" />
                      </div>
                      {/* Habit rows */}
                      {HABIT_ORDER.map((habitKey) => (
                        <div key={habitKey} className="flex items-center gap-2.5">
                          <span className="text-xs text-zinc-400 w-[4.5rem] shrink-0 text-right truncate">
                            {HABIT_CONFIG[habitKey].label}
                          </span>
                          <div className="flex gap-3">
                            {weeks.map((wk, wi) => weekCells(wk, wi, (i) => {
                              const dateStr = dates[i];
                              const isToday = i === hub.habitTracker.days.length - 1;

                              // 3-segment vision_reviewed cell
                              if (habitKey === "vision_reviewed") {
                                const val = hub.habitTracker.days[i][habitKey];
                                return (
                                  <div
                                    key={dateStr}
                                    className={`w-7 h-7 rounded cursor-pointer flex flex-row gap-px overflow-hidden ${isToday ? "ring-2 ring-zinc-400 ring-offset-1 ring-offset-zinc-950" : ""}`}
                                    onMouseEnter={() => setHoveredCol(i)}
                                    onClick={() => setActiveHabitKey(habitKey)}
                                    style={{ backgroundColor: "transparent" }}
                                  >
                                    {val === true ? (
                                      <>
                                        <div className="flex-1 h-full bg-emerald-500" />
                                        <div className="flex-1 h-full bg-emerald-500" />
                                        <div className="flex-1 h-full bg-emerald-500" />
                                      </>
                                    ) : val === false ? (
                                      <>
                                        <div className="flex-1 h-full bg-red-500" />
                                        <div className="flex-1 h-full bg-red-500" />
                                        <div className="flex-1 h-full bg-red-500" />
                                      </>
                                    ) : (
                                      <>
                                        <div className="flex-1 h-full bg-zinc-800" />
                                        <div className="flex-1 h-full bg-zinc-800" />
                                        <div className="flex-1 h-full bg-zinc-800" />
                                      </>
                                    )}
                                  </div>
                                );
                              }

                              const val = hub.habitTracker.days[i][habitKey];
                              return (
                                <div
                                  key={dateStr}
                                  className={`w-7 h-7 rounded cursor-pointer ${
                                    val === true
                                      ? "bg-emerald-500"
                                      : val === false
                                        ? "bg-red-500"
                                        : "bg-zinc-800"
                                  } ${isToday ? "ring-2 ring-zinc-400 ring-offset-1 ring-offset-zinc-950" : ""}`}
                                  onMouseEnter={() => setHoveredCol(i)}
                                  onClick={() => setActiveHabitKey(habitKey)}
                                />
                              );
                            }))}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </CollapsibleSection>
          )}

          {/* ── 7. Identity Details (collapsed) ────────────────────── */}
          <CollapsibleSection title="Identity Details">
            <div className="space-y-4">
              <IdentityField label="Physical Presence" value={vision.identityScript.physicalPresence} />
              <IdentityField label="Social Filter" value={vision.identityScript.socialFilter} />
              <IdentityField label="Decision Style" value={vision.identityScript.decisionStyle} />
            </div>
          </CollapsibleSection>

          {/* ── 8. Experiments (collapsed) ──────────────────────────── */}
          {hub && (
            <CollapsibleSection title="Experiments">
              <ExperimentsTable
                current={hub.experiments.current}
                past={hub.experiments.past}
              />
            </CollapsibleSection>
          )}

          {/* ── 9-11. Input Control, Distractions, Habit Audit ─────── */}
          <InputControlSection data={vision.inputControl} />
          <DistractionsSection data={vision.distractions} />
          <HabitAuditSection data={vision.habitAudit} />

        </div>
      </div>

      {/* Trend Modal */}
      {hub && (
        <TrendModal
          open={Boolean(activeHabitKey)}
          onClose={() => setActiveHabitKey(null)}
          title={isScoreActive ? "Daily Score" : activeHabitKey ? HABIT_CONFIG[activeHabitKey as HabitKey].label : "Habit Trend"}
          subtitle={isScoreActive ? "Rolling 7-day average (% of max 8)" : "Rolling 7-day adherence"}
          sidebar={
            activeHabitKey && !isScoreActive && hub.habitLogs?.[activeHabitKey] ? (
              <HabitLogHistory logs={hub.habitLogs[activeHabitKey]} />
            ) : undefined
          }
        >
          <div className="space-y-4">
            <LineTrendChart
              points={activeHabitTrendPoints}
              minY={0}
              maxY={100}
              color="#34d399"
              valueFormatter={(value) => `${Math.round(value)}%`}
              emptyLabel="No habit logs available for this period."
            />
            {activeHabitSummary ? (
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg border border-white/10 bg-zinc-900/60 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-zinc-500">Logged Days</p>
                  <p className="mt-1 font-mono text-sm text-zinc-100">{activeHabitSummary.loggedDays}</p>
                  <p className="mt-1 text-xs text-zinc-500">{isScoreActive ? "90-day reset" : "Last 90 days"}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-zinc-900/60 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-zinc-500">{isScoreActive ? "Avg Score" : "Adherence"}</p>
                  <p className="mt-1 font-mono text-sm text-emerald-300">{activeHabitSummary.adherence}%</p>
                  <p className="mt-1 text-xs text-zinc-500">{isScoreActive ? "% of max 8" : "Overall completion"}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-zinc-900/60 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-zinc-500">{isScoreActive ? "Good Streak" : "Current Streak"}</p>
                  <p className="mt-1 font-mono text-sm text-zinc-100">{activeHabitSummary.currentStreak}d</p>
                  <p className="mt-1 text-xs text-zinc-500">Last 14d: {activeHabitSummary.recentAdherence}%</p>
                </div>
              </div>
            ) : null}
          </div>
        </TrendModal>
      )}
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────

function IdentityField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1">{label}</p>
      {value ? (
        <p className="text-sm text-zinc-300 leading-relaxed">{value}</p>
      ) : (
        <p className="text-xs text-zinc-600 italic">Not set</p>
      )}
    </div>
  );
}

function NorthStarCard({ domain }: { domain: VisionDomain }) {
  return (
    <div
      className="bg-zinc-900/60 backdrop-blur-md border border-white/10 rounded-xl p-4 border-l-4"
      style={{ borderLeftColor: domain.hex }}
    >
      <h3 className="text-sm font-semibold text-zinc-100 mb-2">{domain.label}</h3>
      <div className="space-y-2">
        <ABTField letter="A" label="Actual" value={domain.actual} />
        <ABTField letter="B" label="Becoming" value={domain.becoming} />
        <ABTField letter="T" label="Timeline" value={domain.timeline} />
        {domain.habits.length > 0 && (
          <div>
            <span className="text-[10px] text-zinc-500 uppercase tracking-wide">H — Habits</span>
            <ul className="mt-1 space-y-0.5">
              {domain.habits.map((h, i) => (
                <li key={i} className="text-xs text-zinc-400 flex gap-1.5">
                  <span className="text-zinc-600">-</span>
                  {h}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function ABTField({ letter, label, value }: { letter: string; label: string; value: string }) {
  return (
    <div>
      <span className="text-[10px] text-zinc-500 uppercase tracking-wide">{letter} — {label}</span>
      {value ? (
        <p className="text-xs text-zinc-400 leading-relaxed mt-0.5">{value}</p>
      ) : (
        <p className="text-xs text-zinc-600 italic mt-0.5">Not set</p>
      )}
    </div>
  );
}

function InputControlSection({ data }: { data: InputControl }) {
  const sections: { label: string; items: string[] }[] = [
    { label: "Mentors", items: data.mentors },
    { label: "Books", items: data.books },
    { label: "Podcasts", items: data.podcasts },
    { label: "Playlists", items: data.playlists },
    { label: "Nutrition Rules", items: data.nutritionRules },
    { label: "Purge List", items: data.purgeList },
  ];
  const hasContent = sections.some((s) => s.items.length > 0);
  return (
    <CollapsibleSection title="Input Control">
      {hasContent ? (
        <div className="space-y-3">
          {sections.filter((s) => s.items.length > 0).map((s) => (
            <div key={s.label}>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1">{s.label}</p>
              <ul className="space-y-0.5">
                {s.items.map((item, i) => (
                  <li key={i} className="text-xs text-zinc-400 flex gap-1.5">
                    <span className="text-zinc-600">-</span>{item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-zinc-600 italic">Not set</p>
      )}
    </CollapsibleSection>
  );
}

function DistractionsSection({ data }: { data: Distractions }) {
  const sections: { label: string; items: string[] }[] = [
    { label: "Digital", items: data.digital },
    { label: "Physical", items: data.physical },
    { label: "Social", items: data.social },
    { label: "Mental", items: data.mental },
  ];
  const hasContent = sections.some((s) => s.items.length > 0) || data.triggerReplacements.length > 0;
  return (
    <CollapsibleSection title="Distractions">
      {hasContent ? (
        <div className="space-y-3">
          {sections.filter((s) => s.items.length > 0).map((s) => (
            <div key={s.label}>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1">{s.label}</p>
              <ul className="space-y-0.5">
                {s.items.map((item, i) => (
                  <li key={i} className="text-xs text-zinc-400 flex gap-1.5">
                    <span className="text-zinc-600">-</span>{item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {data.triggerReplacements.length > 0 && (
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1">Trigger Replacements</p>
              <ul className="space-y-1">
                {data.triggerReplacements.map((tr, i) => (
                  <li key={i} className="text-xs text-zinc-400">
                    <span className="text-red-400/70">{tr.trigger}</span>
                    <span className="text-zinc-600 mx-1.5">{"\u2192"}</span>
                    <span className="text-emerald-400/70">{tr.replacement}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-zinc-600 italic">Not set</p>
      )}
    </CollapsibleSection>
  );
}

function HabitAuditSection({ data }: { data: HabitAudit }) {
  const sections: { label: string; items: string[]; color: string }[] = [
    { label: "Productive", items: data.productive, color: "text-emerald-400/70" },
    { label: "Neutral", items: data.neutral, color: "text-zinc-400" },
    { label: "Destructive", items: data.destructive, color: "text-red-400/70" },
  ];
  const hasContent = sections.some((s) => s.items.length > 0);
  return (
    <CollapsibleSection title="Habit Audit">
      {hasContent ? (
        <div className="space-y-3">
          {sections.filter((s) => s.items.length > 0).map((s) => (
            <div key={s.label}>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1">{s.label}</p>
              <ul className="space-y-0.5">
                {s.items.map((item, i) => (
                  <li key={i} className={`text-xs flex gap-1.5 ${s.color}`}>
                    <span className="text-zinc-600">-</span>{item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-zinc-600 italic">Not set</p>
      )}
    </CollapsibleSection>
  );
}
