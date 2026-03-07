"use client";

import { useCallback, useEffect, useState } from "react";

// ── Types ───────────────────────────────────────────────────────────

interface DomainSystem {
  habit: string;
  label: string;
  adherence14d: number;
  streak: number;
}

type Direction = "up" | "down" | "flat" | "no-data";

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

interface VisionData {
  domains: DomainStatus[];
}

// ── Direction helpers ───────────────────────────────────────────────

const DIRECTION_ICON: Record<Direction, string> = {
  up: "\u2191",
  down: "\u2193",
  flat: "\u2192",
  "no-data": "\u2013",
};

const DIRECTION_COLOR: Record<Direction, string> = {
  up: "text-emerald-400",
  down: "text-red-400",
  flat: "text-zinc-400",
  "no-data": "text-zinc-600",
};

const DIRECTION_LABEL: Record<Direction, string> = {
  up: "Improving",
  down: "Declining",
  flat: "Steady",
  "no-data": "No data",
};

// ── Domain Card ─────────────────────────────────────────────────────

function DomainCard({
  domain,
  expanded,
  onToggle,
}: {
  domain: DomainStatus;
  expanded: boolean;
  onToggle: () => void;
}) {
  const hasSystems = domain.systems.length > 0;
  const hasGaps = domain.gaps.length > 0;

  return (
    <div
      className="rounded-xl border bg-zinc-900/60 p-4 transition-all duration-200 cursor-pointer"
      style={{ borderColor: expanded ? `${domain.hex}44` : "rgba(255,255,255,0.05)" }}
      onClick={onToggle}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: domain.hex }}
        />
        <h3 className="text-sm font-semibold text-zinc-100 flex-1">
          {domain.label}
        </h3>
        <span
          className={`text-lg font-bold ${DIRECTION_COLOR[domain.direction]}`}
          title={DIRECTION_LABEL[domain.direction]}
        >
          {DIRECTION_ICON[domain.direction]}
        </span>
      </div>

      {/* Vision statement */}
      <p className="text-xs text-zinc-500 mt-1.5 ml-[22px]">{domain.vision}</p>

      {/* Systems bar */}
      {hasSystems && (
        <div className="flex gap-2 mt-3 ml-[22px]">
          {domain.systems.map((sys) => (
            <div
              key={sys.habit}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-zinc-800/80 text-xs"
            >
              <span className="text-zinc-400">{sys.label}</span>
              <span
                className={
                  sys.adherence14d >= 70
                    ? "text-emerald-400 font-medium"
                    : sys.adherence14d >= 40
                      ? "text-amber-400 font-medium"
                      : "text-red-400 font-medium"
                }
              >
                {sys.adherence14d}%
              </span>
              {sys.streak > 0 && (
                <span className="text-zinc-600">{sys.streak}d</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* No systems indicator */}
      {!hasSystems && (
        <div className="mt-3 ml-[22px]">
          <span className="text-[11px] text-zinc-600 italic">No active tracking systems</span>
        </div>
      )}

      {/* Expanded details */}
      {expanded && (
        <div className="mt-4 ml-[22px] space-y-3">
          {/* Recent reflection */}
          {domain.recentReflection && (
            <div className="rounded-lg bg-zinc-800/50 p-3">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1.5">
                Latest Reflection
              </p>
              {domain.recentReflection.change && (
                <p className="text-xs text-zinc-300">
                  <span className="text-zinc-500 mr-1">Change:</span>
                  {domain.recentReflection.change}
                </p>
              )}
              {domain.recentReflection.lesson && (
                <p className="text-xs text-zinc-300 mt-1">
                  <span className="text-zinc-500 mr-1">Lesson:</span>
                  {domain.recentReflection.lesson}
                </p>
              )}
              {domain.recentReflection.win && (
                <p className="text-xs text-zinc-300 mt-1">
                  <span className="text-zinc-500 mr-1">Win:</span>
                  {domain.recentReflection.win}
                </p>
              )}
            </div>
          )}

          {/* Gaps */}
          {hasGaps && (
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1.5">
                Missing Systems
              </p>
              <div className="flex flex-wrap gap-1.5">
                {domain.gaps.map((gap) => (
                  <span
                    key={gap}
                    className="text-[11px] text-zinc-500 px-2 py-0.5 rounded-md border border-zinc-800 bg-zinc-900/50"
                  >
                    {gap}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Reflection count */}
          <p className="text-[11px] text-zinc-600">
            {domain.reflectionCount7d} reflection{domain.reflectionCount7d !== 1 ? "s" : ""} this week
          </p>
        </div>
      )}
    </div>
  );
}

// ── Summary Bar ─────────────────────────────────────────────────────

function SummaryBar({ domains }: { domains: DomainStatus[] }) {
  const up = domains.filter((d) => d.direction === "up").length;
  const down = domains.filter((d) => d.direction === "down").length;
  const flat = domains.filter((d) => d.direction === "flat").length;
  const noData = domains.filter((d) => d.direction === "no-data").length;
  const tracked = domains.filter((d) => d.systems.length > 0).length;

  return (
    <div className="flex items-center gap-4 text-xs text-zinc-400">
      {up > 0 && (
        <span className="flex items-center gap-1">
          <span className="text-emerald-400 font-bold">{up}</span> improving
        </span>
      )}
      {flat > 0 && (
        <span className="flex items-center gap-1">
          <span className="text-zinc-300 font-bold">{flat}</span> steady
        </span>
      )}
      {down > 0 && (
        <span className="flex items-center gap-1">
          <span className="text-red-400 font-bold">{down}</span> declining
        </span>
      )}
      {noData > 0 && (
        <span className="flex items-center gap-1">
          <span className="text-zinc-600 font-bold">{noData}</span> untracked
        </span>
      )}
      <span className="text-zinc-600 ml-auto">
        {tracked}/{domains.length} domains have systems
      </span>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────

export default function VisionPage() {
  const [data, setData] = useState<VisionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    fetch("/api/vision")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch vision");
        return res.json();
      })
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load vision:", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
        <p className="text-red-400">Failed to load vision data</p>
      </div>
    );
  }

  // Sort: domains with systems first, then by direction (down > flat > up > no-data)
  const directionPriority: Record<Direction, number> = {
    down: 0,
    flat: 1,
    up: 2,
    "no-data": 3,
  };
  const sorted = [...data.domains].sort((a, b) => {
    const aHas = a.systems.length > 0 ? 0 : 1;
    const bHas = b.systems.length > 0 ? 0 : 1;
    if (aHas !== bHas) return aHas - bHas;
    return directionPriority[a.direction] - directionPriority[b.direction];
  });

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <div className="p-4 sm:p-6 pb-24">
        <div className="max-w-3xl mx-auto space-y-5">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold mb-1">Vision</h1>
            <p className="text-zinc-500 text-sm">
              Am I going in the right direction?
            </p>
          </div>

          <SummaryBar domains={data.domains} />

          <div className="space-y-3">
            {sorted.map((domain) => (
              <DomainCard
                key={domain.id}
                domain={domain}
                expanded={expanded === domain.id}
                onToggle={() =>
                  setExpanded(expanded === domain.id ? null : domain.id)
                }
              />
            ))}
          </div>

          <section className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
            <h2 className="text-xs font-semibold text-amber-400/80 uppercase tracking-wider mb-1.5">
              Core Question
            </h2>
            <p className="text-zinc-300 text-sm leading-relaxed">
              Trade escape for building. Move from reactive coping to intentional
              action that compounds across health, relationships, and meaningful
              work.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
