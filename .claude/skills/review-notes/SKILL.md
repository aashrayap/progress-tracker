---
name: review-notes
description: Review notes and activity across all tracking files. Use when user says "review notes", "what happened", "show notes", "what did I do", "review last week", or wants to see a summary of logged activity over a time period.
---

# Review Notes

Surface everything that happened in a time period across all tracking files.

## Data Sources

| File | What to pull | Path |
|------|-------------|------|
| daily_signals.csv | Rows with non-empty `context` + all `trigger`/`relapse` signals | `~/Documents/tracker/daily_signals.csv` |
| inbox.csv | Raw captures in review flow (`new`, `needs_review`, `routed`) | `~/Documents/tracker/inbox.csv` |
| reflections.csv | All reflections (win/lesson/change per domain) | `~/Documents/tracker/reflections.csv` |
| plan.csv | Scheduled items (show done status) | `~/Documents/tracker/plan.csv` |
| todos.csv | Tasks created in the period | `~/Documents/tracker/todos.csv` |
| workouts.csv | Set-level gym data | `~/Documents/tracker/workouts.csv` |

## Schemas

```
daily_signals.csv: date,signal,value,unit,context,source,capture_id,category
inbox.csv:         capture_id,captured_at,source,raw_text,status,suggested_destination,normalized_text,error
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
├─ 📨 [inbox capture] [status]: [raw_text]
├─ 🪞 [domain]: ✓ [win] | 💡 [lesson] | → [change]  (from reflections.csv)
├─ ⚠ trigger: [value] — [context from daily_signals]
├─ 🔴 relapse: [value] — [context from daily_signals]
├─ 📊 [signal]: [context from daily_signals]  (only rows with non-empty context)
├─ 🏋 [exercise]: [weight]×[reps] ×[sets]  (from workouts.csv)
├─ 📅 [start]-[end] [item] [✓/✗]  (from plan.csv)
└─ ☐/☑ [todo item]  (from todos.csv, by created date)

📅 [NEXT DATE]
└─ ...

───────────────────
SUMMARY
├─ Inbox captures: X
├─ Contextual signals: X
├─ Reflections: X
├─ Triggers: X
├─ Relapses: X
├─ Plans scheduled: X (Y completed)
└─ Todos created: X (Y done)
```

## Rules

- Skip dates with no entries
- Triggers and relapses always shown (even if notes column empty)
- For daily_signals rows: only show if context is non-empty OR signal is trigger/relapse
- Include inbox captures for the period regardless of whether they were routed
- plan.csv: show ✓ if done column has any value, ✗ if empty
- todos.csv: ☑ if done=1, ☐ if done=0
- If no data found for the period, say so plainly
- Keep output scannable — no prose paragraphs

## Don't

- Editorialize or add motivational commentary
- Show raw CSV data
- Add entries outside the date range
- Modify any files (this is read-only)
