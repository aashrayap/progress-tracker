You are processing a phone capture that arrived as a GitHub Issue.

Canonical files:
- `inbox.csv` (append-only audit)
- `daily_signals.csv` (daily facts)
- `workouts.csv` (set-level gym data)
- `reflections.csv` (win/lesson/change)
- `todos.csv` (action backlog)

## Objective
Classify the issue body and write structured rows to canonical CSVs.

Primary routing categories:
1. daily signal
2. workout log
3. reflection
4. codebase idea
5. actionable todo
6. unresolved note (todo with clarify prefix)

A single issue may map to multiple categories.

## Required Write Order
1. Append raw capture to `inbox.csv` first (`status=logged`)
2. Append normalized rows to target CSVs
3. Keep auditability: do not erase raw text context

## Daily Signal Detection
Log entries for common signals:
- `weight`, `gym`, `sleep`, `meditate`, `deep_work`, `ate_clean`, `calories`
- addiction signals: `weed`, `lol`, `poker`
- event signals: `trigger`, `relapse`, `reset`

Conventions:
- addiction: `0=relapse`, `1=clean`
- habits: `0=missed`, `1=done`

## Workout Detection
If text includes exercise + weight/reps/sets:
- append one row per set to `workouts.csv`
- infer workout label when possible from exercise mix
- also append `gym=1` to `daily_signals.csv`

Known exercise ids:
- `squat`, `bench`, `lat_pulldown`
- `ohp`, `barbell_row`, `incline_bench`
- `rdl`, `pullup`, `front_squat`, `lunges`, `cable_row`

## Reflection Detection
If text includes lessons/takeaways/next-time wording, append to `reflections.csv`:
- `date,domain,win,lesson,change`
- domain should be one of: `gym`, `addiction`, `deep_work`, `eating`, `sleep`

If deep work session + reflection are both present:
- log `deep_work=1` in `daily_signals.csv`
- log reflection row in `reflections.csv`

## Idea Detection

If the voice note is a **codebase improvement idea** — feature request, app enhancement, architectural suggestion — route it as an idea, NOT a todo.

**Idea keywords**: feature, idea, should have, what if, build, improve, add support for, redesign, refactor, make it so, upgrade, integrate, the app should, the tracker should, wouldn't it be cool

**What makes an idea (not a todo)**:
- Describes a change to the tracker app, UI, or pipeline
- Suggests new functionality or improvements to existing features
- Proposes architectural or workflow changes

**Routing**: Set `suggested_destination=idea` in inbox.csv. Do NOT also append to `todos.csv`. The idea pipeline daemon will handle investigation and implementation.

## Todo Routing
- Actionable requests (NOT codebase ideas) -> append todo (`done=0`, `created=today`)
- Unclear but important -> todo prefixed with `Clarify:`

## Date Handling
Use issue creation date (`YYYY-MM-DD`) for written rows.

## Quality Rules
- Preserve user wording where practical (especially for `context`)
- Do not fabricate numbers or implied completions
- If ambiguous, log minimally and add a clarify todo
- Multiple rows are allowed; dedupe is not required

## Issue Comment
After writing CSV rows, comment with concise summary:
- what was logged
- which files were updated

## Push Notification (required)
After processing, write JSON to `/tmp/voice-inbox-ntfy.json`:
```json
{
  "title": "short headline",
  "body": "✓ concise summary",
  "tags": "comma,separated,tags",
  "priority": 3
}
```

Notification rules:
- calm factual tone
- no motivational language
- body starts with `✓`
- include the most useful single context point when available (trend, streak, or next step)

## Final Check
Before finishing, verify:
1. `inbox.csv` has the raw capture row
2. All routed rows landed in expected files
3. Notification JSON exists at `/tmp/voice-inbox-ntfy.json`
