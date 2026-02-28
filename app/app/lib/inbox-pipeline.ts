import {
  appendReflection,
  appendTodo,
  readReflections,
  readTodos,
  type InboxEntry,
} from "./csv";
import { toDateStr } from "./utils";

export type InboxDestination =
  | "todos"
  | "reflections"
  | "daily_signals"
  | "manual"
  | "inbox";

export interface RouteResult {
  ok: boolean;
  destination: InboxDestination;
  created: boolean;
  reason?: string;
}

function normalizeDestination(raw: string | null | undefined): InboxDestination {
  const v = String(raw || "")
    .trim()
    .toLowerCase();

  if (v === "idea" || v === "ideas") return "todos";
  if (v === "todo" || v === "todos") return "todos";
  if (v === "reflection" || v === "reflections" || v === "reflections+ideas") return "reflections";
  if (v === "daily_signal" || v === "daily-signals" || v === "daily_signals") {
    return "daily_signals";
  }
  if (v === "question" || v === "workouts" || v === "none") return "manual";
  if (v === "manual") return "manual";
  return "inbox";
}

function inferReflectionDomain(text: string):
  | "gym"
  | "addiction"
  | "deep_work"
  | "eating"
  | "sleep" {
  const t = text.toLowerCase();

  if (t.includes("gym") || t.includes("lift") || t.includes("workout")) return "gym";
  if (t.includes("sleep") || t.includes("bed")) return "sleep";
  if (t.includes("eat") || t.includes("meal") || t.includes("calorie")) return "eating";
  if (t.includes("deep work") || t.includes("focus") || t.includes("coding")) return "deep_work";
  return "addiction";
}

function routeToTodos(entry: InboxEntry): RouteResult {
  const text = (entry.normalizedText || entry.rawText || "").trim();
  if (!text) {
    return {
      ok: false,
      destination: "todos",
      created: false,
      reason: "Cannot create todo from empty text",
    };
  }

  const existingOpen = readTodos().find((todo) => todo.done === 0 && todo.item.trim() === text);
  if (existingOpen) {
    return {
      ok: true,
      destination: "todos",
      created: false,
      reason: "Matching open todo already exists",
    };
  }

  appendTodo(text);
  return { ok: true, destination: "todos", created: true };
}

function routeToReflections(entry: InboxEntry): RouteResult {
  const text = (entry.normalizedText || entry.rawText || "").trim();
  if (!text) {
    return {
      ok: false,
      destination: "reflections",
      created: false,
      reason: "Cannot create reflection from empty text",
    };
  }

  const date = entry.capturedAt ? toDateStr(new Date(entry.capturedAt)) : toDateStr(new Date());
  const domain = inferReflectionDomain(text);

  const duplicate = readReflections().some(
    (r) => r.date === date && r.domain === domain && r.lesson.trim() === text
  );
  if (duplicate) {
    return {
      ok: true,
      destination: "reflections",
      created: false,
      reason: "Matching reflection already exists",
    };
  }

  appendReflection({
    date,
    domain,
    win: "",
    lesson: text,
    change: "",
  });

  return { ok: true, destination: "reflections", created: true };
}

export function routeInboxEntry(entry: InboxEntry, requestedDestination?: string): RouteResult {
  const destination = normalizeDestination(requestedDestination || entry.suggestedDestination);

  if (destination === "todos") return routeToTodos(entry);
  if (destination === "reflections") return routeToReflections(entry);

  if (destination === "daily_signals") {
    return {
      ok: false,
      destination,
      created: false,
      reason: "daily_signals routing is not yet implemented; set destination to todos/reflections",
    };
  }

  if (destination === "manual" || destination === "inbox") {
    return {
      ok: false,
      destination,
      created: false,
      reason: "Pick a concrete destination before accepting",
    };
  }

  return {
    ok: false,
    destination,
    created: false,
    reason: "Unsupported destination",
  };
}
