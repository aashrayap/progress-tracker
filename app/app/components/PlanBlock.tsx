"use client";

import { formatTime } from "../lib/utils";

interface Props {
  start: number;
  end: number;
  item: string;
  done: string;
  date: string;
  isPast: boolean;
  onToggleDone: () => void;
  onMarkMissed: () => void;
}

export default function PlanBlock({ start, end, item, done, isPast, onToggleDone, onMarkMissed }: Props) {
  const isDone = done === "1";
  const isMissed = done === "0";
  const isDraft = start === 0 && end === 0;
  const effectivelyPast = isDraft ? false : isPast;

  return (
    <div className={`flex items-center gap-3 py-2 border-b border-white/10 last:border-0 min-h-[44px] ${effectivelyPast ? "opacity-50" : ""}`}>
      <button
        onClick={onToggleDone}
        className={`w-6 h-6 rounded border flex items-center justify-center text-xs shrink-0 ${
          isDone
            ? "border-emerald-600 text-emerald-400"
            : isMissed
              ? "border-red-600 text-red-400"
              : "border-white/20 text-zinc-600"
        }`}
      >
        {isDone ? "☑" : isMissed ? "✗" : "☐"}
      </button>
      {!isDraft && (
        <span className="text-xs text-zinc-400 w-24 shrink-0">
          {formatTime(start)}–{formatTime(end)}
        </span>
      )}
      <span className={`text-sm ${isDone ? "text-zinc-400 line-through" : "text-zinc-300"}`}>
        {item}
      </span>
      {effectivelyPast && done === "" && (
        <button
          onClick={onMarkMissed}
          className="ml-auto text-[10px] text-zinc-500 hover:text-red-400"
        >
          missed
        </button>
      )}
    </div>
  );
}
