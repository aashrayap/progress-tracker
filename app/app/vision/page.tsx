"use client";

import { useState } from "react";

// ── Data types ──────────────────────────────────────────────────────

type Dimension = {
  id: string;
  label: string;
  satisfaction: number;
  alignment: number;
  hex: string;
  notes: string;
};

type AntiGoal = { text: string; dimensions: string[] };
type BpsSegment = { text: string; dimensions: string[] };
type OdysseyPath = {
  title: string;
  description: string;
  engagement: number;
  confidence: number;
  coherence: number;
  resources: number;
  dimensions: string[];
};

// ── Session data (March 2026) ───────────────────────────────────────

const DIMENSIONS: Dimension[] = [
  { id: "health", label: "Health & Body", satisfaction: 3, alignment: 5, hex: "#10b981", notes: "Gym habit sticky, eating is weak link especially traveling. More green days recently" },
  { id: "addiction", label: "Addiction", satisfaction: 4, alignment: 6, hex: "#ef4444", notes: "Weed streak building. Routine changes and stress break things. Awareness is high" },
  { id: "career", label: "Career", satisfaction: 5, alignment: 5, hex: "#3b82f6", notes: "Doing the work but closed off in room. Lone wolf. Not in spaces where opportunities compound" },
  { id: "relationships", label: "Relationships", satisfaction: 3, alignment: 5, hex: "#ec4899", notes: "Basia: long-distance, plan to close gap. Need positive-sum friendships. Family strong" },
  { id: "growth", label: "Growth", satisfaction: 5, alignment: 7, hex: "#a855f7", notes: "Personal OS creating daily insights. Direction right, accelerating" },
  { id: "finances", label: "Finances", satisfaction: 6, alignment: 6, hex: "#f59e0b", notes: "200k income, 600k NW. Want 10-20M by 40s. On a path but vision unclear on why" },
  { id: "fun", label: "Fun", satisfaction: 6, alignment: 4, hex: "#14b8a6", notes: "Poker is fun but zero-sum. Want positive-sum hobbies that build relationships" },
  { id: "mental", label: "Mental", satisfaction: 4, alignment: 5, hex: "#818cf8", notes: "Coming out of low from weed binge. Meditation is the lever. Improving" },
];

const ANTI_GOALS: AntiGoal[] = [
  { text: "I refuse to be someone who numbs instead of acts — masking problems with weed, junk food, or screens instead of facing them", dimensions: ["addiction", "mental", "health"] },
  { text: "I refuse to be isolated in my room in 1, 3, or 5 years — no local friends, no weekend plans, closed off from the world", dimensions: ["relationships", "career", "fun"] },
  { text: "I refuse to have money but no relationships — the Harvard study says relationships are what matter at the end", dimensions: ["finances", "relationships"] },
  { text: "I refuse to look back and feel trapped by missed opportunity — not becoming the best person I could have been when I had the chance", dimensions: ["career", "growth", "fun"] },
  { text: "I refuse to keep knowing what's wrong without changing — awareness without action is sophisticated avoidance", dimensions: ["growth", "mental", "addiction"] },
];

const BPS_SEGMENTS: BpsSegment[] = [
  { text: "Wake up next to my partner in a clean room, energized. Gained insight into perception and sensation through Advaita and truth-seeking.", dimensions: ["relationships", "mental", "growth"] },
  { text: "Put on gym clothes, walk and exercise for an hour. Sauna, cold shower. Ready to start the day.", dimensions: ["health"] },
  { text: "Journal plans for the day. Make a plan to succeed.", dimensions: ["growth", "mental"] },
  { text: "Drive to the office. Surrounded by people with a mutual goal and love for what we're building. Own business — leveraging technology to impact people in finance, therapy, meditation, or productivity. Trustworthy relationships that compound.", dimensions: ["career", "relationships", "finances"] },
  { text: "Come home. Girlfriend says we have Friday plans at someone's house. Morning exercise group on Saturday, then coffee. Jam-packed weekend — have to turn things down. So many plans that I look forward to just staying home.", dimensions: ["relationships", "fun"] },
  { text: "Best shape of my life. 200 lbs. Prioritize longevity. Run twice a week, weight training 30-60 min daily.", dimensions: ["health"] },
  { text: "Evenings: walk with dog, sometimes girlfriend, listening to a podcast. Mind is clear — understand my neuroscience and what makes me tick. Healthy dinner. Make love. Watch a show, do some work.", dimensions: ["mental", "relationships", "health", "fun"] },
];

const ODYSSEY_PATHS: OdysseyPath[] = [
  {
    title: "Same Room",
    description: "Stay WFH, hide from the world. Even with sobriety — no new experiences, no transformation.",
    engagement: 0, confidence: 5, coherence: 0, resources: 5,
    dimensions: [],
  },
  {
    title: "The Pivot",
    description: "Leave job during merger. Office downtown. Connections, compounding relationships with good-values people.",
    engagement: 3, confidence: 2, coherence: 4, resources: 2,
    dimensions: ["career", "relationships", "fun"],
  },
  {
    title: "The Transformation",
    description: "Quit. Move to Taiwan. Meditation, learning, transforming the mind before career. The path of happiness.",
    engagement: 4, confidence: 4, coherence: 4, resources: 3,
    dimensions: ["mental", "growth", "health"],
  },
];

// ── Radar chart helpers ─────────────────────────────────────────────

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

// ── Radar Chart Component ───────────────────────────────────────────

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
        {/* Grid lines */}
        {[2, 4, 6, 8, 10].map((s) => (
          <polygon
            key={s}
            points={gridOctagon(s)}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="0.5"
          />
        ))}

        {/* Axis lines */}
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

        {/* Alignment polygon (outer) */}
        <polygon
          points={alignPoints}
          fill="rgba(168,85,247,0.08)"
          stroke="rgba(168,85,247,0.4)"
          strokeWidth="1.5"
          strokeDasharray="4 2"
        />

        {/* Satisfaction polygon (inner) */}
        <polygon
          points={satPoints}
          fill="rgba(59,130,246,0.12)"
          stroke="rgba(59,130,246,0.6)"
          strokeWidth="1.5"
        />

        {/* Data points + labels */}
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
              {/* Satisfaction point */}
              <circle
                cx={sx}
                cy={sy}
                r={isSelected ? 4.5 : 3}
                fill={isSelected ? d.hex : "rgba(59,130,246,0.8)"}
                stroke={isSelected ? d.hex : "none"}
                strokeWidth="1"
                className="transition-all duration-200"
              />
              {/* Alignment point */}
              <circle
                cx={ax}
                cy={ay}
                r={isSelected ? 4.5 : 3}
                fill="none"
                stroke={isSelected ? d.hex : "rgba(168,85,247,0.6)"}
                strokeWidth="1.5"
                className="transition-all duration-200"
              />
              {/* Label */}
              <text
                x={lx}
                y={ly}
                textAnchor="middle"
                dominantBaseline="central"
                className="transition-all duration-200"
                fill={isSelected ? d.hex : "rgba(161,161,170,0.7)"}
                fontSize={isSelected ? "10" : "9"}
                fontWeight={isSelected ? "600" : "400"}
              >
                {d.label}
              </text>
              {/* Score below label */}
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
              {/* Clickable wedge (invisible) */}
              <path
                d={wedgePath(i)}
                fill="transparent"
                className="cursor-pointer"
                onClick={() => onSelect(selected === d.id ? null : d.id)}
              />
            </g>
          );
        })}

        {/* Center label */}
        <text
          x={CX}
          y={CY - 4}
          textAnchor="middle"
          fill="rgba(161,161,170,0.5)"
          fontSize="9"
          fontWeight="500"
        >
          ASH
        </text>
        <text
          x={CX}
          y={CY + 8}
          textAnchor="middle"
          fill="rgba(161,161,170,0.3)"
          fontSize="7"
        >
          sat / align
        </text>
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2 text-[10px] text-zinc-500">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-0.5 bg-blue-500/60 rounded inline-block" /> Satisfaction
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-0.5 border border-purple-500/60 rounded inline-block border-dashed" /> Alignment
        </span>
      </div>

      {/* Selected dimension detail */}
      {selected && (
        <div
          className="mt-3 px-4 py-2.5 rounded-xl border max-w-sm text-center transition-all duration-200"
          style={{
            borderColor: `${DIMENSIONS.find((d) => d.id === selected)!.hex}33`,
            backgroundColor: `${DIMENSIONS.find((d) => d.id === selected)!.hex}0a`,
          }}
        >
          <p className="text-zinc-300 text-xs leading-relaxed">
            {DIMENSIONS.find((d) => d.id === selected)!.notes}
          </p>
        </div>
      )}
    </div>
  );
}

function wedgePath(i: number): string {
  const a1 = dimAngle(i) - 360 / N / 2;
  const a2 = dimAngle(i) + 360 / N / 2;
  const [x1, y1] = polarToXY(a1, MAX_R + 35);
  const [x2, y2] = polarToXY(a2, MAX_R + 35);
  return `M ${CX} ${CY} L ${x1} ${y1} A ${MAX_R + 35} ${MAX_R + 35} 0 0 1 ${x2} ${y2} Z`;
}

// ── Highlight helper ────────────────────────────────────────────────

function isHighlighted(
  dims: string[],
  selected: string | null
): "on" | "off" | "neutral" {
  if (!selected) return "neutral";
  return dims.includes(selected) ? "on" : "off";
}

function hlClass(state: "on" | "off" | "neutral"): string {
  if (state === "on") return "opacity-100";
  if (state === "off") return "opacity-30";
  return "opacity-100";
}

// ── Section Components ──────────────────────────────────────────────

function AntiGoalsSection({ selected }: { selected: string | null }) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-red-400/80 uppercase tracking-wider mb-3">
        Anti-Goals
      </h2>
      <div className="space-y-2">
        {ANTI_GOALS.map((ag, i) => {
          const state = isHighlighted(ag.dimensions, selected);
          const dim = selected ? DIMENSIONS.find((d) => d.id === selected) : null;
          return (
            <div
              key={i}
              className={`rounded-xl border border-white/5 bg-zinc-900/40 px-4 py-3 transition-all duration-200 ${hlClass(state)}`}
              style={
                state === "on" && dim
                  ? { borderColor: `${dim.hex}33`, backgroundColor: `${dim.hex}08` }
                  : undefined
              }
            >
              <p className="text-zinc-300 text-sm leading-relaxed">{ag.text}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function BestPossibleSelfSection({ selected }: { selected: string | null }) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-purple-400/80 uppercase tracking-wider mb-3">
        Best Possible Self — March 2028
      </h2>
      <div className="rounded-xl border border-white/5 bg-zinc-900/40 px-4 py-4">
        <div className="space-y-3">
          {BPS_SEGMENTS.map((seg, i) => {
            const state = isHighlighted(seg.dimensions, selected);
            const dim = selected
              ? DIMENSIONS.find((d) => d.id === selected)
              : null;
            return (
              <p
                key={i}
                className={`text-sm leading-relaxed transition-all duration-200 ${hlClass(state)} ${
                  state === "on" ? "text-zinc-200" : "text-zinc-400"
                }`}
                style={
                  state === "on" && dim
                    ? {
                        borderLeft: `2px solid ${dim.hex}66`,
                        paddingLeft: "12px",
                      }
                    : { borderLeft: "2px solid transparent", paddingLeft: "12px" }
                }
              >
                {seg.text}
              </p>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function OdysseySection({ selected }: { selected: string | null }) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-blue-400/80 uppercase tracking-wider mb-3">
        Odyssey Plan — Three Paths
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {ODYSSEY_PATHS.map((path) => {
          const state = isHighlighted(path.dimensions, selected);
          const dim = selected
            ? DIMENSIONS.find((d) => d.id === selected)
            : null;
          const total =
            path.engagement + path.confidence + path.coherence + path.resources;
          const ratings = [
            { label: "Eng", value: path.engagement },
            { label: "Conf", value: path.confidence },
            { label: "Cohr", value: path.coherence },
            { label: "Res", value: path.resources },
          ];
          return (
            <div
              key={path.title}
              className={`rounded-xl border border-white/5 bg-zinc-900/40 p-4 transition-all duration-200 ${hlClass(state)}`}
              style={
                state === "on" && dim
                  ? { borderColor: `${dim.hex}33`, backgroundColor: `${dim.hex}08` }
                  : undefined
              }
            >
              <div className="flex items-baseline justify-between mb-1">
                <h3 className="text-sm font-semibold text-zinc-200">
                  {path.title}
                </h3>
                <span className="text-xs text-zinc-500">{total}/20</span>
              </div>
              <p className="text-xs text-zinc-500 mb-3 leading-relaxed">
                {path.description}
              </p>
              <div className="space-y-1.5">
                {ratings.map((r) => (
                  <div key={r.label} className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-500 w-7">
                      {r.label}
                    </span>
                    <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${(r.value / 5) * 100}%`,
                          backgroundColor:
                            r.value >= 4
                              ? "#10b981"
                              : r.value >= 2
                                ? "#f59e0b"
                                : r.value > 0
                                  ? "#ef4444"
                                  : "#27272a",
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-zinc-600 w-3 text-right">
                      {r.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ── Core Question ───────────────────────────────────────────────────

function CoreQuestionSection() {
  return (
    <section className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-4">
      <h2 className="text-sm font-semibold text-amber-400/80 uppercase tracking-wider mb-2">
        The Core Question
      </h2>
      <p className="text-zinc-300 text-sm leading-relaxed">
        Finding my &quot;why.&quot; Everything flows from it. The current why —{" "}
        <em className="text-zinc-400">
          &quot;Trade escape for building systems and habits where I can operate
          at a level to change the world for the better&quot;
        </em>{" "}
        — is structured as escape <em>from</em>, not moving <em>toward</em>. The
        vision exercises are working to flip that.
      </p>
    </section>
  );
}

// ── Page ────────────────────────────────────────────────────────────

export default function VisionPage() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <div className="p-4 sm:p-6 pb-24">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100 mb-1">
              Vision
            </h1>
            <p className="text-zinc-500 text-sm">
              Tap a dimension to highlight related content below
            </p>
          </div>

          {/* Radar Chart */}
          <RadarChart selected={selected} onSelect={setSelected} />

          {/* Core Question */}
          <CoreQuestionSection />

          {/* Anti-Goals */}
          <AntiGoalsSection selected={selected} />

          {/* Best Possible Self */}
          <BestPossibleSelfSection selected={selected} />

          {/* Odyssey Plan */}
          <OdysseySection selected={selected} />

          {/* Session date */}
          <p className="text-center text-zinc-700 text-xs">
            Vision session — March 3, 2026
          </p>
        </div>
      </div>
    </div>
  );
}
