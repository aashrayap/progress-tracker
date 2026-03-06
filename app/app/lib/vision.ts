import fs from "fs";
import path from "path";
import type { DailySignalEntry, QuoteEntry } from "./types";
import {
  readDailySignals,
  readQuotes,
  readPlan,
  readReflections,
  readWorkouts,
  groupWorkoutsByDay,
  type PlanEntry,
  type ReflectionEntry,
} from "./csv";
import { daysAgoStr, todayStr } from "./utils";

// ── Types ────────────────────────────────────────────────────────────

export type DomainId =
  | "health"
  | "addiction"
  | "mental"
  | "career"
  | "relationships"
  | "finances"
  | "fun"
  | "personal_growth";

export interface DomainAnalysis {
  satisfaction: number;
  alignment: number;
  quote: { text: string; author: string; source: string } | null;
  insight: string;
  weekFocus: string[];
  monthFocus: string[];
  coreQuestion: string;
}

export interface VisionResponse {
  lastScored: string;
  overview: {
    status: string;
    weekFocus: string[];
    monthFocus: string[];
  };
  domains: Record<string, DomainAnalysis>;
}

// ── Constants ────────────────────────────────────────────────────────

export const DOMAIN_IDS: DomainId[] = [
  "health",
  "addiction",
  "mental",
  "career",
  "relationships",
  "finances",
  "fun",
  "personal_growth",
];

export const DOMAIN_LABELS: Record<DomainId, string> = {
  health: "Health",
  addiction: "Addiction",
  mental: "Mental",
  career: "Career",
  relationships: "Relationships",
  finances: "Finances",
  fun: "Fun",
  personal_growth: "Growth",
};

export const DOMAIN_COLORS: Record<DomainId, string> = {
  health: "#10b981",
  addiction: "#ef4444",
  mental: "#818cf8",
  career: "#3b82f6",
  relationships: "#ec4899",
  finances: "#f59e0b",
  fun: "#14b8a6",
  personal_growth: "#a855f7",
};

export const DOMAIN_QUESTIONS: Record<DomainId, string> = {
  health: "Am I treating my body like it has to last 80 more years?",
  addiction: "Am I choosing discomfort now to avoid suffering later?",
  mental: "Is my mind working for me or against me today?",
  career: "Am I building something that compounds, or just staying busy?",
  relationships: "Am I showing up for the people who matter, or hiding?",
  finances: "Does my spending reflect my actual priorities?",
  fun: "Am I having fun that creates energy, or fun that drains it?",
  personal_growth: "Am I learning things that change how I act, or just what I know?",
};

// Signal-to-domain mapping for heuristic analysis
const SIGNAL_DOMAIN_MAP: Record<string, DomainId> = {
  gym: "health",
  ate_clean: "health",
  weight: "health",
  weed: "addiction",
  lol: "addiction",
  poker: "addiction",
  clarity: "addiction",
  sleep: "mental",
  meditate: "mental",
  deep_work: "career",
};

// Reflection domain normalization (reflections use varied domain names)
const REFLECTION_DOMAIN_MAP: Record<string, DomainId> = {
  health: "health",
  addiction: "addiction",
  mental: "mental",
  career: "career",
  relationships: "relationships",
  relationship: "relationships",
  finances: "finances",
  fun: "fun",
  personal_growth: "personal_growth",
  growth: "personal_growth",
  deep_work: "career",
  eating: "health",
};

// ── Vision.md Parser ─────────────────────────────────────────────────

interface VisionDoc {
  lastScored: string;
  scores: Record<string, { satisfaction: number; alignment: number }>;
  goals: Record<string, { now: string; ninetyDay: string; twoYear: string }>;
}

function parseVisionMd(): VisionDoc {
  const ROOT = path.join(process.cwd(), "..");
  const visionPath = path.join(ROOT, "docs", "vision.md");
  const content = fs.readFileSync(visionPath, "utf-8");

  const scores: Record<string, { satisfaction: number; alignment: number }> = {};
  const goals: Record<string, { now: string; ninetyDay: string; twoYear: string }> = {};
  let lastScored = "";

  // Parse last_scored
  const scoredMatch = content.match(/Last scored:\s*(\d{4}-\d{2}-\d{2})/i);
  if (scoredMatch) lastScored = scoredMatch[1];

  // Parse wheel scores table
  const scoreRegex = /\|\s*`(\w+)`\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|/g;
  let m;
  while ((m = scoreRegex.exec(content)) !== null) {
    scores[m[1]] = { satisfaction: parseInt(m[2]), alignment: parseInt(m[3]) };
  }

  // Parse domain goals
  for (const id of DOMAIN_IDS) {
    const bt = "`";
    const sectionRegex = new RegExp(
      "###\\s*" + bt + id + bt + "\\s*\\n([\\s\\S]*?)(?=\\n###|\\n## |\\n\\n## |$(?!\\n))",
      ""
    );
    const section = content.match(sectionRegex);
    if (section) {
      const text = section[1];
      const nowMatch = text.match(/-\s*\*\*Now\*\*:\s*(.+)/);
      const ninetyMatch = text.match(/-\s*\*\*90-day\*\*:\s*(.+)/);
      const twoYearMatch = text.match(/-\s*\*\*2-year\*\*:\s*(.+)/);
      goals[id] = {
        now: nowMatch?.[1]?.trim() || "",
        ninetyDay: ninetyMatch?.[1]?.trim() || "",
        twoYear: twoYearMatch?.[1]?.trim() || "",
      };
    }
  }

  return { lastScored, scores, goals };
}

// ── Heuristic Analysis ───────────────────────────────────────────────

function getRecentSignals(signals: DailySignalEntry[], days: number): DailySignalEntry[] {
  const cutoff = daysAgoStr(days);
  return signals.filter((s) => s.date >= cutoff);
}

function getRecentReflections(reflections: ReflectionEntry[], days: number): ReflectionEntry[] {
  const cutoff = daysAgoStr(days);
  return reflections.filter((r) => r.date >= cutoff);
}

function getUpcomingPlan(plan: PlanEntry[], days: number): PlanEntry[] {
  const today = todayStr();
  const end = new Date();
  end.setDate(end.getDate() + days);
  const endStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`;
  return plan.filter((p) => p.date >= today && p.date <= endStr);
}

interface DomainSignalSummary {
  total: number;
  green: number;
  red: number;
  rate: number;
  recentTrend: "improving" | "declining" | "stable";
}

function summarizeSignals(
  signals: DailySignalEntry[],
  domainId: DomainId
): DomainSignalSummary {
  const domainSignals = Object.entries(SIGNAL_DOMAIN_MAP)
    .filter(([, d]) => d === domainId)
    .map(([s]) => s);

  const relevant = signals.filter(
    (s) => domainSignals.includes(s.signal) && s.unit === "bool"
  );

  const total = relevant.length;
  const green = relevant.filter((s) => s.value === "1").length;
  const red = total - green;
  const rate = total > 0 ? green / total : 0;

  // Trend: compare first half vs second half
  const mid = Math.floor(relevant.length / 2);
  const firstHalf = relevant.slice(0, mid);
  const secondHalf = relevant.slice(mid);
  const firstRate = firstHalf.length > 0
    ? firstHalf.filter((s) => s.value === "1").length / firstHalf.length
    : 0;
  const secondRate = secondHalf.length > 0
    ? secondHalf.filter((s) => s.value === "1").length / secondHalf.length
    : 0;

  let recentTrend: "improving" | "declining" | "stable" = "stable";
  if (secondRate - firstRate > 0.15) recentTrend = "improving";
  else if (firstRate - secondRate > 0.15) recentTrend = "declining";

  return { total, green, red, rate, recentTrend };
}

function generateDomainInsight(
  domainId: DomainId,
  summary: DomainSignalSummary,
  reflections: ReflectionEntry[],
  goals: { now: string; ninetyDay: string; twoYear: string } | undefined,
  workoutDays: number
): string {
  const parts: string[] = [];

  // Signal-based insight
  if (summary.total > 0) {
    const pct = Math.round(summary.rate * 100);
    if (summary.recentTrend === "improving") {
      parts.push(`Trending upward with ${pct}% consistency over recent days.`);
    } else if (summary.recentTrend === "declining") {
      parts.push(`Consistency has dropped to ${pct}% recently and needs attention.`);
    } else {
      parts.push(`Holding steady at ${pct}% consistency.`);
    }
  }

  // Domain-specific extras
  if (domainId === "health" && workoutDays > 0) {
    parts.push(`${workoutDays} workout sessions logged in the last 7 days.`);
  }

  if (domainId === "addiction") {
    // Look for relapse patterns
    const relapseSignals = ["weed", "lol", "poker"];
    const relapseDays = new Set<string>();
    relapseSignals.forEach((sig) => {
      const entries = reflections.filter((r) =>
        REFLECTION_DOMAIN_MAP[r.domain] === "addiction"
      );
      entries.forEach((e) => {
        if (e.lesson.toLowerCase().includes("relapse") || e.win.toLowerCase().includes("clean")) {
          relapseDays.add(e.date);
        }
      });
    });
  }

  // Reflection-based insight
  const domainReflections = reflections.filter(
    (r) => REFLECTION_DOMAIN_MAP[r.domain] === domainId
  );
  if (domainReflections.length > 0) {
    const latest = domainReflections[domainReflections.length - 1];
    if (latest.lesson) {
      parts.push(`Recent lesson: ${latest.lesson.slice(0, 120)}${latest.lesson.length > 120 ? "..." : ""}`);
    }
  }

  // Goal alignment
  if (goals?.now && parts.length < 3) {
    parts.push(`Current focus: ${goals.now.slice(0, 100)}${goals.now.length > 100 ? "..." : ""}`);
  }

  if (parts.length === 0) {
    parts.push("No recent data tracked for this domain. Consider logging signals to build visibility.");
  }

  return parts.slice(0, 3).join(" ");
}

function generateOverviewStatus(
  domainSummaries: Record<string, DomainSignalSummary>,
  scores: Record<string, { satisfaction: number; alignment: number }>
): string {
  // Find domains needing most attention (lowest satisfaction + declining trend)
  const needsAttention: string[] = [];
  const momentum: string[] = [];

  for (const id of DOMAIN_IDS) {
    const score = scores[id];
    const summary = domainSummaries[id];
    if (!score) continue;

    if (score.satisfaction <= 3 || summary?.recentTrend === "declining") {
      needsAttention.push(DOMAIN_LABELS[id]);
    }
    if (summary?.recentTrend === "improving") {
      momentum.push(DOMAIN_LABELS[id]);
    }
  }

  const parts: string[] = [];
  if (needsAttention.length > 0) {
    parts.push(`${needsAttention.slice(0, 3).join(" and ")} ${needsAttention.length === 1 ? "is" : "are"} your highest-leverage ${needsAttention.length === 1 ? "area" : "areas"} right now.`);
  }
  if (momentum.length > 0) {
    parts.push(`${momentum.slice(0, 2).join(" and ")} ${momentum.length === 1 ? "is" : "are"} building momentum.`);
  }
  if (parts.length === 0) {
    parts.push("Steady across domains. Focus on consistency and depth this week.");
  }

  return parts.join(" ");
}

function deriveWeekFocus(
  goals: Record<string, { now: string; ninetyDay: string; twoYear: string }>,
  summaries: Record<string, DomainSignalSummary>,
  scores: Record<string, { satisfaction: number; alignment: number }>
): string[] {
  const focus: string[] = [];

  // Prioritize low-satisfaction domains with "now" goals
  const sorted = DOMAIN_IDS
    .filter((id) => scores[id] && goals[id])
    .sort((a, b) => (scores[a]?.satisfaction || 0) - (scores[b]?.satisfaction || 0));

  for (const id of sorted.slice(0, 3)) {
    if (goals[id]?.now) {
      const truncated = goals[id].now.length > 80
        ? goals[id].now.slice(0, 80) + "..."
        : goals[id].now;
      focus.push(`${DOMAIN_LABELS[id]}: ${truncated}`);
    }
  }

  return focus.slice(0, 3);
}

function deriveMonthFocus(
  goals: Record<string, { now: string; ninetyDay: string; twoYear: string }>,
  scores: Record<string, { satisfaction: number; alignment: number }>
): string[] {
  const focus: string[] = [];

  const sorted = DOMAIN_IDS
    .filter((id) => scores[id] && goals[id])
    .sort((a, b) => (scores[a]?.satisfaction || 0) - (scores[b]?.satisfaction || 0));

  for (const id of sorted.slice(0, 3)) {
    if (goals[id]?.ninetyDay) {
      const truncated = goals[id].ninetyDay.length > 80
        ? goals[id].ninetyDay.slice(0, 80) + "..."
        : goals[id].ninetyDay;
      focus.push(`${DOMAIN_LABELS[id]}: ${truncated}`);
    }
  }

  return focus.slice(0, 3);
}

function deriveDomainWeekFocus(
  domainId: DomainId,
  goals: { now: string; ninetyDay: string; twoYear: string } | undefined,
  plan: PlanEntry[]
): string[] {
  const focus: string[] = [];

  // Pull from plan items with matching domain
  const domainPlan = plan.filter(
    (p) => p.domain?.toLowerCase() === domainId || isRelatedPlanItem(p, domainId)
  );
  for (const p of domainPlan.slice(0, 2)) {
    focus.push(p.item);
  }

  // Fill with goals if plan is sparse
  if (focus.length < 2 && goals?.now) {
    focus.push(goals.now);
  }

  return focus.slice(0, 3);
}

function deriveDomainMonthFocus(
  domainId: DomainId,
  goals: { now: string; ninetyDay: string; twoYear: string } | undefined
): string[] {
  if (!goals) return [];
  const focus: string[] = [];
  if (goals.ninetyDay) focus.push(goals.ninetyDay);
  return focus.slice(0, 3);
}

function isRelatedPlanItem(plan: PlanEntry, domain: DomainId): boolean {
  const item = plan.item.toLowerCase();
  const notes = (plan.notes || "").toLowerCase();
  const combined = `${item} ${notes}`;

  const keywords: Record<DomainId, string[]> = {
    health: ["gym", "workout", "lift", "squat", "bench", "run", "cardio", "meal"],
    addiction: ["streak", "sobriety", "trigger", "relapse"],
    mental: ["meditat", "sleep", "journal", "wind down"],
    career: ["deep work", "work meeting", "standup", "ship"],
    relationships: ["basia", "call", "visit", "friend", "family", "wedding"],
    finances: ["budget", "invest", "spending", "ring", "diamond"],
    fun: ["hobby", "game", "poker", "play"],
    personal_growth: ["read", "reflect", "journal", "learn"],
  };

  return (keywords[domain] || []).some((kw) => combined.includes(kw));
}

function pickQuote(
  quotes: QuoteEntry[],
  domainId: DomainId
): { text: string; author: string; source: string } | null {
  const domainQuotes = quotes.filter((q) => q.domain === domainId);
  if (domainQuotes.length === 0) return null;

  // Deterministic daily rotation based on day of year
  const now = new Date();
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000
  );
  const idx = dayOfYear % domainQuotes.length;
  const q = domainQuotes[idx];
  return { text: q.text, author: q.author, source: q.source };
}

// ── Main Analysis Entry Point ────────────────────────────────────────

export function buildVisionData(): VisionResponse {
  const vision = parseVisionMd();
  const allSignals = readDailySignals();
  const recentSignals = getRecentSignals(allSignals, 14);
  const quotes = readQuotes();
  const allReflections = readReflections();
  const recentReflections = getRecentReflections(allReflections, 14);
  const plan = readPlan();
  const upcomingPlan = getUpcomingPlan(plan, 7);

  // Workout data for health domain
  const workoutSets = readWorkouts();
  const workoutDays = groupWorkoutsByDay(workoutSets);
  const cutoff7 = daysAgoStr(7);
  const recentWorkoutCount = workoutDays.filter((w) => w.date >= cutoff7).length;

  // Build per-domain summaries
  const domainSummaries: Record<string, DomainSignalSummary> = {};
  for (const id of DOMAIN_IDS) {
    domainSummaries[id] = summarizeSignals(recentSignals, id);
  }

  // Build per-domain analysis
  const domains: Record<string, DomainAnalysis> = {};
  for (const id of DOMAIN_IDS) {
    const score = vision.scores[id] || { satisfaction: 0, alignment: 0 };
    const goals = vision.goals[id];

    domains[id] = {
      satisfaction: score.satisfaction,
      alignment: score.alignment,
      quote: pickQuote(quotes, id),
      insight: generateDomainInsight(
        id,
        domainSummaries[id],
        recentReflections,
        goals,
        id === "health" ? recentWorkoutCount : 0
      ),
      weekFocus: deriveDomainWeekFocus(id, goals, upcomingPlan),
      monthFocus: deriveDomainMonthFocus(id, goals),
      coreQuestion: DOMAIN_QUESTIONS[id],
    };
  }

  return {
    lastScored: vision.lastScored || "unknown",
    overview: {
      status: generateOverviewStatus(domainSummaries, vision.scores),
      weekFocus: deriveWeekFocus(vision.goals, domainSummaries, vision.scores),
      monthFocus: deriveMonthFocus(vision.goals, vision.scores),
    },
    domains,
  };
}
