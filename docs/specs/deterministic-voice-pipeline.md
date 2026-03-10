Status: draft

## Feature: Deterministic Voice Pipeline

### Problem

```
PROBLEM:
- What: The voice-inbox pipeline delegates ALL logic to Claude — classification, parsing, CSV writing, metric computation, notification generation. Every step is non-deterministic.
- Why: This causes drift between what the health page computes (deterministic code) and what the ntfy notification shows (AI-generated). Workout targets, streaks, and summaries can differ between surfaces. The pipeline is also slow (~15-30s per issue) because Claude must read CSVs, reason about taxonomy, and write files.
- User-facing effect: Inconsistent notifications, occasional misclassification, no guarantee that progressive overload targets match between ntfy and the health page.
```

### Current Architecture (AI-first)

```
iOS Shortcut → GitHub Issue → voice-inbox.sh
  │
  └─▶ Claude Code (bypassPermissions)
       ├─ Reads all CSVs
       ├─ Classifies input type (AI)
       ├─ Parses weight/reps/sets (AI)
       ├─ Writes CSV rows (AI)
       ├─ Computes metrics (AI)
       ├─ Generates notification JSON (AI)
       ├─ Git commit + push (AI)
       └─ Closes issue (AI)
```

Every box above is non-deterministic. A misparse of "bench 185 for 5" could produce wrong CSV rows, wrong notification, wrong metrics — and the error compounds silently.

### Proposed Architecture (Deterministic-first)

```
iOS Shortcut → GitHub Issue → voice-inbox.sh
  │
  ├─▶ Step 1: CLASSIFY (deterministic + AI fallback)
  │     Input: raw text
  │     Output: { type, confidence, raw_text }
  │     Method: regex/keyword matching first, AI only if confidence < threshold
  │
  ├─▶ Step 2: PARSE (deterministic per type)
  │     Input: { type, raw_text }
  │     Output: structured data (typed per category)
  │     Method: type-specific parsers (workout parser, weight parser, etc.)
  │     AI fallback: only for ambiguous natural language
  │
  ├─▶ Step 3: WRITE (deterministic, code-only)
  │     Input: structured data
  │     Output: CSV rows appended
  │     Method: same csv.ts functions the app uses
  │     NO AI involvement — just function calls
  │
  ├─▶ Step 4: COMPUTE (deterministic, code-only)
  │     Input: structured data + CSV state
  │     Output: metrics (streak, targets, summaries)
  │     Method: same lib functions (getExerciseTargets, getStreak, etc.)
  │     Guarantees parity with health page
  │
  ├─▶ Step 5: NOTIFY (deterministic templates)
  │     Input: metrics + structured data
  │     Output: ntfy JSON
  │     Method: template rendering, not AI generation
  │
  └─▶ Step 6: COMMIT + CLOSE (deterministic)
        Git add, commit, push, issue close
```

AI is used ONLY in Steps 1-2 as a fallback, never for writing, computing, or notifying.

### Implementation Strategy

The pipeline currently runs as a shell script that invokes `claude --print`. The new approach replaces this with a **Node.js CLI script** that:

1. Imports the same `lib/csv.ts` and `lib/config.ts` used by the app
2. Runs deterministic classification + parsing
3. Calls the same write/compute functions the API uses
4. Falls back to a Claude API call ONLY for ambiguous classification

```
┌────────────────────────────────────────────────────────┐
│ scripts/voice-processor.ts                             │
│                                                        │
│  Shared code (lib/csv.ts, lib/config.ts)               │
│  ├─ classify(rawText) → { type, confidence, parsed }   │
│  ├─ parseWorkout(text) → WorkoutSetEntry[]             │
│  ├─ parseWeight(text) → { value, unit }                │
│  ├─ parseHabit(text) → { signal, value }               │
│  ├─ parseReflection(text) → ReflectionEntry            │
│  ├─ parseGrocery(text) → GroceryEntry[]                │
│  ├─ computeMetrics(type, data) → metrics               │
│  └─ renderNotification(type, data, metrics) → ntfyJSON │
│                                                        │
│  AI fallback (Claude API, not Claude Code):             │
│  └─ classifyAmbiguous(text) → { type, parsed }         │
│     Only called when regex confidence < 0.7             │
└────────────────────────────────────────────────────────┘
```

### Scope

```
SCOPE:
- Create: scripts/voice-processor.ts (main deterministic pipeline)
- Create: app/app/lib/classify.ts (taxonomy classifier)
- Create: app/app/lib/parsers.ts (per-type deterministic parsers)
- Create: app/app/lib/notify.ts (notification template renderer)
- Modify: scripts/voice-inbox.sh (invoke voice-processor.ts instead of Claude Code)
- Modify: app/app/lib/csv.ts (export any helpers needed by the processor)
- Must NOT change: data/*.csv schemas, app/app/api/*, app/app/components/*
```

### Category Detection Rules (Step 1)

Priority-ordered regex classification. First match wins.

| Category | Detection Pattern | Confidence |
|----------|------------------|------------|
| `workout` | exercise name + (weight OR reps OR sets) | 0.95 |
| `weight` | `\b\d{2,3}(\.\d)?\s*(lbs?\|pounds?\|kg)?\b` near "weight\|weigh\|scale" | 0.9 |
| `grocery` | "grocery\|groceries\|pick up\|need from store\|buy" + food items | 0.85 |
| `addiction` | "weed\|lol\|poker" + optional "clean\|relapse\|slip\|reset" | 0.95 |
| `habit` | "gym\|sleep\|meditate\|deep.?work\|ate.?clean" + done/missed | 0.9 |
| `reflection` | "lesson\|learned\|takeaway\|next time\|win\|mistake\|realize" | 0.8 |
| `idea` | "feature\|idea\|should have\|what if\|build\|improve\|the app should" | 0.8 |
| `todo` | actionable verb + object, no other match | 0.6 |
| `ambiguous` | nothing matched with confidence ≥ 0.7 | → AI fallback |

### Workout Parser (Step 2, workout type)

Most critical parser since workouts are the most structured input.

```
Input:  "squat 185 for 5 5 4, bench 155 for 8 7 6"
Output: [
  { exercise: "squat", sets: [{w:185,r:5},{w:185,r:5},{w:185,r:4}] },
  { exercise: "bench", sets: [{w:155,r:8},{w:155,r:7},{w:155,r:6}] }
]
```

Parsing rules:
- Exercise aliases map to canonical IDs (e.g. "bench" → "bench", "OHP" → "ohp", "pull-ups" → "pullup")
- Weight patterns: `\d+\s*(lbs?|pounds?)?` — default unit is lbs
- Rep patterns: `\d+` after weight, or `x\s*\d+`, or `for\s*\d+`
- Multiple reps = multiple sets at same weight: "185 for 5 5 4" = 3 sets
- Weight changes: "135 for 10, 155 for 8, 175 for 5" = 3 sets at different weights
- Infer workout label from exercise mix (match against config.workoutTemplates)

### Notification Templates (Step 5)

Templates use the same computed data the health page uses.

**Workout logged:**
```
Title: "Day {label} logged"
Body:
✓ {exerciseCount} exercises, {totalSets} sets
{foreach exercise: "{name} {bestWeight}×{bestReps}"}
Gym streak: {streak}

📋 Next workout (Day {nextLabel}):
{foreach target: "{name}: {targetSets.map(s => s.weight×s.reps).join(', ')}"}
```

The `📋 Next workout` section uses `getExerciseTargets()` from csv.ts — identical to the health page.

### Success Criteria

- [ ] Build passes (`cd app && npm run build`)
- [ ] voice-inbox.sh no longer invokes `claude --print` for the main processing path
- [ ] Workout voice note produces identical CSV rows to current pipeline (verified against 3 real examples from workouts.csv)
- [ ] ntfy workout notification includes progressive overload targets matching health page output
- [ ] Weight/habit/addiction voice notes produce correct CSV rows
- [ ] AI fallback only triggers when regex confidence < 0.7
- [ ] Processing time < 3 seconds (vs current ~15-30s)
- [ ] Fallback to current Claude pipeline if voice-processor.ts fails (graceful degradation)

### Failure Actions

| Failure | Detection | Action |
|---------|-----------|--------|
| Parser misidentifies workout | Compare output to expected CSV rows | Fix regex/alias mapping |
| Notification differs from health page | Diff ntfy targets vs /api/health response | Ensure shared function path |
| AI fallback triggers too often | Log confidence scores, review | Expand regex patterns |
| Script crashes on edge case | voice-inbox.sh error handler | Fall back to Claude Code pipeline |
| Exercise alias not recognized | Parser returns empty | Add to alias map, log for review |

### Invariants

- CSV schemas must not change
- All CSV writes use the same functions as the app API
- Health page output must not change
- voice-inbox.sh must remain the entry point (launchd compatibility)
- Existing voice-inbox.md prompt preserved as fallback

### Abort If

- Requires changes to CSV column schemas
- Parser accuracy on historical voice notes < 90%
- Would need a runtime dependency not already in package.json (beyond @anthropic-ai/sdk)

### Phase Plan

```
Phase 1: Classifier + Workout Parser + Workout Notification
  - classify.ts with regex-first classification
  - Workout parser (highest value, most structured)
  - Workout notification template with progressive overload
  - Wire into voice-inbox.sh with Claude fallback for non-workout types

Phase 2: Remaining Parsers
  - Weight, habit, addiction, reflection, grocery, todo parsers
  - All notification templates
  - Remove Claude Code dependency for all deterministic types

Phase 3: AI Fallback
  - Claude API call (not Claude Code) for ambiguous inputs
  - Structured output schema for classification
  - Confidence logging and threshold tuning
```

### Verification: build + manual test

Test with real voice note examples from inbox.csv to verify parser accuracy before switching over.
