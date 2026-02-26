"use client";

import { useDraggable } from "@dnd-kit/react";

interface Props {
  id: number;
  item: string;
  done: boolean;
  onToggle: (id: number, done: boolean) => void;
  onDelete: (id: number) => void;
}

export default function TodoItem({ id, item, done, onToggle, onDelete }: Props) {
  const { ref, isDragging } = useDraggable({
    id: `todo-${id}`,
    data: { type: "todo", todoId: id, item },
    disabled: done,
  });

  return (
    <div
      ref={ref}
      className={`group flex items-center gap-2 p-2 rounded-lg border transition-colors min-h-[44px] ${
        done
          ? "bg-zinc-800/30 border-zinc-800"
          : "bg-zinc-800 border-zinc-700 cursor-grab active:cursor-grabbing"
      } ${isDragging ? "opacity-40" : ""}`}
    >
      <button
        onClick={() => onToggle(id, !done)}
        className={`w-6 h-6 rounded border flex items-center justify-center text-xs shrink-0 ${
          done ? "border-green-600 text-green-400" : "border-zinc-600 text-zinc-600 hover:border-zinc-500"
        }`}
      >
        {done ? "✓" : ""}
      </button>
      <span className={`text-sm flex-1 ${done ? "text-zinc-500 line-through" : "text-zinc-300"}`}>
        {item}
      </span>
      <button
        onClick={() => onDelete(id)}
        className="text-zinc-600 hover:text-red-400 text-sm p-1 opacity-0 group-hover:opacity-100 transition-opacity min-w-[28px] min-h-[28px] flex items-center justify-center"
      >
        ✕
      </button>
    </div>
  );
}
