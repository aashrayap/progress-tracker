"use client";

import { useState, useEffect } from "react";
import type { VisionData } from "../lib/types";

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

// ── Radar helpers ───────────────────────────────────────────────────

const CX = 150;
const CY = 150;
const MAX_R = 120;

function polarToXY(angle: number, r: number): [number, number] {
  const rad = ((angle - 90) * Math.PI) / 180;
  return [CX + r * Math.cos(rad), CY + r * Math.sin(rad)];
}

function gridPolygon(scale: number, n: number): string {
  const r = (scale / 10) * MAX_R;
  return Array.from({ length: n }, (_, i) => {
    const angle = (360 / n) * i;
    const [x, y] = polarToXY(angle, r);
    return `${x},${y}`;
  }).join(" ");
}

function wedgePath(i: number, n: number): string {
  const step = 360 / n;
  const a1 = step * i - step / 2;
  const a2 = step * i + step / 2;
  const [x1, y1] = polarToXY(a1, MAX_R + 35);
  const [x2, y2] = polarToXY(a2, MAX_R + 35);
  return `M ${CX} ${CY} L ${x1} ${y1} A ${MAX_R + 35} ${MAX_R + 35} 0 0 1 ${x2} ${y2} Z`;
}

// ── Radar Chart (labels only) ───────────────────────────────────────

function RadarChart({
  domains,
  selected,
  onSelect,
}: {
  domains: VisionData["domains"];
  selected: string | null;
  onSelect: (id: string | null) => void;
}) {
  const n = domains.length;

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 300 300" className="w-full max-w-[320px] sm:max-w-[380px]">
        {[2, 4, 6, 8, 10].map((s) => (
          <polygon
            key={s}
            points={gridPolygon(s, n)}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="0.5"
          />
        ))}

        {domains.map((_, i) => {
          const angle = (360 / n) * i;
          const [x, y] = polarToXY(angle, MAX_R + 5);
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

        {domains.map((d, i) => {
          const angle = (360 / n) * i;
          const [lx, ly] = polarToXY(angle, MAX_R + 22);
          const isSelected = selected === d.id;

          return (
            <g key={d.id}>
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
              <path
                d={wedgePath(i, n)}
                fill="transparent"
                className="cursor-pointer"
                onClick={() => onSelect(selected === d.id ? null : d.id)}
              />
            </g>
          );
        })}

        <text x={CX} y={CY} textAnchor="middle" fill="rgba(161,161,170,0.5)" fontSize="9" fontWeight="500">
          ASH
        </text>
      </svg>
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

function VisionDestination({ data }: { data: VisionData }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <section className="space-y-3">
      <div className="text-center">
        <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
          3-Year Destination — {data.horizon}
        </h2>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {data.domains.map((d) => (
          <div
            key={d.id}
            className="rounded-xl border border-white/5 bg-zinc-900/40 p-3 cursor-pointer"
            onClick={() => setExpanded(expanded === d.id ? null : d.id)}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: d.hex }} />
              <span className="text-xs font-semibold text-zinc-200">{d.label}</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">{d.threeYearDestination}</p>

            {expanded === d.id && (
              <div className="mt-2 pt-2 border-t border-white/5 space-y-1.5">
                <div>
                  <span className="text-[10px] font-medium text-zinc-500 uppercase">Now</span>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">{d.now}</p>
                </div>
                <div>
                  <span className="text-[10px] font-medium text-zinc-500 uppercase">90-Day</span>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">{d.ninetyDay}</p>
                </div>
                <div>
                  <span className="text-[10px] font-medium text-zinc-500 uppercase">3-Year</span>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">{d.threeYear}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Page ────────────────────────────────────────────────────────────

export default function VisionPage() {
  const [visionData, setVisionData] = useState<VisionData | null>(null);
  const [wheelSelected, setWheelSelected] = useState<string | null>(null);
  const [ikigaiSelected, setIkigaiSelected] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/vision").then(r => r.json()).then(setVisionData);
  }, []);

  if (!visionData) {
    return (
      <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center">
        <div className="text-zinc-500 text-sm">Loading vision...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <div className="p-4 sm:p-6 pb-24">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold mb-1">Vision</h1>
          </div>

          <div className="rounded-xl border border-white/5 bg-zinc-900/40 p-4 text-center">
            <h2 className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-2">
              Identity North Star
            </h2>
            <p className="text-sm text-zinc-300 leading-relaxed max-w-lg mx-auto">
              {visionData.identityNorthStar}
            </p>
          </div>

          <VisionDestination data={visionData} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider text-center">
                Wheel of Life
              </h2>
              <RadarChart domains={visionData.domains} selected={wheelSelected} onSelect={setWheelSelected} />
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
