import { describe, it, expect } from "vitest";
import { getWeekStart, getWeekStartStr } from "../date-utils";

describe("getWeekStart", () => {
  it("Sunday → returns previous Monday", () => {
    // Sun 2026-03-08
    const sun = new Date(2026, 2, 8);
    const result = getWeekStart(sun);
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(2);
    expect(result.getDate()).toBe(2); // Mon 2026-03-02
    expect(result.getHours()).toBe(0);
  });

  it("Monday → returns same Monday", () => {
    // Mon 2026-03-02
    const mon = new Date(2026, 2, 2);
    const result = getWeekStart(mon);
    expect(result.getDate()).toBe(2);
  });

  it("Saturday → returns previous Monday", () => {
    // Sat 2026-03-07
    const sat = new Date(2026, 2, 7);
    const result = getWeekStart(sat);
    expect(result.getDate()).toBe(2);
  });

  it("Wednesday → returns Monday", () => {
    // Wed 2026-03-04
    const wed = new Date(2026, 2, 4);
    const result = getWeekStart(wed);
    expect(result.getDate()).toBe(2);
  });

  it("zeroes out hours/minutes/seconds/ms", () => {
    const d = new Date(2026, 2, 4, 15, 30, 45, 123);
    const result = getWeekStart(d);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
    expect(result.getMilliseconds()).toBe(0);
  });
});

describe("getWeekStartStr", () => {
  it("returns YYYY-MM-DD format", () => {
    // Wed 2026-03-04
    const wed = new Date(2026, 2, 4);
    expect(getWeekStartStr(wed)).toBe("2026-03-02");
  });

  it("pads single-digit month and day", () => {
    // Wed 2026-01-07
    const d = new Date(2026, 0, 7);
    expect(getWeekStartStr(d)).toBe("2026-01-05");
  });
});
