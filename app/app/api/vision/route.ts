import { NextResponse } from "next/server";
import { daysAgoStr } from "../../lib/utils";
import {
  readDailySignals,
  readReflections,
  getStreak,
  type DailySignalEntry,
  type ReflectionEntry,
} from "../../lib/csv";

type Direction = "up" | "down" | "flat" | "no-data";

interface DomainSystem {
  habit: string;
  label: string;
  adherence14d: number;
  streak: number;
}

interface DomainStatus {
  id: string;
  label: string;
  hex: string;
  vision: string;
  direction: Direction;
  systems: DomainSystem[];
  gaps: string[];
  recentReflection: { win: string; lesson: string; change: string } | null;
  reflectionCount7d: number;
}

const DOMAIN_META: {
  id: string;
  label: string;
  hex: string;
  vision: string;
  habits: { signal: string; label: string }[];
  idealGaps: string[];
}[] = [
  {
    id: "health",
    label: "Health",
    hex: "#10b981",
    vision: "200 lbs lean, consistent training, clean eating as default",
    habits: [
      { signal: "gym", label: "Gym" },
      { signal: "ate_clean", label: "Ate Clean" },
    ],
    idealGaps: ["Weight logging", "Meal tracking"],
  },
  {
    id: "addiction",
    label: "Addiction",
    hex: "#ef4444",
    vision: "Default sober identity. Stress response = action not numbing",
    habits: [
      { signal: "weed", label: "No Weed" },
      { signal: "lol", label: "No LoL" },
      { signal: "poker", label: "No Poker" },
      { signal: "clarity", label: "Clarity" },
    ],
    idealGaps: ["Trigger journaling"],
  },
  {
    id: "mental",
    label: "Mental",
    hex: "#818cf8",
    vision: "Equanimity as default. Deep understanding of my mind",
    habits: [
      { signal: "sleep", label: "Sleep" },
      { signal: "meditate", label: "Meditate" },
    ],
    idealGaps: ["Mood tracking", "Journal consistency"],
  },
  {
    id: "career",
    label: "Career",
    hex: "#3b82f6",
    vision: "Known for something specific. Working with people I admire",
    habits: [{ signal: "deep_work", label: "Deep Work" }],
    idealGaps: ["Visibility actions", "Networking cadence"],
  },
  {
    id: "relationships",
    label: "Relationships",
    hex: "#ec4899",
    vision: "Close the distance with Basia. 3+ local friends I see weekly",
    habits: [],
    idealGaps: ["Partner check-in tracking", "Social plans logging"],
  },
  {
    id: "finances",
    label: "Finances",
    hex: "#f59e0b",
    vision: "Clear money-to-meaning link. NW trajectory to 10M by 40",
    habits: [],
    idealGaps: ["Spending tracking", "Monthly review ritual"],
  },
  {
    id: "fun",
    label: "Fun",
    hex: "#14b8a6",
    vision: "Regular social activities I look forward to. Hobbies that compound",
    habits: [],
    idealGaps: ["Hobby logging", "Social event planning"],
  },
  {
    id: "personal_growth",
    label: "Growth",
    hex: "#a855f7",
    vision: "Clear personal philosophy written. Teaching what I know",
    habits: [],
    idealGaps: ["Reading tracking", "Learning log"],
  },
];

function computeAdherence(
  signals: DailySignalEntry[],
  habit: string,
  dates: string[]
): number {
  const logged = dates.filter((d) =>
    signals.some((s) => s.date === d && s.signal === habit)
  );
  if (logged.length === 0) return 0;
  const done = logged.filter((d) =>
    signals.some((s) => s.date === d && s.signal === habit && s.value === "1")
  );
  return Math.round((done.length / logged.length) * 100);
}

function computeDirection(
  signals: DailySignalEntry[],
  habits: string[],
  reflections: ReflectionEntry[],
  domainId: string
): Direction {
  if (habits.length === 0) {
    // For domains without habits, use reflection frequency
    const recent7 = reflections.filter(
      (r) => r.date >= daysAgoStr(7) && r.domain === domainId
    ).length;
    const prev7 = reflections.filter(
      (r) =>
        r.date >= daysAgoStr(14) &&
        r.date < daysAgoStr(7) &&
        r.domain === domainId
    ).length;
    if (recent7 === 0 && prev7 === 0) return "no-data";
    if (recent7 > prev7) return "up";
    if (recent7 < prev7) return "down";
    return "flat";
  }

  const recent7Dates = Array.from({ length: 7 }, (_, i) => daysAgoStr(i));
  const prev7Dates = Array.from({ length: 7 }, (_, i) => daysAgoStr(i + 7));

  let recentTotal = 0;
  let prevTotal = 0;

  for (const habit of habits) {
    recentTotal += computeAdherence(signals, habit, recent7Dates);
    prevTotal += computeAdherence(signals, habit, prev7Dates);
  }

  const recentAvg = recentTotal / habits.length;
  const prevAvg = prevTotal / habits.length;

  if (recentAvg === 0 && prevAvg === 0) return "no-data";
  const diff = recentAvg - prevAvg;
  if (diff > 10) return "up";
  if (diff < -10) return "down";
  return "flat";
}

export async function GET() {
  try {
    const signals = readDailySignals();
    const reflections = readReflections();
    const last14d = Array.from({ length: 14 }, (_, i) => daysAgoStr(i));

    const domains: DomainStatus[] = DOMAIN_META.map((meta) => {
      const systems: DomainSystem[] = meta.habits.map((h) => ({
        habit: h.signal,
        label: h.label,
        adherence14d: computeAdherence(signals, h.signal, last14d),
        streak: getStreak(signals, h.signal),
      }));

      const habitSignals = meta.habits.map((h) => h.signal);
      const direction = computeDirection(
        signals,
        habitSignals,
        reflections,
        meta.id
      );

      // Gaps: ideal systems not yet tracked via habits
      const gaps = meta.idealGaps.filter((gap) => {
        // If the domain has active habits with >0% adherence, remove "obvious" gaps
        const hasActiveSystem = systems.some((s) => s.adherence14d > 0);
        if (!hasActiveSystem) return true;
        // Keep gaps that represent things beyond habit tracking
        return true;
      });

      // Most recent reflection for this domain
      const domainReflections = reflections
        .filter((r) => r.domain === meta.id && r.archived !== "1")
        .sort((a, b) => b.date.localeCompare(a.date));
      const latest = domainReflections[0] || null;
      const recentReflection = latest
        ? { win: latest.win, lesson: latest.lesson, change: latest.change }
        : null;

      const reflectionCount7d = reflections.filter(
        (r) =>
          r.domain === meta.id &&
          r.date >= daysAgoStr(7) &&
          r.archived !== "1"
      ).length;

      return {
        id: meta.id,
        label: meta.label,
        hex: meta.hex,
        vision: meta.vision,
        direction,
        systems,
        gaps,
        recentReflection,
        reflectionCount7d,
      };
    });

    return NextResponse.json({ domains });
  } catch (e) {
    console.error("GET /api/vision error:", e);
    return NextResponse.json(
      { error: "Failed to load vision data" },
      { status: 500 }
    );
  }
}
