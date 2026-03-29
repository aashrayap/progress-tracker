import { toDateStr } from "./utils";
import { getWeekStart } from "./date-utils";

export type TimeframeKey = "week" | "month";

export interface TimeframeWindow {
  key: TimeframeKey;
  label: string;
  startDate: string;
  endDate: string;
}

function startOfCurrentWeek(now: Date): Date {
  return getWeekStart(now);
}

function startOfCurrentMonth(now: Date): Date {
  const d = new Date(now.getFullYear(), now.getMonth(), 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function resolveTimeframeWindow(raw: string | null | undefined): TimeframeWindow {
  const key: TimeframeKey = raw === "month" ? "month" : "week";
  const now = new Date();

  const start =
    key === "month" ? startOfCurrentMonth(now) : startOfCurrentWeek(now);

  return {
    key,
    label: key === "month" ? "This Month" : "This Week",
    startDate: toDateStr(start),
    endDate: toDateStr(now),
  };
}

