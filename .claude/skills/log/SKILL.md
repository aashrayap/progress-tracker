---
name: log
description: Data entry for progress tracking. Use when user says "log weight", "log day", "log trigger", "log relapse", or wants to record structured daily signals.
---

# Log

Data entry skill for progress tracking.
Canonical daily facts: `~/Documents/tracker/daily_signals.csv`

## Daily Signals Schema
```
date,signal,value,unit,context,source,capture_id,category
```

| metric | value | meaning |
|--------|-------|---------|
| weight | number | lbs |
| lol | 0/1 | 0=played, 1=clean |
| weed | 0/1 | 0=smoked, 1=clean |
| poker | 0/1 | 0=played, 1=clean |
| gym | 0/1 | 0=missed, 1=went |
| sleep | 0/1 | 0=missed 10pm, 1=on time |
| meditate | 0/1 | 0=missed, 1=did it |
| deep_work | 0/1 | 0=missed, 1=did it |
| ate_clean | 0/1 | 0=missed, 1=did it |
| calories | number | daily total |
| steps | number | daily total |
| trigger | text | trigger description |
| relapse | text | what was relapsed on |
| reset | 1 | marks a reset day |

## Commands

### /log weight <number>
Add weight entry for today.
```
/log weight 238
→ 2025-02-01,weight,238,
```

### /log day <metrics>
Log multiple metrics at once. Format: `metric:value`
```
/log day lol:1 weed:1 poker:1 gym:1 sleep:0
→ appends 5 rows for today
```

### /log trigger "<trigger>" "<result>"
Log a trigger event.
```
/log trigger "poker loss" "led to full relapse"
→ 2025-02-01,trigger,poker loss,led to full relapse
```

### /log note "<text>"
Add an unstructured capture as a todo item.
```
/log note "feeling strong today"
→ todos.csv entry (done=0)
```

### /log relapse <substances>
Log a relapse and what was involved.
```
/log relapse weed poker
→ 2025-02-01,relapse,weed poker,
→ 2025-02-01,weed,0,
→ 2025-02-01,poker,0,
```

### /log reset
Mark today as a reset day (day 0).
```
/log reset
→ 2025-02-01,reset,1,
```

### /log workout <exercise> <weight>x<reps>x<sets> [...]
Log workout sets. Auto-logs gym completion to daily_signals.csv.
```
/log workout squat 225x5x3, bench 185x6x3
→ workouts.csv:
  2026-02-25,A,squat,1,225,5,
  2026-02-25,A,squat,2,225,5,
  2026-02-25,A,squat,3,225,5,
  2026-02-25,A,bench,1,185,6,
  2026-02-25,A,bench,2,185,6,
  2026-02-25,A,bench,3,185,6,
→ daily_signals.csv: 2026-02-25,gym,1,bool,Day A,chat,<capture_id>,A
```

Format: `exercise weight×reps×sets` or `exercise weight×rep1,rep2,rep3`
- `squat 225x5x3` → 3 sets of 5 at 225
- `squat 225x5,5,4` → set 1: 5 reps, set 2: 5 reps, set 3: 4 reps

Infer workout letter from exercises:
- A = squat/bench/lat_pulldown
- B = ohp/barbell_row/incline_bench
- C = rdl/bench/pullup
- D = front_squat/incline_bench/cable_row
- E = lunges/ohp/pullup

## Behavior

1. Parse the command
2. Get today's date in YYYY-MM-DD format
3. For workout: append to workouts.csv + gym completion signal to daily_signals.csv
4. For all others: append row(s) to daily_signals.csv
5. Confirm what was logged
6. If relapse logged, offer to run /craving-support

## File Locations
```
~/Documents/tracker/daily_signals.csv (daily habits/metrics)
~/Documents/tracker/workouts.csv   (set-level gym data)
```

## Example Session
```
User: /log day lol:1 weed:1 gym:1 sleep:0

Claude: Logged for 2025-02-01:
├─ lol: clean ✓
├─ weed: clean ✓
├─ gym: went ✓
└─ sleep: missed ✗
```
