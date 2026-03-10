"use client";

import { useState } from "react";

// ── Types ───────────────────────────────────────────────────────────

type Dimension = {
  id: string;
  label: string;
  satisfaction: number;
  alignment: number;
  hex: string;
};

type VisionDomain = {
  id: string;
  label: string;
  state: string;
  hex: string;
};

// ── Ikigai Data ──────────────────────────────────────────────────────

type IkigaiCircle = {
  id: string;
  label: string;
  color: string;
  items: string[];
};

const IKIGAI: IkigaiCircle[] = [
  {
    id: "love",
    label: "What You Love",
    color: "#ec4899",
    items: [
      "Building systems that create clarity from chaos",
      "Deep work — coding, writing, thinking",
      "Meditation and inner frameworks",
      "Helping people see what they can't see alone",
    ],
  },
  {
    id: "good_at",
    label: "What You're Good At",
    color: "#3b82f6",
    items: [
      "AI engineering and tooling",
      "Systematic thinking — turning mess into structure",
      "Pattern recognition across domains",
      "Shipping fast with high signal",
    ],
  },
  {
    id: "world_needs",
    label: "What The World Needs",
    color: "#10b981",
    items: [
      "Tools that help people execute, not just plan",
      "Honest frameworks for self-improvement",
      "AI applied to real human problems",
      "Bridges between technical depth and human meaning",
    ],
  },
  {
    id: "paid_for",
    label: "What You Can Be Paid For",
    color: "#f59e0b",
    items: [
      "AI/ML engineering at scale",
      "Developer tools and productivity systems",
      "Consulting on AI workflows",
      "Products that compound user value",
    ],
  },
];

const IKIGAI_CENTER = "Build AI-powered tools that help people execute on what matters — turning reflection into action, chaos into clarity.";

// ── Vision Destination ──────────────────────────────────────────────

const VISION_HORIZON = "3-Year Destination — March 2029";

const VISION_DOMAINS: VisionDomain[] = [
  {
    id: "ai",
    label: "AI & Career",
    state: "Deep AI expertise applied to domains I love — entrepreneurship, markets, poker, meditation, and consciousness.",
    hex: "#3b82f6",
  },
  {
    id: "relationships",
    label: "Relationships",
    state: "A partner with shared vision — growing together, becoming the best versions of ourselves.",
    hex: "#ec4899",
  },
  {
    id: "body",
    label: "Body",
    state: "200 lbs with an athletic Olympic lifter build.",
    hex: "#10b981",
  },
  {
    id: "mind",
    label: "Mind",
    state: "Calm, resilient, self-aware — understanding my own tendencies through meditation and AI.",
    hex: "#a855f7",
  },
  {
    id: "community",
    label: "Community",
    state: "Active local community I'm embedded in.",
    hex: "#f97316",
  },
  {
    id: "environment",
    label: "Environment",
    state: "Proximity to hobbies and community, access to nature, walkable.",
    hex: "#64748b",
  },
  {
    id: "learning",
    label: "Learning",
    state: "Consistently curious — reading, exploring, never stagnant.",
    hex: "#14b8a6",
  },
  {
    id: "sobriety",
    label: "Sobriety",
    state: "3 years clean from weed, alcohol, and all substances.",
    hex: "#f59e0b",
  },
];

// ── Wheel Data ──────────────────────────────────────────────────────

const DIMENSIONS: Dimension[] = [
  { id: "health", label: "Health", satisfaction: 3, alignment: 5, hex: "#10b981" },
  { id: "career", label: "Career", satisfaction: 5, alignment: 5, hex: "#3b82f6" },
  { id: "relationships", label: "Relationships", satisfaction: 3, alignment: 5, hex: "#ec4899" },
  { id: "finances", label: "Finances", satisfaction: 6, alignment: 6, hex: "#f59e0b" },
  { id: "fun", label: "Fun", satisfaction: 6, alignment: 4, hex: "#14b8a6" },
  { id: "personal_growth", label: "Growth", satisfaction: 4, alignment: 7, hex: "#a855f7" },
  { id: "environment", label: "Environment", satisfaction: 5, alignment: 5, hex: "#64748b" },
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

// ── Ikigai Chart ────────────────────────────────────────────────────

function IkigaiChart({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (id: string | null) => void;
}) {
  const circles = [
    { id: "love", cx: 130, cy: 120, color: "#ec4899" },
    { id: "good_at", cx: 170, cy: 120, color: "#3b82f6" },
    { id: "world_needs", cx: 130, cy: 160, color: "#10b981" },
    { id: "paid_for", cx: 170, cy: 160, color: "#f59e0b" },
  ];

  const labelPositions: Record<string, { x: number; y: number }> = {
    love: { x: 100, y: 90 },
    good_at: { x: 200, y: 90 },
    world_needs: { x: 100, y: 195 },
    paid_for: { x: 200, y: 195 },
  };

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 300 280" className="w-full max-w-[320px] sm:max-w-[380px]">
        {circles.map((c) => {
          const circle = IKIGAI.find((ik) => ik.id === c.id)!;
          const isSelected = selected === c.id;
          return (
            <g key={c.id}>
              <circle
                cx={c.cx}
                cy={c.cy}
                r={55}
                fill={`${c.color}${isSelected ? "18" : "0a"}`}
                stroke={`${c.color}${isSelected ? "80" : "30"}`}
                strokeWidth={isSelected ? 2 : 1}
                className="cursor-pointer transition-all duration-200"
                onClick={() => onSelect(selected === c.id ? null : c.id)}
              />
              <text
                x={labelPositions[c.id].x}
                y={labelPositions[c.id].y}
                textAnchor="middle"
                fill={isSelected ? c.color : "rgba(161,161,170,0.6)"}
                fontSize="8"
                fontWeight={isSelected ? "600" : "400"}
                className="cursor-pointer transition-all duration-200"
                onClick={() => onSelect(selected === c.id ? null : c.id)}
              >
                {circle.label}
              </text>
            </g>
          );
        })}
        <text
          x={150}
          y={137}
          textAnchor="middle"
          fill="rgba(255,255,255,0.5)"
          fontSize="8"
          fontWeight="600"
        >
          IKIGAI
        </text>
        <text
          x={150}
          y={148}
          textAnchor="middle"
          fill="rgba(255,255,255,0.25)"
          fontSize="6"
        >
          reason for being
        </text>
      </svg>

      {selected ? (
        <IkigaiDetail circle={IKIGAI.find((ik) => ik.id === selected)!} />
      ) : (
        <div className="text-center px-4 max-w-xs">
          <p className="text-xs text-zinc-400 leading-relaxed">{IKIGAI_CENTER}</p>
          <p className="text-[10px] text-zinc-600 mt-2">Tap a circle to explore</p>
        </div>
      )}
    </div>
  );
}

function IkigaiDetail({ circle }: { circle: IkigaiCircle }) {
  return (
    <div
      className="rounded-xl border bg-zinc-900/60 p-3 w-full max-w-xs transition-all duration-200"
      style={{ borderColor: `${circle.color}33` }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: circle.color }} />
        <h3 className="text-xs font-semibold text-zinc-100">{circle.label}</h3>
      </div>
      <ul className="space-y-1">
        {circle.items.map((item, i) => (
          <li key={i} className="text-[11px] text-zinc-400 leading-relaxed">
            <span className="text-zinc-600 mr-1">-</span>{item}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Vision Destination ───────────────────────────────────────────────

function VisionDestination() {
  return (
    <section className="space-y-3">
      <div className="text-center">
        <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
          {VISION_HORIZON}
        </h2>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {VISION_DOMAINS.map((d) => (
          <div
            key={d.id}
            className="rounded-xl border border-white/5 bg-zinc-900/40 p-3"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: d.hex }} />
              <span className="text-xs font-semibold text-zinc-200">{d.label}</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">{d.state}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Page ────────────────────────────────────────────────────────────

export default function VisionPage() {
  const [wheelSelected, setWheelSelected] = useState<string | null>(null);
  const [ikigaiSelected, setIkigaiSelected] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <div className="p-4 sm:p-6 pb-24">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold mb-1">Vision</h1>
          </div>

          <VisionDestination />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider text-center">
                Wheel of Life
              </h2>
              <RadarChart selected={wheelSelected} onSelect={setWheelSelected} />
            </div>
            <div className="space-y-2">
              <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider text-center">
                Ikigai
              </h2>
              <IkigaiChart selected={ikigaiSelected} onSelect={setIkigaiSelected} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
