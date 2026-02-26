"use client";

import { useRef, useEffect } from "react";
import { useDroppable } from "@dnd-kit/react";
import TimelineItem from "./TimelineItem";
import { formatTime } from "../lib/utils";

interface PlanItem {
  start: number;
  end: number;
  item: string;
  done: string;
  notes: string;
}

interface Props {
  plan: PlanItem[];
  onDeleteItem: (item: string) => void;
}

const HOUR_HEIGHT = 60;
const SLOT_HEIGHT = HOUR_HEIGHT / 2;
const START_HOUR = 6;
const END_HOUR = 24;
const SLOTS = Array.from(
  { length: (END_HOUR - START_HOUR) * 2 },
  (_, i) => START_HOUR + i * 0.5
);

function TimeSlot({ time }: { time: number }) {
  const isFullHour = time % 1 === 0;
  const { ref, isDropTarget } = useDroppable({
    id: `slot-${time}`,
    data: { type: "hour", hour: time },
  });

  return (
    <div
      ref={ref}
      className={`relative transition-colors ${
        isFullHour ? "border-t border-zinc-800" : "border-t border-zinc-800/30"
      } ${isDropTarget ? "bg-blue-500/10" : ""}`}
      style={{ height: SLOT_HEIGHT }}
    >
      {isFullHour && (
        <span className="absolute -top-3 left-0 text-xs text-zinc-600 w-14 text-right pr-3">
          {formatTime(time)}
        </span>
      )}
    </div>
  );
}

export default function Timeline({ plan, onDeleteItem }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollRef.current) return;
    const now = new Date().getHours();
    const scrollTo = Math.max(0, (now - START_HOUR - 1) * HOUR_HEIGHT);
    scrollRef.current.scrollTop = scrollTo;
  }, []);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto relative">
      <div className="relative" style={{ height: SLOTS.length * SLOT_HEIGHT }}>
        {SLOTS.map((time) => (
          <TimeSlot key={time} time={time} />
        ))}

        <CurrentTimeLine />

        {/* Fixed sleep block at 10pm */}
        <div
          className="absolute left-16 right-2 z-10 rounded-lg px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/30"
          style={{
            top: (22 - START_HOUR) * HOUR_HEIGHT,
            height: HOUR_HEIGHT,
          }}
        >
          <span className="text-xs text-indigo-400">Sleep</span>
          <span className="text-[10px] text-indigo-400/50 ml-2">10pm — fixed</span>
        </div>

        {plan.map((item) => (
          <TimelineItem
            key={item.item}
            item={item.item}
            start={item.start}
            end={item.end}
            done={item.done}
            notes={item.notes}
            onDelete={onDeleteItem}
          />
        ))}
      </div>
    </div>
  );
}

function CurrentTimeLine() {
  const now = new Date();
  const hours = now.getHours() + now.getMinutes() / 60;
  if (hours < START_HOUR || hours > END_HOUR) return null;

  return (
    <div
      className="absolute left-14 right-0 z-20 pointer-events-none"
      style={{ top: (hours - START_HOUR) * HOUR_HEIGHT }}
    >
      <div className="flex items-center">
        <div className="w-2 h-2 rounded-full bg-red-500" />
        <div className="flex-1 h-px bg-red-500/50" />
      </div>
    </div>
  );
}
