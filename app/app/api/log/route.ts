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

export async function GET() {
  const log = readLog();
  const plan = readPlan();
  const todaysPlan = getTodaysPlan(plan);
  const todos = readTodos();

  // Build aggregated data for the app
  const weightHistory = getMetricHistory(log, "weight").map((w) => ({
    date: w.date,
    value: parseFloat(w.value),
  }));

  const currentWeight = parseFloat(getLatestValue(log, "weight") || "0");
  const weightEntries = getMetricHistory(log, "weight");
  const startWeight = weightEntries.length > 0 ? parseFloat(weightEntries[0].value) : 250;

  const dayNumber = getDaysSince(config.dopamineReset.startDate) + 1;

  // Get all unique dates that have dopamine reset metrics
  const dopamineDates = [
    ...new Set(
      log
        .filter((e) => ["lol", "weed", "poker", "gym", "sleep", "meditate", "deep_work", "ate_clean"].includes(e.metric))
        .map((e) => e.date)
    ),
  ].sort();

  // Build daily log entries
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

  // Get triggers
  const triggers = log
    .filter((e) => e.metric === "trigger")
    .map((e) => ({ date: e.date, trigger: e.value, result: e.notes }));

  // Streaks
  const streaks = {
    lol: getStreak(log, "lol"),
    weed: getStreak(log, "weed"),
    poker: getStreak(log, "poker"),
  };

  const todayStr = new Date().toISOString().split("T")[0];
  const gymToday = log.some(e => e.date === todayStr && e.metric === "gym" && e.value === "1");

  // Completion-based workout rotation: find last completed template, serve next
  const cycle = Object.keys(config.workoutTemplates); // ["A", "B", "C"]
  const lastGym = [...log]
    .reverse()
    .find(e => e.metric === "gym" && e.value === "1" && e.notes);
  const lastTemplate = lastGym?.notes?.replace(/^Day\s*/i, "").trim() || "";
  const lastIdx = cycle.indexOf(lastTemplate);
  const nextTemplate = cycle[(lastIdx + 1) % cycle.length];

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
}

export async function POST(request: Request) {
  const body = await request.json();
  const entries: LogEntry[] = body.entries || [];

  if (entries.length === 0) {
    return NextResponse.json({ error: "No entries provided" }, { status: 400 });
  }

  appendLog(entries);

  return NextResponse.json({ success: true, added: entries.length });
}
