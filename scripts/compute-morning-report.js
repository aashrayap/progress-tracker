#!/usr/bin/env node

// compute-morning-report.js — Generates a self-contained HTML morning report.
// Absorbs compute-brain-state.js logic + adds lag state, trigger watch, cascade risk.
// Calls claude --print for AI narrative (falls back to data-only if unavailable).
// Reads: daily_signals.csv, vision.json, briefing.json
// Outputs: data/artifacts/morning-report-{date}.html

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { readCSV, todayStr, dateStr, daysSince, computeStreaks, pivotSignalsByDate } = require("./csv-utils");
const { HABIT_LIST, ADDICTION_SIGNALS } = require("./config");

const DATA_ROOT = path.join(__dirname, "..", "data");
const ARTIFACTS_DIR = path.join(DATA_ROOT, "artifacts");
const PROMPT_PATH = path.join(__dirname, "..", ".claude", "prompts", "morning-report.md");
const CLAUDE_BIN = path.join(process.env.HOME, ".local", "bin", "claude");
const today = todayStr();

// ── Data loading ─────────────────────────────────────────────────

const signals = readCSV(path.join(DATA_ROOT, "daily_signals.csv"));

let vision = {};
try { vision = JSON.parse(fs.readFileSync(path.join(DATA_ROOT, "vision.json"), "utf-8")); } catch {}

let briefing = null;
try { briefing = JSON.parse(fs.readFileSync(path.join(DATA_ROOT, "briefing.json"), "utf-8")); } catch {}

// ── Brain state ──────────────────────────────────────────────────

const streaks = computeStreaks(signals, HABIT_LIST);
const pivot = pivotSignalsByDate(signals, 14);

function avgLoad(pivot, signals, days) {
  const dates = Object.keys(pivot.dates).sort().slice(-days);
  if (!dates.length) return 0;
  return dates.reduce((sum, d) => {
    let count = 0;
    for (const s of signals) {
      const val = pivot.dates[d]?.[s]?.value;
      if (val === "0") count++;
    }
    return sum + count;
  }, 0) / dates.length;
}

function avgPositive(pivot, signals, days) {
  const dates = Object.keys(pivot.dates).sort().slice(-days);
  if (!dates.length) return 0;
  return dates.reduce((sum, d) => {
    let count = 0;
    for (const s of signals) {
      if (pivot.dates[d]?.[s]?.value === "1") count++;
    }
    return sum + count;
  }, 0) / dates.length;
}

const VICES = [...ADDICTION_SIGNALS, "clarity"];
const POSITIVES = ["gym", "meditate", "deep_work"];

// Count-based: "X/7 days" instead of decimal averages
function countHits(pivot, signals, days, matchValue) {
  const dates = Object.keys(pivot.dates).sort().slice(-days);
  let hits = 0, total = 0;
  for (const d of dates) {
    for (const s of signals) {
      const val = pivot.dates[d]?.[s]?.value;
      if (val === "1" || val === "0") {
        total++;
        if (val === matchValue) hits++;
      }
    }
  }
  return { hits, total, days: dates.length };
}

const viceDays7 = countHits(pivot, VICES, 7, "0"); // days with at least one relapse
const viceDaysPrev7 = countHits(pivot, VICES, 14, "0");
const posDays7 = countHits(pivot, POSITIVES, 7, "1");
const posDaysPrev7 = countHits(pivot, POSITIVES, 14, "1");

// Count unique days with any vice relapse
function countViceDays(pivot, vices, days) {
  const dates = Object.keys(pivot.dates).sort().slice(-days);
  let count = 0;
  for (const d of dates) {
    for (const v of vices) {
      if (pivot.dates[d]?.[v]?.value === "0") { count++; break; }
    }
  }
  return { count, of: dates.length };
}

function countPositiveDays(pivot, positives, days) {
  const dates = Object.keys(pivot.dates).sort().slice(-days);
  let total = 0;
  for (const d of dates) {
    let dayCount = 0;
    for (const p of positives) {
      if (pivot.dates[d]?.[p]?.value === "1") dayCount++;
    }
    total += dayCount;
  }
  // avg per day as fraction of possible
  return { total, perDay: dates.length > 0 ? Math.round(total / dates.length) : 0, possible: positives.length, of: dates.length };
}

// Per-vice breakdown: which specific vices are active this week
function perViceBreakdown(pivot, vices, days) {
  const dates = Object.keys(pivot.dates).sort().slice(-days);
  const breakdown = {};
  for (const v of vices) {
    let relapses = 0, logged = 0;
    for (const d of dates) {
      const val = pivot.dates[d]?.[v]?.value;
      if (val === "0" || val === "1") { logged++; if (val === "0") relapses++; }
    }
    if (relapses > 0) breakdown[v] = { relapses, of: logged };
  }
  return breakdown;
}

const viceCount7 = countViceDays(pivot, VICES, 7);
const viceBreakdown7 = perViceBreakdown(pivot, VICES, 7);
const posCount7 = countPositiveDays(pivot, POSITIVES, 7);

const totalRelapses7 = Object.values(viceBreakdown7).reduce((s, v) => s + v.relapses, 0);
const dopamineLevel = posCount7.perDay >= 2 && totalRelapses7 <= 2 ? "surplus"
  : posCount7.perDay >= 1.5 && totalRelapses7 <= 4 ? "balanced"
  : posCount7.perDay >= 1 ? "mild deficit" : "deficit";

// Sleep: X/7 nights
const sleepDates7 = Object.keys(pivot.dates).sort().slice(-7);
let sleepOn7 = 0, sleepRun = 0;
for (const d of sleepDates7) {
  if (pivot.dates[d]?.sleep?.value === "1") sleepOn7++;
}
for (const d of [...Object.keys(pivot.dates).sort().slice(-14)].reverse()) {
  if (pivot.dates[d]?.sleep?.value === "1") sleepRun++;
  else break;
}

// Format breakdown for display: "LoL 6/7, Clarity 2/7"
const viceBreakdownStr = Object.entries(viceBreakdown7)
  .sort((a, b) => b[1].relapses - a[1].relapses)
  .map(([v, d]) => {
    const labels = { weed: "Weed", lol: "LoL", poker: "Poker", clarity: "Clarity" };
    return `${labels[v] || v} ${d.relapses}/${d.of}`;
  }).join(", ");

const brainState = {
  dopamine: dopamineLevel,
  viceLoad: {
    days: viceCount7.count, of: viceCount7.of,
    breakdown: viceBreakdown7,
    breakdownStr: viceBreakdownStr,
    trend: viceCount7.count < 3 ? "low" : viceCount7.count > 4 ? "high" : "moderate",
  },
  positiveInputs: { perDay: posCount7.perDay, possible: posCount7.possible, of: posCount7.of, trend: posCount7.perDay >= 2 ? "strong" : posCount7.perDay >= 1 ? "building" : "weak" },
  sleep: { on: sleepOn7, of: 7, run: sleepRun },
};

// ── Lag state ────────────────────────────────────────────────────

const TRACKED = ["gym", "sleep", "meditate", "deep_work", "ate_clean",
  "weed", "lol", "poker", "clarity", "wim_hof_am", "wim_hof_pm"];

function computeLagState() {
  const dates = Object.keys(pivot.dates).sort();
  const last7 = dates.slice(-7);
  const prev7 = dates.slice(-14, -7);

  return TRACKED.map(signal => {
    const count = (ds) => {
      if (!ds.length) return null;
      let hits = 0, total = 0;
      for (const d of ds) {
        const val = pivot.dates[d]?.[signal]?.value;
        if (val === "1" || val === "0") { total++; if (val === "1") hits++; }
      }
      return total > 0 ? { hits, of: total } : null;
    };

    const c7 = count(last7);
    const cPrev7 = count(prev7);
    const streak = streaks[signal] || {};

    const r7 = c7 ? c7.hits / c7.of : null;
    const rPrev7 = cPrev7 ? cPrev7.hits / cPrev7.of : null;

    let trajectory, status;
    if (r7 === null) { trajectory = "no data"; status = "unknown"; }
    else if (rPrev7 === null) {
      trajectory = r7 >= 0.7 ? "strong" : r7 >= 0.4 ? "building" : "weak";
      status = r7 >= 0.7 ? "inverted" : "mid-lag";
    } else {
      const delta = r7 - rPrev7;
      trajectory = delta > 0.15 ? "improving" : delta < -0.15 ? "declining" : "flat";
      if (r7 >= 0.75 && trajectory !== "declining") status = "inverted";
      else if (r7 >= 0.4 || trajectory === "improving") status = "mid-lag";
      else status = "default";
    }

    return {
      signal,
      hits7d: c7 ? c7.hits : null,
      of7d: c7 ? c7.of : null,
      hitsPrev7d: cPrev7 ? cPrev7.hits : null,
      ofPrev7d: cPrev7 ? cPrev7.of : null,
      trajectory, status,
      streak: streak.current || 0,
      negativeStreak: streak.current_negative || 0,
    };
  });
}

const lagState = computeLagState();

// ── Cascade risk ─────────────────────────────────────────────────

function computeCascadeRisk() {
  const bySignal = {};
  for (const s of lagState) bySignal[s.signal] = s;
  const risks = [];

  const pokerRisk = bySignal.poker?.status === "default" || bySignal.poker?.negativeStreak >= 2;
  const lolRisk = bySignal.lol?.status === "default" || bySignal.lol?.negativeStreak >= 2;
  const weedRisk = bySignal.weed?.status === "default" || bySignal.weed?.negativeStreak >= 2;

  if (pokerRisk || lolRisk || weedRisk) {
    const active = [];
    if (pokerRisk) active.push("poker");
    if (lolRisk) active.push("lol");
    if (weedRisk) active.push("weed");
    risks.push({ chain: "Addiction cascade", active, downstream: ["sleep", "gym", "ate_clean", "deep_work"], severity: active.length >= 2 ? "high" : "moderate" });
  }

  if (bySignal.gym?.status === "default" || bySignal.gym?.trajectory === "declining") {
    risks.push({ chain: "Gym-eating keystone", active: ["gym"], downstream: ["ate_clean"], severity: bySignal.gym?.status === "default" ? "moderate" : "low" });
  }

  if (bySignal.sleep?.status === "default") {
    risks.push({ chain: "Sleep deficit", active: ["sleep"], downstream: ["deep_work", "gym", "meditate"], severity: "moderate" });
  }

  return risks;
}

const cascadeRisks = computeCascadeRisk();

// ── Trigger watch ────────────────────────────────────────────────

const triggers = vision?.distractions?.triggerReplacements || [];
const mentalDistractions = vision?.distractions?.mental || [];
const briefingState = briefing?.state || "neutral";
const showAllTriggers = briefingState === "danger" || briefingState === "recovery";
const displayTriggers = showAllTriggers ? triggers : triggers.slice(0, 2);

// ── Identity script ──────────────────────────────────────────────

const identityScript = vision?.identityScript || {};
const briefingQuote = briefing?.quote || { text: "Begin where you are.", author: "Unknown" };

// ── LLM narrative ────────────────────────────────────────────────

function generateNarrative() {
  const dataPayload = JSON.stringify({
    today,
    briefingState,
    brainState,
    lagState,
    cascadeRisks,
    identityThemes: {
      health: "solid capable body, training automatic, meals compound",
      wealth: "calm clarity, work flows, build and ship",
      love: "warmth, curiosity, honest initiative",
      self: "quiet mind, stillness default, urges dissolve, clean days compound",
    },
  }, null, 2);

  const systemPrompt = fs.readFileSync(PROMPT_PATH, "utf-8");

  try {
    const result = execSync(
      `"${CLAUDE_BIN}" --print --append-system-prompt "${PROMPT_PATH.replace(/"/g, '\\"')}" "Generate the morning report narrative from this data:\n\n${dataPayload.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`,
      { timeout: 60000, encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }
    );

    // Strip markdown fences if present
    let cleaned = result.trim();
    const fenceMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (fenceMatch) cleaned = fenceMatch[1].trim();

    const parsed = JSON.parse(cleaned);
    if (parsed.brainState && parsed.lagNarrative && parsed.calibrationNote) {
      return parsed;
    }
  } catch (err) {
    console.error(`LLM narrative failed: ${err.message}. Generating data-only report.`);
  }

  return null;
}

const narrative = generateNarrative();

// ── HTML helpers ─────────────────────────────────────────────────

function esc(str) {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function signalLabel(signal) {
  const labels = {
    gym: "Gym", sleep: "Sleep", meditate: "Meditate", deep_work: "Deep Work",
    ate_clean: "Ate Clean", weed: "Weed-free", lol: "LoL-free", poker: "Poker-free",
    clarity: "Clarity", wim_hof_am: "Wim Hof AM", wim_hof_pm: "Wim Hof PM",
  };
  return labels[signal] || signal;
}

function formatDate(d) {
  const [y, m, day] = d.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[parseInt(m) - 1]} ${parseInt(day)}, ${y}`;
}

function arrow(t) { return t === "improving" || t === "strong" || t === "building" ? "^" : t === "declining" || t === "weak" ? "v" : "-"; }
function statusBadge(s) {
  const cls = s === "inverted" ? "badge-inv" : s === "mid-lag" ? "badge-mid" : "badge-def";
  const label = s === "inverted" ? "INVERTED" : s === "mid-lag" ? "MID-LAG" : s === "default" ? "DEFAULT" : "---";
  return `<span class="${cls}">${label}</span>`;
}

// ── HTML generation ──────────────────────────────────────────────

function generateHTML() {
  const lagInverted = lagState.filter(s => s.status === "inverted");
  const lagDefault = lagState.filter(s => s.status === "default");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Morning Report — ${formatDate(today)}</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: -apple-system, BlinkMacSystemFont, "SF Mono", "Fira Code", monospace;
  background: #0a0a0a; color: #d4d4d8;
  max-width: 640px; margin: 0 auto; padding: 24px 20px 48px;
  line-height: 1.6;
}
h1 { font-size: 14px; font-weight: 600; color: #a1a1aa; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 4px; }
.date { font-size: 12px; color: #52525b; margin-bottom: 32px; }
.section { margin-bottom: 28px; }
.stitle {
  font-size: 10px; font-weight: 600; color: #71717a;
  letter-spacing: 0.1em; text-transform: uppercase;
  margin-bottom: 12px; padding-bottom: 6px;
  border-bottom: 1px solid #27272a;
}
.id-block { margin-bottom: 12px; }
.id-label { font-size: 10px; color: #52525b; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 2px; }
.id-text { font-size: 13px; color: #d4d4d8; line-height: 1.5; }
.hr { border: none; border-top: 1px solid #27272a; margin: 24px 0; }
.narrative { font-size: 13px; color: #a1a1aa; line-height: 1.6; margin-bottom: 16px; }
table { width: 100%; border-collapse: collapse; font-size: 12px; }
th { text-align: left; font-size: 10px; color: #52525b; text-transform: uppercase; letter-spacing: 0.08em; padding: 4px 8px 8px; border-bottom: 1px solid #27272a; }
td { padding: 6px 8px; border-bottom: 1px solid #18181b; }
.mono { font-family: "SF Mono", "Fira Code", monospace; }
.muted { color: #52525b; }
.stat-row { display: flex; gap: 24px; margin-bottom: 8px; }
.stat { flex: 1; }
.stat-label { font-size: 10px; color: #52525b; text-transform: uppercase; letter-spacing: 0.06em; }
.stat-value { font-size: 16px; color: #d4d4d8; font-weight: 500; }
.stat-sub { font-size: 10px; color: #52525b; }
.risk-item { padding: 8px 0; border-bottom: 1px solid #18181b; }
.risk-chain { font-size: 12px; color: #a1a1aa; font-weight: 500; }
.risk-detail { font-size: 11px; color: #52525b; margin-top: 2px; }
.trigger-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #18181b; font-size: 12px; }
.trigger-label { color: #71717a; }
.trigger-repl { color: #a1a1aa; }
.eq-check { text-align: center; padding: 20px; margin: 24px 0; border: 1px solid #27272a; border-radius: 4px; }
.eq-q { font-size: 14px; color: #a1a1aa; font-style: italic; }
.badge-inv { display: inline-block; font-size: 10px; padding: 1px 6px; border-radius: 2px; font-weight: 500; letter-spacing: 0.05em; background: #27272a; color: #a1a1aa; }
.badge-mid { display: inline-block; font-size: 10px; padding: 1px 6px; border-radius: 2px; font-weight: 500; letter-spacing: 0.05em; background: #1c1c1e; color: #71717a; }
.badge-def { display: inline-block; font-size: 10px; padding: 1px 6px; border-radius: 2px; font-weight: 500; letter-spacing: 0.05em; background: #18181b; color: #52525b; }
.streak { font-size: 11px; color: #71717a; }
.quote { font-size: 12px; color: #52525b; font-style: italic; margin-top: 8px; line-height: 1.5; }
.quote-author { font-style: normal; color: #3f3f46; }
.cal-note { font-size: 13px; color: #d4d4d8; line-height: 1.6; text-align: center; padding: 16px; border: 1px solid #27272a; border-radius: 4px; margin-bottom: 20px; }
.lag-note { margin-top: 12px; font-size: 11px; color: #52525b; line-height: 1.5; }
</style>
</head>
<body>

<h1>Morning Report</h1>
<div class="date">${formatDate(today)}${briefingState ? " / " + briefingState.toUpperCase() : ""} — generated ${new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}</div>

<!-- Identity Script -->
<div class="section">
  <div class="stitle">Identity Script</div>
  ${["health", "wealth", "love", "self"].map(p => {
    const text = identityScript?.coreTraits?.[p];
    if (!text) return "";
    return `<div class="id-block"><div class="id-label">${p}</div><div class="id-text">${esc(text)}</div></div>`;
  }).join("\n  ")}
</div>

<hr class="hr">

<!-- Brain State -->
<div class="section">
  <div class="stitle">Brain State</div>
  ${narrative ? `<div class="narrative">${esc(narrative.brainState)}</div>` : ""}
  <div class="stat-row">
    <div class="stat">
      <div class="stat-label">Balance</div>
      <div class="stat-value">${dopamineLevel}</div>
    </div>
    <div class="stat">
      <div class="stat-label">Active Vices</div>
      <div class="stat-value">${brainState.viceLoad.breakdownStr || "none"}</div>
      <div class="stat-sub">${brainState.viceLoad.days}/${brainState.viceLoad.of} days with relapse</div>
    </div>
    <div class="stat">
      <div class="stat-label">Positive Avg</div>
      <div class="stat-value">${brainState.positiveInputs.perDay}/${brainState.positiveInputs.possible}</div>
      <div class="stat-sub">${brainState.positiveInputs.trend}</div>
    </div>
    <div class="stat">
      <div class="stat-label">Sleep</div>
      <div class="stat-value">${brainState.sleep.on}/${brainState.sleep.of}</div>
      <div class="stat-sub">${sleepRun > 0 ? sleepRun + "d run" : "no run"}</div>
    </div>
  </div>
</div>

<hr class="hr">

<!-- Lag Map -->
<div class="section">
  <div class="stitle">Lag Map</div>
  ${narrative ? `<div class="narrative">${esc(narrative.lagNarrative)}</div>` : ""}
  ${(() => {
    const VICE_SIGNALS = ["weed", "lol", "poker", "clarity"];
    const statusOrder = { "default": 0, "mid-lag": 1, "inverted": 2, "unknown": 3 };
    const sortFn = (a, b) => {
      const so = (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3);
      if (so !== 0) return so;
      return (a.hits7d ?? 99) - (b.hits7d ?? 99);
    };
    const habits = lagState.filter(s => !VICE_SIGNALS.includes(s.signal)).sort(sortFn);
    const vices = lagState.filter(s => VICE_SIGNALS.includes(s.signal)).sort(sortFn);
    const renderRow = (s) => `<tr>
      <td>${signalLabel(s.signal)}</td>
      <td class="mono">${s.hits7d !== null ? s.hits7d + "/" + s.of7d : "---"}</td>
      <td class="mono muted">${s.hitsPrev7d !== null ? s.hitsPrev7d + "/" + s.ofPrev7d : "---"}</td>
      <td class="mono">${arrow(s.trajectory)}</td>
      <td>${statusBadge(s.status)}</td>
      <td class="streak">${s.streak > 0 ? s.streak + "d" : s.negativeStreak > 0 ? s.negativeStreak + "d red" : "---"}</td>
    </tr>`;
    const sep = `<tr><td colspan="6" style="padding:2px 8px;border-bottom:1px solid #27272a;"><span style="font-size:10px;color:#3f3f46;text-transform:uppercase;letter-spacing:0.08em;">Vices</span></td></tr>`;
    return `<table>
    <tr><th>Signal</th><th>This Week</th><th>Last Week</th><th>Dir</th><th>Status</th><th>Streak</th></tr>
    ${habits.map(renderRow).join("\n    ")}
    ${sep}
    ${vices.map(renderRow).join("\n    ")}
  </table>`;
  })()}
  ${lagDefault.length > 0 ? `<div class="lag-note">Signals marked DEFAULT are old output still printing. The new input from inverted signals (${lagInverted.map(s => signalLabel(s.signal)).join(", ") || "none yet"}) takes time to propagate.</div>` : ""}
</div>

<hr class="hr">

${cascadeRisks.length > 0 ? `<!-- Cascade Risk -->
<div class="section">
  <div class="stitle">Cascade Risk</div>
  ${cascadeRisks.map(r => `<div class="risk-item">
    <div class="risk-chain">${esc(r.chain)} [${r.severity}]</div>
    <div class="risk-detail">Active: ${r.active.map(signalLabel).join(", ")} -- Downstream: ${r.downstream.map(signalLabel).join(", ")}</div>
  </div>`).join("\n  ")}
</div>
<hr class="hr">` : ""}

${displayTriggers.length > 0 ? `<!-- Trigger Watch -->
<div class="section">
  <div class="stitle">Trigger Watch${showAllTriggers ? " [elevated]" : ""}</div>
  ${displayTriggers.map(t => `<div class="trigger-row"><span class="trigger-label">${esc(t.trigger)}</span><span class="trigger-repl">${esc(t.replacement)}</span></div>`).join("\n  ")}
  ${mentalDistractions.length > 0 ? `<div style="margin-top: 8px; font-size: 11px; color: #52525b;">Mental: ${mentalDistractions.map(esc).join(" / ")}</div>` : ""}
</div>
<hr class="hr">` : ""}

<!-- Calibration Note + Equation Check -->
${narrative ? `<div class="cal-note">${esc(narrative.calibrationNote)}</div>` : ""}

<div class="eq-check">
  <div class="eq-q">Am I reacting to my reality right now, or am I creating it?</div>
</div>

${briefingQuote ? `<div class="quote">"${esc(briefingQuote.text)}" <span class="quote-author">-- ${esc(briefingQuote.author)}</span></div>` : ""}

</body>
</html>`;
}

// ── Write output ─────────────────────────────────────────────────

try {
  if (!fs.existsSync(ARTIFACTS_DIR)) fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
  const html = generateHTML();
  const outPath = path.join(ARTIFACTS_DIR, `morning-report-${today}.html`);
  fs.writeFileSync(outPath, html);
  console.log(`Morning report generated: ${outPath}`);
} catch (err) {
  console.error(`compute-morning-report error: ${err.message}`);
  process.exit(1);
}
