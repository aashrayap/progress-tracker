"use client";

import { useCallback, useEffect, useState } from "react";
import type { VisionData, VisionDomain, Distractions, InputControl, HabitAudit } from "../lib/types";
import ExperimentsTable from "../components/ExperimentsTable";

// ── Hub data types (mirrored from page.tsx) ──────────────────────────

interface HubData {
  experiments: {
    current: { name: string; dayCount: number; durationDays: number; domain: string; isExpired: boolean }[];
    past: { name: string; verdict: string; reflection: string; startDate: string }[];
  };
}

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

// ── Page ─────────────────────────────────────────────────────────────

export default function VisionPage() {
  const [vision, setVision] = useState<VisionData | null>(null);
  const [hub, setHub] = useState<HubData | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchAll = useCallback(() => {
    Promise.all([
      fetch("/api/vision").then((r) => r.ok ? r.json() : null),
      fetch("/api/hub").then((r) => r.ok ? r.json() : null),
    ]).then(([visionData, hubData]) => {
      setVision(visionData);
      setHub(hubData);
      setLoading(false);
    }).catch((err) => {
      console.error("Failed to load vision data:", err);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

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

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <div className="p-4 sm:p-6 pb-24">
        <div className="max-w-[85rem] mx-auto space-y-5">

          {/* ═══════════════════════════════════════════════════════════
              ZONE 1: Daily Read (fits in ~1 viewport)
              ═══════════════════════════════════════════════════════ */}

          {/* ── 0. Philosophy ─────────────────────────────────────── */}
          {vision.philosophy && (
            <section className="px-4 py-3 bg-zinc-900/40 border border-white/5 rounded-xl">
              <p className="text-sm text-zinc-400 italic leading-relaxed">{vision.philosophy}</p>
            </section>
          )}

          {/* ── 1. Anti-Vision (always visible) ─────────────────────── */}
          <section className="p-4 bg-zinc-900/60 backdrop-blur-md border border-white/10 border-l-2 border-l-red-500/30 rounded-xl">
            <h2 className="text-xs text-zinc-400 uppercase tracking-wide font-medium mb-3">Anti-Vision</h2>
            <div className="space-y-2">
              {(["health", "wealth", "love", "self"] as const).map((pillar) => (
                <div key={pillar} className="flex gap-3">
                  <span className="text-zinc-500 text-xs uppercase tracking-wide w-14 shrink-0 pt-0.5">{pillar}</span>
                  <span className="text-sm text-zinc-300">{vision.antiVision[pillar]}</span>
                </div>
              ))}
            </div>
          </section>

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

          {/* ── 4. North Star (collapsed) ──────────────────────────── */}
          <CollapsibleSection title="North Star" defaultOpen>
            <div className="grid grid-cols-2 gap-3">
              {vision.domains.map((domain) => (
                <NorthStarCard key={domain.id} domain={domain} />
              ))}
            </div>
          </CollapsibleSection>

          {/* ── 7. Experiments (collapsed) ───────────────────────────── */}
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

    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────

function NorthStarCard({ domain }: { domain: VisionDomain }) {
  return (
    <div
      className="bg-zinc-900/60 backdrop-blur-md border border-white/10 rounded-xl p-4 border-l-4"
      style={{ borderLeftColor: domain.hex }}
    >
      <h3 className="text-sm font-semibold text-zinc-100 mb-2">{domain.label}</h3>
      <div className="space-y-2">
        {domain.fundamentals && (domain.fundamentals.universal.length > 0 || domain.fundamentals.personal.length > 0) && (
          <div className="pb-2 border-b border-white/5">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wide">Fundamentals</span>
            {domain.fundamentals.universal.length > 0 && (
              <div className="mt-1">
                <span className="text-[9px] text-zinc-600 uppercase tracking-wide">Universal</span>
                <ul className="mt-0.5 space-y-0.5">
                  {domain.fundamentals.universal.map((f, i) => (
                    <li key={i} className="text-xs text-zinc-400 flex gap-1.5">
                      <span className="text-zinc-600">-</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {domain.fundamentals.personal.length > 0 && (
              <div className="mt-1.5">
                <span className="text-[9px] text-zinc-600 uppercase tracking-wide">Personal</span>
                <ul className="mt-0.5 space-y-0.5">
                  {domain.fundamentals.personal.map((f, i) => (
                    <li key={i} className="text-xs text-zinc-400 flex gap-1.5">
                      <span className="text-zinc-600">-</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
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
        <p className="text-xs text-zinc-400 leading-relaxed mt-0.5 whitespace-pre-line">{value}</p>
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
