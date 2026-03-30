import { describe, it, expect, vi, beforeEach } from "vitest";
import type { PlanEntry, WorkoutSetEntry } from "../csv";
import type { DailySignalEntry } from "../types";

vi.mock("../csv", () => ({
  appendWorkouts: vi.fn(),
  appendDailySignals: vi.fn(),
  readDailySignals: vi.fn(() => []),
  readPlan: vi.fn(() => []),
  upsertPlanEntry: vi.fn(),
  appendReflection: vi.fn(),
  appendTodo: vi.fn(),
  appendGrocery: vi.fn(),

}));

vi.mock("../utils", () => ({
  todayStr: vi.fn(() => "2026-03-09"),
}));

import { writeAndSideEffect } from "../router";
import {
  appendWorkouts,
  appendDailySignals,
  readDailySignals,
  readPlan,
  upsertPlanEntry,
} from "../csv";

const mockReadDailySignals = vi.mocked(readDailySignals);
const mockReadPlan = vi.mocked(readPlan);
const mockAppendDailySignals = vi.mocked(appendDailySignals);
const mockUpsertPlanEntry = vi.mocked(upsertPlanEntry);
const mockAppendWorkouts = vi.mocked(appendWorkouts);

beforeEach(() => {
  vi.clearAllMocks();
  mockReadDailySignals.mockReturnValue([]);
  mockReadPlan.mockReturnValue([]);
});

describe("writeAndSideEffect", () => {
  describe("workout → gym=1 side effect", () => {
    it("sets gym=1 when logging a workout", () => {
      const entries: WorkoutSetEntry[] = [
        { date: "2026-03-09", workout: "A", exercise: "squat", set: 1, weight: 225, reps: 5, notes: "" },
      ];

      const result = writeAndSideEffect("workout", entries);

      expect(mockAppendWorkouts).toHaveBeenCalledWith(entries);
      expect(mockAppendDailySignals).toHaveBeenCalledWith([
        expect.objectContaining({ date: "2026-03-09", signal: "gym", value: "1", source: "router" }),
      ]);
      expect(result.sideEffects).toContainEqual(
        expect.objectContaining({ rule: "workout→gym", file: "daily_signals.csv" })
      );
    });

    it("does not duplicate gym=1 if already exists", () => {
      mockReadDailySignals.mockReturnValue([
        { date: "2026-03-09", signal: "gym", value: "1", unit: "", context: "", source: "", captureId: "" },
      ]);

      const entries: WorkoutSetEntry[] = [
        { date: "2026-03-09", workout: "A", exercise: "squat", set: 1, weight: 225, reps: 5, notes: "" },
      ];

      const result = writeAndSideEffect("workout", entries);

      expect(mockAppendDailySignals).not.toHaveBeenCalled();
      expect(result.sideEffects).toHaveLength(0);
    });
  });

  describe("signal → plan auto-complete", () => {
    const planItems: PlanEntry[] = [
      { date: "2026-03-09", start: 6, end: 7, item: "Gym — Day A", done: "0", notes: "", domain: "health" },
      { date: "2026-03-09", start: 7, end: 7.5, item: "Sleep by 10pm", done: "0", notes: "", domain: "health" },
      { date: "2026-03-09", start: 8, end: 8.5, item: "Meditate 10min", done: "0", notes: "", domain: "personal_growth" },
      { date: "2026-03-09", start: 9, end: 12, item: "Deep work session", done: "0", notes: "", domain: "career" },
    ];

    it("gym=1 marks plan item with 'Gym' done", () => {
      mockReadPlan.mockReturnValue([...planItems]);

      const entries: DailySignalEntry[] = [
        { date: "2026-03-09", signal: "gym", value: "1", unit: "", context: "", source: "", captureId: "" },
      ];

      const result = writeAndSideEffect("signal", entries);

      expect(mockUpsertPlanEntry).toHaveBeenCalledWith(
        expect.objectContaining({ item: "Gym — Day A", done: "1" })
      );
      expect(result.sideEffects).toContainEqual(
        expect.objectContaining({ rule: "gym→plan" })
      );
    });

    it("sleep=1 marks plan item with 'Sleep' done", () => {
      mockReadPlan.mockReturnValue([...planItems]);

      const entries: DailySignalEntry[] = [
        { date: "2026-03-09", signal: "sleep", value: "1", unit: "", context: "", source: "", captureId: "" },
      ];

      const result = writeAndSideEffect("signal", entries);

      expect(mockUpsertPlanEntry).toHaveBeenCalledWith(
        expect.objectContaining({ item: "Sleep by 10pm", done: "1" })
      );
      expect(result.sideEffects).toContainEqual(
        expect.objectContaining({ rule: "sleep→plan" })
      );
    });

    it("meditate=1 marks plan item with 'Meditate' done", () => {
      mockReadPlan.mockReturnValue([...planItems]);

      const entries: DailySignalEntry[] = [
        { date: "2026-03-09", signal: "meditate", value: "1", unit: "", context: "", source: "", captureId: "" },
      ];

      const result = writeAndSideEffect("signal", entries);

      expect(mockUpsertPlanEntry).toHaveBeenCalledWith(
        expect.objectContaining({ item: "Meditate 10min", done: "1" })
      );
      expect(result.sideEffects).toContainEqual(
        expect.objectContaining({ rule: "meditate→plan" })
      );
    });

    it("deep_work=1 marks plan item with 'Deep work' done", () => {
      mockReadPlan.mockReturnValue([...planItems]);

      const entries: DailySignalEntry[] = [
        { date: "2026-03-09", signal: "deep_work", value: "1", unit: "", context: "", source: "", captureId: "" },
      ];

      const result = writeAndSideEffect("signal", entries);

      expect(mockUpsertPlanEntry).toHaveBeenCalledWith(
        expect.objectContaining({ item: "Deep work session", done: "1" })
      );
      expect(result.sideEffects).toContainEqual(
        expect.objectContaining({ rule: "deep_work→plan" })
      );
    });

    it("signal with no matching plan item is a no-op", () => {
      mockReadPlan.mockReturnValue([]); // no plan items

      const entries: DailySignalEntry[] = [
        { date: "2026-03-09", signal: "gym", value: "1", unit: "", context: "", source: "", captureId: "" },
      ];

      const result = writeAndSideEffect("signal", entries);

      expect(mockUpsertPlanEntry).not.toHaveBeenCalled();
      expect(result.sideEffects).toHaveLength(0);
    });

    it("signal with value != 1 does not trigger side effect", () => {
      mockReadPlan.mockReturnValue([...planItems]);

      const entries: DailySignalEntry[] = [
        { date: "2026-03-09", signal: "gym", value: "0", unit: "", context: "", source: "", captureId: "" },
      ];

      const result = writeAndSideEffect("signal", entries);

      expect(mockUpsertPlanEntry).not.toHaveBeenCalled();
      expect(result.sideEffects).toHaveLength(0);
    });
  });

  describe("workout → gym=1 → plan done (chained)", () => {
    it("workout triggers gym=1 which triggers plan auto-complete", () => {
      const planItems: PlanEntry[] = [
        { date: "2026-03-09", start: 6, end: 7, item: "Gym — Day A", done: "0", notes: "", domain: "health" },
      ];
      mockReadPlan.mockReturnValue(planItems);

      const entries: WorkoutSetEntry[] = [
        { date: "2026-03-09", workout: "A", exercise: "squat", set: 1, weight: 225, reps: 5, notes: "" },
      ];

      const result = writeAndSideEffect("workout", entries);

      // Should have both side effects
      expect(result.sideEffects).toHaveLength(2);
      expect(result.sideEffects[0]).toMatchObject({ rule: "workout→gym" });
      expect(result.sideEffects[1]).toMatchObject({ rule: "gym→plan" });

      // gym=1 written via appendDailySignals (not re-entering router)
      expect(mockAppendDailySignals).toHaveBeenCalledTimes(1);
      // plan marked done via upsertPlanEntry (not re-entering router)
      expect(mockUpsertPlanEntry).toHaveBeenCalledTimes(1);
    });
  });

  describe("non-side-effect writes", () => {
    it("reflection write has no side effects", () => {
      const result = writeAndSideEffect("reflection", {
        date: "2026-03-09",
        domain: "health",
        win: "good workout",
        lesson: "consistency",
        change: "keep going",
      });

      expect(result.primary.file).toBe("reflections.csv");
      expect(result.sideEffects).toHaveLength(0);
    });

    it("todo write has no side effects", () => {
      const result = writeAndSideEffect("todo", "buy groceries");
      expect(result.primary.file).toBe("todos.csv");
      expect(result.sideEffects).toHaveLength(0);
    });

    it("grocery write has no side effects", () => {
      const result = writeAndSideEffect("grocery", { item: "eggs", section: "dairy" });
      expect(result.primary.file).toBe("groceries.csv");
      expect(result.sideEffects).toHaveLength(0);
    });
  });
});
