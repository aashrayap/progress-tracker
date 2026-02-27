import { NextResponse } from "next/server";
import { todayStr as todayLocal, daysAgoStr } from "../../lib/utils";
import {
  readDailySignals,
  getDaysSince,
  getHabitsForDate,
  getLatestValue,
  getMetricHistory,
  getNextWorkout,
  getStreak,
  getTodaysPlan,
  readPlan,
  readReflections,
  readTodos,
  readInbox,
  type DailySignalEntry,
} from "../../lib/csv";
import { config, getSplitForDate } from "../../lib/config";
import { computeInsightResponse } from "../../lib/insight";

function getNowWindow(): "morning" | "day" | "evening" {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour >= 20) return "evening";
  return "day";
}

function getBool(
  entries: DailySignalEntry[],
  signal: string
): boolean | null {
  const row = entries.find((e) => e.signal === signal);
  if (!row) return null;
  return row.value === "1";
}

export async function GET() {
  try {
    const signals = readDailySignals();
    const plan = readPlan();
    const reflections = readReflections();
    const todos = readTodos();
    const inbox = readInbox();
    const todaysPlan = getTodaysPlan(plan);

    const weightHistory = getMetricHistory(signals, "weight").map((w) => ({
      date: w.date,
      value: parseFloat(w.value),
    }));

    const currentWeight = parseFloat(getLatestValue(signals, "weight") || "0");
    const weightEntries = getMetricHistory(signals, "weight");
    const startWeight = weightEntries.length > 0 ? parseFloat(weightEntries[0].value) : config.weight.start;

    const dayNumber = getDaysSince(config.dopamineReset.startDate) + 1;
    const dopamineDates = [
      ...new Set(
        signals
          .filter((e) => ["lol", "weed", "poker", "gym", "sleep", "meditate", "deep_work", "ate_clean"].includes(e.signal))
          .map((e) => e.date)
      ),
    ].sort();

    const dopamineLog = dopamineDates.map((date) => {
      const dayEntries = signals.filter((e) => e.date === date);
      const get = (m: string): boolean | null => {
        const entry = dayEntries.find((e) => e.signal === m);
        if (!entry) return null;
        return entry.value === "1";
      };
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

    const todayStr = todayLocal();
    const gymToday = signals.some((e) => e.date === todayStr && e.signal === "gym" && e.value === "1");
    const nextWorkout = getNextWorkout(signals, Object.keys(config.workoutTemplates));
    const todaySplit = getSplitForDate(new Date());

    const yesterday = daysAgoStr(1);
    const yesterdayChanges = reflections
      .filter((r) => r.date === yesterday && r.change.trim())
      .map((r) => ({ domain: r.domain, change: r.change }));

    const insight = computeInsightResponse(
      signals.map((s) => ({
        date: s.date,
        metric: s.signal,
        value: s.value,
        notes: s.context || "",
      })),
      todaysPlan
    );

    const todayEntries = signals.filter((e) => e.date === todayStr);
    const sleepToday = getBool(todayEntries, "sleep");
    const latestPriorSleep = signals
      .filter((e) => e.signal === "sleep" && e.date < todayStr)
      .sort((a, b) => b.date.localeCompare(a.date))[0];
    const sleepFallback = latestPriorSleep ? latestPriorSleep.value === "1" : null;
    const todayHabits = {
      weed: getBool(todayEntries, "weed"),
      lol: getBool(todayEntries, "lol"),
      poker: getBool(todayEntries, "poker"),
      gym: getBool(todayEntries, "gym"),
      sleep: sleepToday ?? sleepFallback,
      meditate: getBool(todayEntries, "meditate"),
      deepWork: getBool(todayEntries, "deep_work"),
      ateClean: getBool(todayEntries, "ate_clean"),
    };

    // 14-day habit tracker: today - 13 days → today
    const habitDates = Array.from({ length: 14 }, (_, i) => daysAgoStr(13 - i));
    const habitTracker = {
      dates: habitDates,
      days: habitDates.map((date) => getHabitsForDate(signals, date)),
    };

    const reviewBacklog = {
      new: inbox.filter((i) => i.status === "new").length,
      needsReview: inbox.filter((i) => i.status === "needs_review").length,
      failed: inbox.filter((i) => i.status === "failed").length,
    };
    const reviewTotal = reviewBacklog.new + reviewBacklog.needsReview + reviewBacklog.failed;

    const nowHour = new Date().getHours() + new Date().getMinutes() / 60;
    const nextPlan = todaysPlan
      .filter((p) => p.done !== "1")
      .sort((a, b) => a.start - b.start)
      .find((p) => p.end >= nowHour) || todaysPlan.filter((p) => p.done !== "1").sort((a, b) => a.start - b.start)[0];

    const nextAction =
      reviewTotal > 0
        ? {
            label: `Review ${reviewTotal} capture${reviewTotal === 1 ? "" : "s"}`,
            reason: "Unresolved captures are blocking clean analysis.",
            href: "/review",
            cta: "Open Review",
          }
        : nextPlan
          ? {
              label: `Start: ${nextPlan.item}`,
              reason: "Next scheduled block is the highest priority execution step.",
              href: "/plan",
              cta: "Open Plan",
            }
          : !gymToday
            ? {
                label:
                  todaySplit.kind === "lift"
                    ? `Train ${todaySplit.workoutKey || `Day ${nextWorkout}`} + ${config.trainingPlan.liftSessionCardioFinisherMin} min cardio`
                    : `${todaySplit.label} (${todaySplit.minutes || 0} min)`,
                reason:
                  todaySplit.kind === "lift"
                    ? "Gym completion is one of your core compounding signals."
                    : "Cardio days keep conditioning and recovery on track.",
                href: "/health",
                cta: "Open Health",
              }
            : {
                label: "Review today's patterns",
                reason: "Use reflection analysis to set tomorrow's adjustments.",
                href: "/reflect",
                cta: "Open Reflect",
              };

    return NextResponse.json({
      nowWindow: getNowWindow(),
      gymToday,
      nextWorkout,
      weight: {
        current: currentWeight,
        start: startWeight,
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
        streaks: {
          lol: getStreak(signals, "lol"),
          weed: getStreak(signals, "weed"),
          poker: getStreak(signals, "poker"),
        },
      },
      todaysPlan: todaysPlan.map((p) => ({
        start: p.start,
        end: p.end,
        item: p.item,
        done: p.done,
        notes: p.notes || "",
      })),
      todos,
      yesterdayChanges,
      insight,
      todayHabits,
      habitTracker,
      reviewBacklog: { ...reviewBacklog, total: reviewTotal },
      nextAction,
    });
  } catch (e) {
    console.error("GET /api/hub error:", e);
    return NextResponse.json({ error: "Failed to load hub data" }, { status: 500 });
  }
}
