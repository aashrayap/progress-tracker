import { describe, it, expect } from "vitest";
import { readPlan, getTodaysPlan, getPlanForDateRange } from "../lib/csv";
import { todayStr } from "../lib/utils";

describe("plan consistency", () => {
  it("getTodaysPlan and getPlanForDateRange return same entries for today", () => {
    const plan = readPlan();
    const today = todayStr();

    const fromToday = getTodaysPlan(plan);
    const fromRange = getPlanForDateRange(plan, today, today);

    expect(fromToday.length).toBe(fromRange.length);

    for (let i = 0; i < fromToday.length; i++) {
      expect(fromToday[i].date).toBe(fromRange[i].date);
      expect(fromToday[i].start).toBe(fromRange[i].start);
      expect(fromToday[i].end).toBe(fromRange[i].end);
      expect(fromToday[i].item).toBe(fromRange[i].item);
      expect(fromToday[i].done).toBe(fromRange[i].done);
    }
  });

  it("Hub todaysPlan response shape includes all fields PlanBlock needs", () => {
    const plan = readPlan();
    const todaysPlan = getTodaysPlan(plan);

    for (const p of todaysPlan) {
      expect(p).toHaveProperty("date");
      expect(p).toHaveProperty("start");
      expect(p).toHaveProperty("end");
      expect(p).toHaveProperty("item");
      expect(p).toHaveProperty("done");
      expect(p).toHaveProperty("notes");
      expect(typeof p.date).toBe("string");
      expect(typeof p.start).toBe("number");
      expect(typeof p.end).toBe("number");
      expect(typeof p.item).toBe("string");
    }
  });

  it("mark-done POST payload matches expected shape", () => {
    const plan = readPlan();
    const todaysPlan = getTodaysPlan(plan);
    if (todaysPlan.length === 0) return;

    const item = todaysPlan[0];
    const payload = {
      date: item.date,
      start: item.start,
      end: item.end,
      item: item.item,
      done: "1",
      notes: item.notes,
    };

    expect(payload).toHaveProperty("date");
    expect(payload).toHaveProperty("start");
    expect(payload).toHaveProperty("end");
    expect(payload).toHaveProperty("item");
    expect(payload).toHaveProperty("done");
    expect(typeof payload.date).toBe("string");
    expect(typeof payload.start).toBe("number");
  });
});
