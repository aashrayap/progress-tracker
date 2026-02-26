import { NextResponse } from "next/server";
import {
  readLog,
  appendLog,
  getMetricHistory,
  getLatestValue,
  getStreak,
  getLastResetDate,
  getDaysSince,
  readPlan,
  getTodaysPlan,
  readTodos,
  LogEntry,
} from "../../lib/csv";
import { config } from "../../lib/config";
import { getNextWorkout } from "../../lib/utils";

export async function GET() {
  try {
    const log = readLog();
    const plan = readPlan();
    const todaysPlan = getTodaysPlan(plan);
    const todos = readTodos();

    const weightHistory = getMetricHistory(log, "weight").map((w) => ({
      date: w.date,
      value: parseFloat(w.value),
    }));

    const currentWeight = parseFloat(getLatestValue(log, "weight") || "0");
    const weightEntries = getMetricHistory(log, "weight");
    const startWeight = weightEntries.length > 0 ? parseFloat(weightEntries[0].value) : 250;

    const dayNumber = getDaysSince(config.dopamineReset.startDate) + 1;

    const dopamineDates = [
      ...new Set(
        log
          .filter((e) => ["lol", "weed", "poker", "gym", "sleep", "meditate", "deep_work", "ate_clean"].includes(e.metric))
          .map((e) => e.date)
      ),
    ].sort();

    const dopamineLog = dopamineDates.map((date) => {
      const dayEntries = log.filter((e) => e.date === date);
      const get = (m: string) => dayEntries.find((e) => e.metric === m)?.value === "1";
      return {
        date,
        weed: get("weed"),
        lol: get("lol"),
        poker: get("poker"),
        gym: get("gym"),
        sleep: get("sleep"),
        meditate: get("meditate"),
        deepWork: get("deep_work"),
        ateClean: get("ate_clean"),
      };
    });

    const triggers = log
      .filter((e) => e.metric === "trigger")
      .map((e) => ({ date: e.date, trigger: e.value, result: e.notes }));

    const streaks = {
      lol: getStreak(log, "lol"),
      weed: getStreak(log, "weed"),
      poker: getStreak(log, "poker"),
    };

    const todayStr = new Date().toISOString().split("T")[0];
    const gymToday = log.some(e => e.date === todayStr && e.metric === "gym" && e.value === "1");

    const cycle = Object.keys(config.workoutTemplates);
    const nextTemplate = getNextWorkout(log, cycle);

    return NextResponse.json({
      gymToday,
      nextWorkout: nextTemplate,
      weight: {
        current: currentWeight,
        start: startWeight || config.weight.start,
        goal: config.weight.goal,
        deadline: config.weight.deadline,
        checkpoints: config.weight.checkpoints,
        log: weightHistory,
      },
      dopamineReset: {
        startDate: config.dopamineReset.startDate,
        dayNumber,
        days: config.dopamineReset.days,
        log: dopamineLog,
        streaks,
        triggers,
      },
      todaysPlan: todaysPlan.map((p) => ({
        start: p.start,
        end: p.end,
        item: p.item,
        done: p.done,
        notes: p.notes || "",
      })),
      todos,
    });
  } catch (e) {
    console.error("GET /api/log error:", e);
    return NextResponse.json({ error: "Failed to read log data" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const entries: LogEntry[] = body.entries;

    if (!Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json({ error: "entries must be a non-empty array" }, { status: 400 });
    }

    for (const entry of entries) {
      if (!entry.date || !entry.metric || entry.value === undefined) {
        return NextResponse.json(
          { error: "Each entry must have date, metric, and value" },
          { status: 400 }
        );
      }
    }

    appendLog(entries);
    return NextResponse.json({ success: true, added: entries.length });
  } catch (e) {
    console.error("POST /api/log error:", e);
    return NextResponse.json({ error: "Failed to write log entry" }, { status: 500 });
  }
}
