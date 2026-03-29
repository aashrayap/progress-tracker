"use client";

import { useState, useEffect, useCallback } from "react";

function formatCurrentTime(): string {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}

export function getCurrentHour(): number {
  const now = new Date();
  return now.getHours() + (now.getMinutes() >= 30 ? 0.5 : 0);
}

interface Props {
  className?: string;
}

export default function NowLine({ className = "" }: Props) {
  const [timeLabel, setTimeLabel] = useState(formatCurrentTime);

  const refresh = useCallback(() => {
    setTimeLabel(formatCurrentTime());
  }, []);

  useEffect(() => {
    refresh();
    const handler = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [refresh]);

  return (
    <div className={`flex items-center gap-2 py-1 ${className}`}>
      <div className="flex-1 h-px bg-emerald-500" />
      <span className="text-[10px] text-emerald-500 font-medium shrink-0">{timeLabel}</span>
      <div className="flex-1 h-px bg-emerald-500" />
    </div>
  );
}
