import {
  appendDailySignals,
  appendWorkouts,
  readDailySignals,
  readPlan,
  upsertPlanEntry,
  appendReflection,
  appendTodo,
  appendGrocery,

  type PlanEntry,
  type WorkoutSetEntry,
  type ReflectionEntry,
} from "./csv";
import type { DailySignalEntry } from "./types";
import { todayStr } from "./utils";
import path from "path";

export type WriteType = "workout" | "signal" | "reflection" | "todo" | "grocery" | "plan";

export interface WriteResult {
  primary: { file: string; rowsWritten: number };
  sideEffects: { rule: string; file: string; action: string }[];
}

// Single source of truth lives in scripts/config.js — dynamic require avoids Turbopack static analysis
// eslint-disable-next-line @typescript-eslint/no-require-imports, no-eval
const { SIGNAL_TO_PLAN_KEYWORD }: { SIGNAL_TO_PLAN_KEYWORD: Record<string, string> } =
  eval("require")(path.resolve(process.cwd(), "../scripts/config"));

function markPlanItemDone(date: string, signal: string): { rule: string; file: string; action: string } | null {
  const keyword = SIGNAL_TO_PLAN_KEYWORD[signal];
  if (!keyword) return null;

  const plan = readPlan();
  const match = plan.find(
    (p) => p.date === date && p.item.toLowerCase().includes(keyword) && p.done !== "1"
  );
  if (!match) return null;

  upsertPlanEntry({ ...match, done: "1" });
  return {
    rule: `${signal}→plan`,
    file: "plan.csv",
    action: `marked "${match.item}" done`,
  };
}

export function writeAndSideEffect(type: WriteType, data: unknown, date?: string): WriteResult {
  const effectiveDate = date || todayStr();
  const sideEffects: WriteResult["sideEffects"] = [];

  switch (type) {
    case "workout": {
      const entries = data as WorkoutSetEntry[];
      appendWorkouts(entries);

      // Side effect: workout → ensure gym=1
      const workoutDate = entries[0]?.date || effectiveDate;
      const signals = readDailySignals();
      const hasGym = signals.some(
        (s) => s.date === workoutDate && s.signal === "gym" && s.value === "1"
      );
      if (!hasGym) {
        appendDailySignals([
          {
            date: workoutDate,
            signal: "gym",
            value: "1",
            unit: "",
            context: "",
            source: "router",
            captureId: "",
            category: "",
          },
        ]);
        sideEffects.push({
          rule: "workout→gym",
          file: "daily_signals.csv",
          action: "set gym=1",
        });

        // Secondary: gym=1 → plan auto-complete (one level deep, no re-entry)
        const planEffect = markPlanItemDone(workoutDate, "gym");
        if (planEffect) sideEffects.push(planEffect);
      }

      return {
        primary: { file: "workouts.csv", rowsWritten: entries.length },
        sideEffects,
      };
    }

    case "signal": {
      const entries = data as DailySignalEntry[];
      appendDailySignals(entries);

      // Side effect: signal → plan auto-complete
      for (const entry of entries) {
        if (entry.value === "1" && entry.signal in SIGNAL_TO_PLAN_KEYWORD) {
          const planEffect = markPlanItemDone(entry.date || effectiveDate, entry.signal);
          if (planEffect) sideEffects.push(planEffect);
        }
      }

      return {
        primary: { file: "daily_signals.csv", rowsWritten: entries.length },
        sideEffects,
      };
    }

    case "reflection": {
      const entry = data as ReflectionEntry;
      appendReflection(entry);
      return {
        primary: { file: "reflections.csv", rowsWritten: 1 },
        sideEffects,
      };
    }

    case "todo": {
      const item = data as string;
      appendTodo(item);
      return {
        primary: { file: "todos.csv", rowsWritten: 1 },
        sideEffects,
      };
    }

    case "grocery": {
      const { item, section } = data as { item: string; section: string };
      appendGrocery(item, section);
      return {
        primary: { file: "groceries.csv", rowsWritten: 1 },
        sideEffects,
      };
    }

    case "plan": {
      const entry = data as PlanEntry;
      upsertPlanEntry(entry);
      return {
        primary: { file: "plan.csv", rowsWritten: 1 },
        sideEffects,
      };
    }

    default:
      throw new Error(`Unknown write type: ${type}`);
  }
}
