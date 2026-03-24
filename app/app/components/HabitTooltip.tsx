"use client";

import { useEffect, useState } from "react";

interface HabitTooltipProps {
  dateStr: string;
  columnIndex: number;
  gridRef: React.RefObject<HTMLDivElement | null>;
  score?: number | null;
}

export default function HabitTooltip({ dateStr, columnIndex, gridRef, score }: HabitTooltipProps) {
  const [, month, day] = dateStr.split("-").map(Number);
  const date = new Date(
    parseInt(dateStr.split("-")[0]),
    month - 1,
    day
  );
  const label = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const [leftOffset, setLeftOffset] = useState<number | null>(null);

  useEffect(() => {
    if (!gridRef.current) return;
    const cell = gridRef.current.querySelector(`[data-col="${columnIndex}"]`) as HTMLElement | null;
    if (!cell) return;
    const gridRect = gridRef.current.getBoundingClientRect();
    const cellRect = cell.getBoundingClientRect();
    setLeftOffset(cellRect.left - gridRect.left + cellRect.width / 2);
  }, [columnIndex, gridRef]);

  if (leftOffset === null) return null;

  return (
    <div
      className="absolute z-50 pointer-events-none"
      style={{
        left: `${leftOffset}px`,
        top: "-8px",
        transform: "translate(-50%, -100%)",
      }}
    >
      <div className="px-2.5 py-1.5 bg-zinc-800 border border-white/20 rounded-lg text-xs text-zinc-200 whitespace-nowrap shadow-xl">
        {label}{score !== null && score !== undefined ? ` · ${score}/9` : ""}
      </div>
      <div className="flex justify-center">
        <div
          className="w-0 h-0"
          style={{
            borderLeft: "5px solid transparent",
            borderRight: "5px solid transparent",
            borderTop: "5px solid rgb(39 39 42)",
          }}
        />
      </div>
    </div>
  );
}
