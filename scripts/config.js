#!/usr/bin/env node

// Single source of truth for constants shared across scripts and router.ts.
// Canonical values extracted from app/app/lib/config.ts and scripts/reconcile.js.

const SIGNAL_TO_PLAN_KEYWORD = {
  gym: "gym",
  sleep: "sleep",
  meditate: "meditate",
  deep_work: "deep work",
};

// All 14 tracked habits (from config.ts HABIT_CONFIG)
// Addiction: weed, lol, poker, clarity
// Lifestyle: gym, sleep, meditate, deep_work, ate_clean, wim_hof_am, wim_hof_pm
// Protocol: morning_review, midday_review, evening_review
const HABIT_LIST = [
  "weed", "lol", "poker", "clarity",
  "gym", "sleep", "meditate", "deep_work", "ate_clean",
  "morning_review", "midday_review", "evening_review",
  "wim_hof_am", "wim_hof_pm",
];

const ADDICTION_SIGNALS = ["weed", "lol", "poker", "clarity"];

const LIFESTYLE_SIGNALS = ["gym", "sleep", "meditate", "deep_work", "ate_clean", "wim_hof_am", "wim_hof_pm"];

const DOMAINS = [
  "health", "career", "relationships", "finances",
  "fun", "personal_growth", "environment",
];

module.exports = {
  SIGNAL_TO_PLAN_KEYWORD,
  HABIT_LIST,
  ADDICTION_SIGNALS,
  LIFESTYLE_SIGNALS,
  DOMAINS,
};
