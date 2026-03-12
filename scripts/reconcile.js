#!/usr/bin/env node

// Post-checkin bridge: reads today's daily_signals, auto-marks matching plan items done.
// Uses shared keyword map and CSV utilities from config.js / csv-utils.js.

const fs = require("fs");
const path = require("path");

const { SIGNAL_TO_PLAN_KEYWORD } = require("./config");
const { parseCSVLine, readLines, csvQuote, todayStr } = require("./csv-utils");

const DATA_ROOT = path.join(__dirname, "..", "data");
const DAILY_SIGNALS_PATH = path.join(DATA_ROOT, "daily_signals.csv");
const PLAN_PATH = path.join(DATA_ROOT, "plan.csv");
const PLAN_HEADER = "date,start,end,item,done,notes,domain";

const today = todayStr();

// Read today's signals
const signalLines = readLines(DAILY_SIGNALS_PATH);
const todaySignals = signalLines
  .map((l) => parseCSVLine(l))
  .filter((c) => c[0] === today && c[2] === "1" && c[1] in SIGNAL_TO_PLAN_KEYWORD);

if (todaySignals.length === 0) {
  console.log("reconcile: no matching signals for today");
  process.exit(0);
}

// Read plan
const planLines = readLines(PLAN_PATH);
const planRows = planLines.map((l) => parseCSVLine(l));

let changed = false;
const activeSignals = new Set(todaySignals.map((s) => s[1]));

for (const signal of activeSignals) {
  const keyword = SIGNAL_TO_PLAN_KEYWORD[signal];
  const idx = planRows.findIndex(
    (p) => p[0] === today && p[3].toLowerCase().includes(keyword) && p[4] !== "1"
  );
  if (idx !== -1) {
    planRows[idx][4] = "1";
    changed = true;
    console.log(`reconcile: marked "${planRows[idx][3]}" done (${signal}=1)`);
  }
}

if (changed) {
  const lines = planRows.map((p) =>
    `${p[0]},${p[1]},${p[2]},${csvQuote(p[3])},${p[4]},${csvQuote(p[5] || "")},${csvQuote(p[6] || "")}`
  );
  const content = PLAN_HEADER + "\n" + lines.join("\n") + "\n";
  const tmpPath = PLAN_PATH + `.tmp-${process.pid}`;
  fs.writeFileSync(tmpPath, content);
  fs.renameSync(tmpPath, PLAN_PATH);
  console.log("reconcile: plan.csv updated");
} else {
  console.log("reconcile: no plan items to update");
}
