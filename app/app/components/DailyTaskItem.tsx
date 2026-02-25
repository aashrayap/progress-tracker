"use client";

import { useState } from "react";
import { useDraggable } from "@dnd-kit/react";

interface Props {
  id: string;
  label: string;
  placeholder?: string;
  scheduled: boolean;
}

export default function DailyTaskItem({ id, label, placeholder, scheduled }: Props) {
  const [notes, setNotes] = useState("");

  const { ref, isDragging } = useDraggable({
    id: `daily-${id}`,
    data: { type: "daily", item: label, notes },
    disabled: scheduled,
  });

  return (
    <div
      ref={ref}
      className={`group flex flex-col gap-1 p-2 rounded-lg border transition-colors ${
        scheduled
          ? "bg-zinc-800/30 border-zinc-800 opacity-50"
          : "bg-zinc-800 border-zinc-700 cursor-grab active:cursor-grabbing"
      } ${isDragging ? "opacity-40" : ""}`}
    >
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-blue-500/60 shrink-0" />
        <span className={`text-sm flex-1 ${scheduled ? "text-zinc-500" : "text-zinc-300"}`}>
          {label}
        </span>
        {scheduled && <span className="text-[10px] text-zinc-600">scheduled</span>}
      </div>
      {placeholder && !scheduled && (
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={placeholder}
          onPointerDown={(e) => e.stopPropagation()}
          className="ml-4 px-2 py-1 text-xs bg-zinc-900 border border-zinc-700 rounded text-zinc-400 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
        />
      )}
    </div>
  );
}
