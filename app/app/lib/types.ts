export interface Todo {
  id: number;
  item: string;
  done: number;
  created: string;
}

export interface PlanEvent {
  date: string;
  start: number;
  end: number;
  item: string;
  done: string;
  notes: string;
}

export interface LogEntry {
  date: string;
  metric: string;
  value: string;
  notes: string;
}

export type HabitMap = Record<string, Record<string, boolean>>;

export type ZoomLevel = "year" | "month" | "week" | "day";

export interface ReflectionEntry {
  date: string;
  domain: string;
  win: string;
  lesson: string;
  change: string;
}
