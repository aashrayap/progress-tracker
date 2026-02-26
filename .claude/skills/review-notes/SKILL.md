---
name: review-notes
description: Review notes and activity across all tracking files. Use when user says "review notes", "what happened", "show notes", "what did I do", "review last week", or wants to see a summary of logged activity over a time period.
---

# Review Notes

Surface everything that happened in a time period across all tracking files.

## Data Sources

| File | What to pull | Path |
|------|-------------|------|
| log.csv | Rows with non-empty `notes` column + all `trigger`, `relapse`, `note` metric rows | `~/Documents/tracker/log.csv` |
| reflections.csv | All reflections (win/lesson/change per domain) | `~/Documents/tracker/reflections.csv` |
| plan.csv | Scheduled items (show done status) | `~/Documents/tracker/plan.csv` |
| todos.csv | Tasks created in the period | `~/Documents/tracker/todos.csv` |
| workouts.csv | Set-level gym data | `~/Documents/tracker/workouts.csv` |

## Schemas

```
log.csv:          date,metric,value,notes
reflections.csv:  date,domain,win,lesson,change
plan.csv:         date,start,end,item,done,notes
todos.csv:        id,item,done,created
workouts.csv:     date,workout,exercise,set,weight,reps,notes
```

## Commands

```
/review-notes           → last 7 days (default)
/review-notes day       → today only
/review-notes week      → last 7 days
/review-notes month     → last 30 days
/review-notes all       → all time
```

## Behavior

1. Parse the period argument (default: week)
2. Calculate date range from today
3. Read all 4 CSV files
4. Filter entries within the date range
5. Group by date, most recent first
6. Present in the format below

## Output Format

```
📋 NOTES REVIEW — [period label] ([start date] → [end date])

📅 [DATE]
├─ 📝 [note from log.csv metric=note]
├─ 🪞 [domain]: ✓ [win] | 💡 [lesson] | → [change]  (from reflections.csv)
├─ ⚠ trigger: [value] — [notes from log.csv]
├─ 🔴 relapse: [value] — [notes from log.csv]
├─ 📊 [metric]: [notes from log.csv]  (only rows with non-empty notes)
├─ 🏋 [exercise]: [weight]×[reps] ×[sets]  (from workouts.csv)
├─ 📅 [start]-[end] [item] [✓/✗]  (from plan.csv)
└─ ☐/☑ [todo item]  (from todos.csv, by created date)

📅 [NEXT DATE]
└─ ...

───────────────────
SUMMARY
├─ Notes logged: X
├─ Reflections: X
├─ Triggers: X
├─ Relapses: X
├─ Plans scheduled: X (Y completed)
└─ Todos created: X (Y done)
```

## Rules

- Skip dates with no entries
- Triggers and relapses always shown (even if notes column empty)
- For log.csv rows: only show if notes column is non-empty OR metric is trigger/relapse/note
- plan.csv: show ✓ if done column has any value, ✗ if empty
- todos.csv: ☑ if done=1, ☐ if done=0
- If no data found for the period, say so plainly
- Keep output scannable — no prose paragraphs

## Don't

- Editorialize or add motivational commentary
- Show raw CSV data
- Add entries outside the date range
- Modify any files (this is read-only)
