---
name: log
description: Data entry for progress tracking. Use when user says "log weight", "log day", "log trigger", "log relapse", or wants to record metrics to log.csv.
---

# Log

Data entry skill for progress tracking. Single source of truth: `~/Documents/tracker/log.csv`

## CSV Schema
```
date,metric,value,notes
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
| note | text | freeform note |

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
Add a freeform note.
```
/log note "feeling strong today"
→ 2025-02-01,note,feeling strong today,
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

## Behavior

1. Parse the command
2. Get today's date in YYYY-MM-DD format
3. Append row(s) to log.csv
4. Confirm what was logged
5. If relapse logged, offer to run /craving-support

## File Location
```
~/Documents/tracker/log.csv
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
