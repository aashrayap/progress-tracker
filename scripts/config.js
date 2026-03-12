#!/usr/bin/env node

// Single source of truth for constants shared across scripts and router.ts.
// Canonical values extracted from app/app/lib/config.ts and scripts/reconcile.js.

const SIGNAL_TO_PLAN_KEYWORD = {
  gym: "gym",
  sleep: "sleep",
  meditate: "meditate",
  deep_work: "deep work",
};

// All 9 tracked habits (from config.ts HABIT_CONFIG)
// Addiction: weed, lol, poker, clarity
// Lifestyle: gym, sleep, meditate, deep_work, ate_clean
const HABIT_LIST = [
  "weed", "lol", "poker", "clarity",
  "gym", "sleep", "meditate", "deep_work", "ate_clean",
];

const ADDICTION_SIGNALS = ["weed", "lol", "poker"];

const LIFESTYLE_SIGNALS = ["gym", "sleep", "meditate", "deep_work", "ate_clean"];

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
