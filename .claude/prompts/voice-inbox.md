You are processing a voice note dictated from a phone. The note was captured via iOS Shortcut and created as a GitHub Issue.

## Your Job

Read the issue body and decide: is this a **log entry**, a **workout log**, or a **general note**?

## Log Entry Detection

A log entry contains information about any of these tracked metrics:

| metric | what to look for | value format |
|--------|-----------------|--------------|
| weight | weighed, scale, weight, lbs | number (lbs) |
| weed | smoked, weed, clean (from weed) | 0=relapsed, 1=clean |
| lol | played league, LoL, league of legends | 0=relapsed, 1=clean |
| poker | played poker, poker | 0=relapsed, 1=clean |
| gym | gym, worked out, lifted, day A/B/C | 0=missed, 1=done |
| sleep | slept on time, slept late, sleep | 0=missed, 1=done |
| meditate | meditated, meditation | 0=missed, 1=done |
| deep_work | deep work, focused work, coding session | 0=missed, 1=done |
| ate_clean | ate clean, healthy eating | 0=missed, 1=done |
| trigger | craving, triggered, tempted, urge | text description |
| relapse | relapsed, full relapse, broke streak | text description |

**One dictation can contain MULTIPLE log entries.** Extract all of them.

For addiction metrics (weed, lol, poker): if someone says they did the activity, that's a RELAPSE (value=0). If they say "clean" or "didn't", that's clean (value=1).

## Workout Detection

If the voice note mentions specific exercises with weights/reps (e.g., "squat 225 for 5", "bench 185 three sets of 6"), this is a **workout log**.

Append to `workouts.csv` in format: `date,workout,exercise,set,weight,reps,notes`

**Known exercises** (match these from voice):
| Voice says | exercise value | workout |
|-----------|----------------|---------|
| squat, back squat | squat | A, B, C |
| bench, bench press | bench | A |
| incline bench, incline | incline_bench | B |
| overhead press, OHP | ohp | C |
| lat pulldown, pulldown | lat_pulldown | A |
| cable row | cable_row | B |
| barbell row | barbell_row | C |

**Workout templates:** A = squat/bench/lat_pulldown, B = squat/incline_bench/cable_row, C = squat/ohp/barbell_row

Infer the workout letter (A/B/C) from the exercises mentioned. If unclear, leave blank.

**Also** append `gym,1,Day X` to log.csv when workout sets are logged.

Example voice: "Just did squats 225 for 5 5 and 4, then bench 185 for 6 6 5"
→ workouts.csv:
```
2026-02-25,A,squat,1,225,5,
2026-02-25,A,squat,2,225,5,
2026-02-25,A,squat,3,225,4,
2026-02-25,A,bench,1,185,6,
2026-02-25,A,bench,2,185,6,
2026-02-25,A,bench,3,185,5,
```
→ log.csv: `2026-02-25,gym,1,Day A`

Multiple voice notes per workout are expected (e.g., one after each exercise). Append all — deduplication is not needed.

## Rules

1. Use today's date (from the issue creation timestamp) for all entries
2. If it's a log entry: append rows to `log.csv` in format `date,metric,value,notes`
3. If it's a workout log: append rows to `workouts.csv` AND `gym,1` to `log.csv`
4. If it's a general note: append a row to `notes.csv` in format `date,note`
5. If it contains BOTH log-worthy data AND general notes, do both
6. After processing, comment on the GitHub issue with what you did
7. Close the issue

## Output Format for Issue Comment

For log entries:
```
Logged:
- weight: 237
- gym: 1 (day A)
```

For workout sets:
```
Workout logged (Day A):
- squat: 225×5, 225×5, 225×4
- bench: 185×6, 185×6, 185×5
```

For notes:
```
Noted: "idea for app - add weekly email summary"
```

## Important
- Be concise in issue comments
- Do NOT create branches or PRs — edit files directly on main
- Only append to CSVs, never modify existing rows
- If you can't determine intent, default to notes.csv
- Create workouts.csv with header `date,workout,exercise,set,weight,reps,notes` if it doesn't exist
