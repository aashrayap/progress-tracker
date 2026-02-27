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

export interface DailySignalEntry {
  date: string;
  signal: string;
  value: string;
  unit: string;
  context: string;
  source: string;
  captureId: string;
  category?: string;
}

export interface InboxEntry {
  captureId: string;
  capturedAt: string;
  source: string;
  rawText: string;
  status: "new" | "needs_review" | "accepted" | "archived" | "failed";
  suggestedDestination: string;
  normalizedText: string;
  error: string;
}

export interface IdeaEntry {
  id: number;
  createdAt: string;
  title: string;
  details: string;
  domain: "app" | "health" | "life" | "system";
  status: "inbox" | "reviewed" | "building" | "archived";
  source: string;
  captureId: string;
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
