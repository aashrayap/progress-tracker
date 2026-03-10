"use client";

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

  // Position tooltip above the column
  // Each cell is w-6 (24px) with gap-1 (4px), label is w-[4.5rem] (72px) + gap-2.5 (10px)
  const cellWidth = 24;
  const cellGap = 4;
  const labelWidth = 72;
  const labelGap = 10;
  const leftOffset = labelWidth + labelGap + columnIndex * (cellWidth + cellGap) + cellWidth / 2;

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
        {label}{score !== null && score !== undefined ? ` · ${score}/8` : ""}
      </div>
      <div className="flex justify-center">
        <div
          className="w-0 h-0"
          style={{
            borderLeft: "5px solid transparent",
            borderRight: "5px solid transparent",
            borderTop: "5px solid rgb(39 39 42)", // zinc-800
          }}
        />
      </div>
    </div>
  );
}
