"use client";

import { useDraggable } from "@dnd-kit/react";

interface Props {
  item: string;
  start: number;
  end: number;
  done: string;
  notes?: string;
  onDelete: (item: string) => void;
}

const HOUR_HEIGHT = 60;

function formatTime(t: number): string {
  const hour = Math.floor(t);
  const min = t % 1 === 0.5 ? "30" : "00";
  const ampm = hour >= 12 ? "pm" : "am";
  const h = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${h}${min === "00" ? "" : ":" + min}${ampm}`;
}

export default function TimelineItem({ item, start, end, done, notes, onDelete }: Props) {
  const duration = Math.max(end - start, 0.5);
  const height = duration * HOUR_HEIGHT;

  const { ref, isDragging } = useDraggable({
    id: `plan-${item}`,
    data: { type: "plan", item, start, end, duration, notes },
  });

  const isDone = done === "1";

  return (
    <div
      ref={ref}
      className={`absolute left-16 right-2 rounded-lg border px-3 py-1.5 cursor-grab active:cursor-grabbing group transition-colors ${
        isDone
          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
          : "bg-blue-500/15 border-blue-500/30 text-blue-300 hover:border-blue-400/50"
      } ${isDragging ? "opacity-40 z-50" : "z-10"}`}
      style={{
        top: (start - 6) * HOUR_HEIGHT,
        height: Math.max(height, 30),
      }}
    >
      <div className="flex items-center justify-between h-full">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{item}</p>
          {notes && <p className="text-xs opacity-50 truncate">{notes}</p>}
          {height >= 40 && (
            <p className="text-xs opacity-60">
              {formatTime(start)}–{formatTime(end)}
            </p>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item);
          }}
          className="text-xs opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity shrink-0 ml-2"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
