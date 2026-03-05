"use client";

import { useState } from "react";

// ── Types ───────────────────────────────────────────────────────────

type Dimension = {
  id: string;
  label: string;
  satisfaction: number;
  alignment: number;
  hex: string;
  notes: string;
  goals: {
    week: string[];
    month: string[];
    year: string[];
  };
};

// ── Data ────────────────────────────────────────────────────────────

const DIMENSIONS: Dimension[] = [
  {
    id: "health",
    label: "Health",
    satisfaction: 3,
    alignment: 5,
    hex: "#10b981",
    notes: "Gym habit sticky, eating is weak link especially traveling. More green days recently.",
    goals: {
      week: ["Hit all scheduled lifts", "Eat clean 5/7 days"],
      month: ["No missed gym weeks", "Consistent meal prep routine"],
      year: ["200 lbs lean", "Run 2x/week habit locked"],
    },
  },
  {
    id: "addiction",
    label: "Addiction",
    satisfaction: 4,
    alignment: 6,
    hex: "#ef4444",
    notes: "Weed streak building. Routine changes and stress break things. Awareness is high.",
    goals: {
      week: ["Maintain streak", "Log triggers when they hit"],
      month: ["30-day clean streak", "Identify top 3 trigger patterns"],
      year: ["Default sober identity", "Stress response = action not numbing"],
    },
  },
  {
    id: "career",
    label: "Career",
    satisfaction: 5,
    alignment: 5,
    hex: "#3b82f6",
    notes: "Doing the work but closed off in room. Not in spaces where opportunities compound.",
    goals: {
      week: ["Ship one meaningful thing", "One conversation outside team"],
      month: ["Visible output that others reference", "Attend 1 in-person event"],
      year: ["Known for something specific", "Working with people I admire"],
    },
  },
  {
    id: "relationships",
    label: "Relationships",
    satisfaction: 3,
    alignment: 5,
    hex: "#ec4899",
    notes: "Basia: long-distance, plan to close gap. Need positive-sum friendships. Family strong.",
    goals: {
      week: ["Quality call with Basia", "Reach out to one friend"],
      month: ["Visit or host someone", "One new recurring social thing"],
      year: ["Close the distance", "3+ local friends I see weekly"],
    },
  },
  {
    id: "growth",
    label: "Growth",
    satisfaction: 5,
    alignment: 7,
    hex: "#a855f7",
    notes: "Personal OS creating daily insights. Direction right, accelerating.",
    goals: {
      week: ["Daily reflection logged", "Read 30 min"],
      month: ["Finish one book", "One system improvement shipped"],
      year: ["Clear personal philosophy written", "Teaching what I know"],
    },
  },
  {
    id: "finances",
    label: "Finances",
    satisfaction: 6,
    alignment: 6,
    hex: "#f59e0b",
    notes: "200k income, 600k NW. On a path but vision unclear on why.",
    goals: {
      week: ["Track spending", "No impulse purchases"],
      month: ["Investment contribution on schedule", "Review budget"],
      year: ["Clear money-to-meaning link", "NW trajectory to 10M by 40"],
    },
  },
  {
    id: "fun",
    label: "Fun",
    satisfaction: 6,
    alignment: 4,
    hex: "#14b8a6",
    notes: "Poker is fun but zero-sum. Want positive-sum hobbies that build relationships.",
    goals: {
      week: ["One fun thing that isn't solo", "Try something new"],
      month: ["Find one positive-sum hobby", "Weekend plans 3/4 weeks"],
      year: ["Regular social activities I look forward to", "Hobbies that compound"],
    },
  },
  {
    id: "mental",
    label: "Mental",
    satisfaction: 4,
    alignment: 5,
    hex: "#818cf8",
    notes: "Meditation is the lever. Mental stability tracks sleep + meditation + fast interruption loops.",
    goals: {
      week: ["Meditate daily", "Journal 3x"],
      month: ["No multi-day spirals", "Sleep 7h+ average"],
      year: ["Equanimity as default", "Deep understanding of my mind"],
    },
  },
];

// ── Radar helpers ───────────────────────────────────────────────────

const CX = 150;
const CY = 150;
const MAX_R = 120;
const N = DIMENSIONS.length;

function polarToXY(angle: number, r: number): [number, number] {
  const rad = ((angle - 90) * Math.PI) / 180;
  return [CX + r * Math.cos(rad), CY + r * Math.sin(rad)];
}

function dimAngle(i: number): number {
  return (360 / N) * i;
}

function polygonPoints(values: number[]): string {
  return values
    .map((v, i) => {
      const r = (v / 10) * MAX_R;
      const [x, y] = polarToXY(dimAngle(i), r);
      return `${x},${y}`;
    })
    .join(" ");
}

function gridOctagon(scale: number): string {
  const r = (scale / 10) * MAX_R;
  return Array.from({ length: N }, (_, i) => {
    const [x, y] = polarToXY(dimAngle(i), r);
    return `${x},${y}`;
  }).join(" ");
}

function wedgePath(i: number): string {
  const a1 = dimAngle(i) - 360 / N / 2;
  const a2 = dimAngle(i) + 360 / N / 2;
  const [x1, y1] = polarToXY(a1, MAX_R + 35);
  const [x2, y2] = polarToXY(a2, MAX_R + 35);
  return `M ${CX} ${CY} L ${x1} ${y1} A ${MAX_R + 35} ${MAX_R + 35} 0 0 1 ${x2} ${y2} Z`;
}

// ── Radar Chart ─────────────────────────────────────────────────────

function RadarChart({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (id: string | null) => void;
}) {
  const satPoints = polygonPoints(DIMENSIONS.map((d) => d.satisfaction));
  const alignPoints = polygonPoints(DIMENSIONS.map((d) => d.alignment));

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 300 300" className="w-full max-w-[320px] sm:max-w-[380px]">
        {[2, 4, 6, 8, 10].map((s) => (
          <polygon
            key={s}
            points={gridOctagon(s)}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="0.5"
          />
        ))}

        {DIMENSIONS.map((_, i) => {
          const [x, y] = polarToXY(dimAngle(i), MAX_R + 5);
          return (
            <line
              key={i}
              x1={CX}
              y1={CY}
              x2={x}
              y2={y}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="0.5"
            />
          );
        })}

        <polygon
          points={alignPoints}
          fill="rgba(168,85,247,0.08)"
          stroke="rgba(168,85,247,0.4)"
          strokeWidth="1.5"
          strokeDasharray="4 2"
        />
        <polygon
          points={satPoints}
          fill="rgba(59,130,246,0.12)"
          stroke="rgba(59,130,246,0.6)"
          strokeWidth="1.5"
        />

        {DIMENSIONS.map((d, i) => {
          const angle = dimAngle(i);
          const satR = (d.satisfaction / 10) * MAX_R;
          const [sx, sy] = polarToXY(angle, satR);
          const alignR = (d.alignment / 10) * MAX_R;
          const [ax, ay] = polarToXY(angle, alignR);
          const [lx, ly] = polarToXY(angle, MAX_R + 22);
          const isSelected = selected === d.id;

          return (
            <g key={d.id}>
              <circle
                cx={sx}
                cy={sy}
                r={isSelected ? 4.5 : 3}
                fill={isSelected ? d.hex : "rgba(59,130,246,0.8)"}
                className="transition-all duration-200"
              />
              <circle
                cx={ax}
                cy={ay}
                r={isSelected ? 4.5 : 3}
                fill="none"
                stroke={isSelected ? d.hex : "rgba(168,85,247,0.6)"}
                strokeWidth="1.5"
                className="transition-all duration-200"
              />
              <text
                x={lx}
                y={ly}
                textAnchor="middle"
                dominantBaseline="central"
                fill={isSelected ? d.hex : "rgba(161,161,170,0.7)"}
                fontSize={isSelected ? "10" : "9"}
                fontWeight={isSelected ? "600" : "400"}
                className="transition-all duration-200"
              >
                {d.label}
              </text>
              <text
                x={lx}
                y={ly + 11}
                textAnchor="middle"
                dominantBaseline="central"
                fill={isSelected ? "rgba(255,255,255,0.7)" : "rgba(161,161,170,0.4)"}
                fontSize="8"
              >
                {d.satisfaction}/{d.alignment}
              </text>
              <path
                d={wedgePath(i)}
                fill="transparent"
                className="cursor-pointer"
                onClick={() => onSelect(selected === d.id ? null : d.id)}
              />
            </g>
          );
        })}

        <text x={CX} y={CY - 4} textAnchor="middle" fill="rgba(161,161,170,0.5)" fontSize="9" fontWeight="500">
          ASH
        </text>
        <text x={CX} y={CY + 8} textAnchor="middle" fill="rgba(161,161,170,0.3)" fontSize="7">
          sat / align
        </text>
      </svg>

      <div className="flex items-center gap-4 mt-2 text-[10px] text-zinc-500">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-0.5 bg-blue-500/60 rounded inline-block" /> Satisfaction
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-0.5 border border-purple-500/60 rounded inline-block border-dashed" /> Alignment
        </span>
      </div>
    </div>
  );
}

// ── Goals Panel ─────────────────────────────────────────────────────

const HORIZONS = ["week", "month", "year"] as const;
const HORIZON_LABELS: Record<string, string> = {
  week: "This Week",
  month: "This Month",
  year: "This Year",
};

function GoalsPanel({ dimension }: { dimension: Dimension }) {
  return (
    <div
      className="rounded-xl border bg-zinc-900/60 p-4 transition-all duration-200"
      style={{ borderColor: `${dimension.hex}33` }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: dimension.hex }} />
        <h3 className="text-sm font-semibold text-zinc-100">{dimension.label}</h3>
        <span className="text-xs text-zinc-500 ml-auto">{dimension.satisfaction}/{dimension.alignment}</span>
      </div>

      <p className="text-xs text-zinc-400 mb-4">{dimension.notes}</p>

      <div className="grid grid-cols-3 gap-3">
        {HORIZONS.map((h) => (
          <div key={h}>
            <h4 className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-2">
              {HORIZON_LABELS[h]}
            </h4>
            <ul className="space-y-1.5">
              {dimension.goals[h].map((g, i) => (
                <li key={i} className="text-xs text-zinc-300 leading-relaxed">
                  <span className="text-zinc-600 mr-1">-</span>
                  {g}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function AllGoalsGrid() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {DIMENSIONS.map((d) => (
        <div
          key={d.id}
          className="rounded-xl border border-white/5 bg-zinc-900/40 p-3"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: d.hex }} />
            <span className="text-xs font-medium text-zinc-300">{d.label}</span>
            <span className="text-[10px] text-zinc-600 ml-auto">{d.satisfaction}/{d.alignment}</span>
          </div>
          <div className="space-y-1">
            {d.goals.month.map((g, i) => (
              <p key={i} className="text-[11px] text-zinc-500">
                <span className="text-zinc-700 mr-1">-</span>{g}
              </p>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────

export default function VisionPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const active = selected ? DIMENSIONS.find((d) => d.id === selected) ?? null : null;

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <div className="p-4 sm:p-6 pb-24">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold mb-1">Vision</h1>
            <p className="text-zinc-500 text-sm">Tap a dimension to see goals</p>
          </div>

          <RadarChart selected={selected} onSelect={setSelected} />

          {active ? (
            <GoalsPanel dimension={active} />
          ) : (
            <AllGoalsGrid />
          )}

          <section className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
            <h2 className="text-xs font-semibold text-amber-400/80 uppercase tracking-wider mb-1.5">
              Core Question
            </h2>
            <p className="text-zinc-300 text-sm leading-relaxed">
              Trade escape for building. Move from reactive coping to intentional action
              that compounds across health, relationships, and meaningful work.
            </p>
          </section>

          <p className="text-center text-zinc-700 text-xs">Vision baseline — March 2026</p>
        </div>
      </div>
    </div>
  );
}
