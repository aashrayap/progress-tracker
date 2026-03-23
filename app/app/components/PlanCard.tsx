"use client";

import { useCallback } from "react";
import PlanBlock from "./PlanBlock";
import NowLine, { getCurrentHour } from "./NowLine";

interface PlanItem {
  date: string;
  start: number;
  end: number;
  item: string;
  done: string;
  notes: string;
}

interface Props {
  plan: PlanItem[];
  planInsight?: string;
  onRefresh: () => void;
}

export default function PlanCard({ plan, planInsight, onRefresh }: Props) {
  const sorted = [...plan].sort((a, b) => a.start - b.start);
  const currentHour = getCurrentHour();
  const drafts = sorted.filter((b) => b.start === 0 && b.end === 0);
  const timed = sorted.filter((b) => !(b.start === 0 && b.end === 0));

  const markDone = useCallback(
    async (item: PlanItem, done: "1" | "0" | "") => {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: item.date,
          start: item.start,
          end: item.end,
          item: item.item,
          done,
          notes: item.notes,
        }),
      });
      if (!res.ok) return;
      onRefresh();
    },
    [onRefresh]
  );

  const pastBlocks = timed.filter((b) => b.end <= currentHour);
  const futureBlocks = timed.filter((b) => b.end > currentHour);
  const showNowLine = pastBlocks.length > 0 && futureBlocks.length > 0;

  return (
    <section className="p-4 bg-zinc-900/60 backdrop-blur-md border border-white/10 rounded-xl">
      <p className="text-[10px] uppercase tracking-wide text-zinc-500 mb-3">Today&apos;s Plan</p>

      {planInsight && (
        <p className="text-zinc-300 text-sm mb-3">{planInsight}</p>
      )}

      {sorted.length === 0 ? (
        <p className="text-zinc-500 text-sm">No blocks planned. Run /checkin to plan your day.</p>
      ) : (
        <div>
          {drafts.length > 0 && (
            <div className="mb-3">
              <p className="text-[10px] uppercase tracking-wide text-purple-400 mb-1">Priorities</p>
              {drafts.map((b, idx) => (
                <PlanBlock
                  key={`draft-${b.date}-${b.item}-${idx}`}
                  start={b.start}
                  end={b.end}
                  item={b.item}
                  done={b.done}
                  date={b.date}
                  isPast={false}
                  onToggleDone={() => markDone(b, b.done === "1" ? "" : "1")}
                  onMarkMissed={() => markDone(b, "0")}
                />
              ))}
            </div>
          )}
          {pastBlocks.map((b, idx) => (
            <PlanBlock
              key={`${b.date}-${b.start}-${b.end}-${b.item}-${idx}`}
              start={b.start}
              end={b.end}
              item={b.item}
              done={b.done}
              date={b.date}
              isPast={true}
              onToggleDone={() => markDone(b, b.done === "1" ? "" : "1")}
              onMarkMissed={() => markDone(b, "0")}
            />
          ))}
          {showNowLine && <NowLine />}
          {futureBlocks.map((b, idx) => (
            <PlanBlock
              key={`${b.date}-${b.start}-${b.end}-${b.item}-${idx}`}
              start={b.start}
              end={b.end}
              item={b.item}
              done={b.done}
              date={b.date}
              isPast={false}
              onToggleDone={() => markDone(b, b.done === "1" ? "" : "1")}
              onMarkMissed={() => markDone(b, "0")}
            />
          ))}
        </div>
      )}
    </section>
  );
}
