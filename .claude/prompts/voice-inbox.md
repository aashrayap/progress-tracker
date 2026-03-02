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
After processing, write JSON to `/tmp/voice-inbox-ntfy.json`.

Every notification must include: `type`, `title`, `body`, `tags`, `priority`.
- `body` must start with `✓`
- `title` must be ≤ 50 chars
- `type` must be one of: `weight`, `workout`, `addiction`, `habit`, `reflection`, `todo`, `idea`, `multi`
- `priority` is `3` unless specified otherwise below
- calm factual tone, no motivational language

Use the schema matching the routing category. Compute metrics from the CSV data you already read.

### type: "weight"
```json
{
  "type": "weight",
  "title": "Weight: {value} {unit}",
  "body": "✓ {value}{unit} — {delta with direction} from last ({days_ago}d ago)",
  "tags": "weight",
  "priority": 3
}
```
Delta = difference from most recent prior weight row in daily_signals.csv. If no prior row, omit delta and just show the value.

### type: "workout"
```json
{
  "type": "workout",
  "title": "{workout_label} logged",
  "body": "✓ {exercise_count} exercises, {total_sets} sets\n{heaviest_set_per_exercise}\nGym streak: {consecutive_gym_1_days}",
  "tags": "muscle",
  "priority": 3
}
```
Gym streak = count of consecutive days with `gym,1` in daily_signals.csv ending today. Heaviest set per exercise = `exercise weight×reps` for the top set of each.

### type: "addiction" (weed/lol/poker signals)
Clean day (value=1):
```json
{
  "type": "addiction",
  "title": "{signal}: day {streak}",
  "body": "✓ Clean day {streak}.{context_if_provided}",
  "tags": "{signal},white_check_mark",
  "priority": 3
}
```
Relapse (value=0):
```json
{
  "type": "addiction",
  "title": "{signal}: reset",
  "body": "✓ Logged. Streak was {previous_streak}.{context_if_provided}",
  "tags": "{signal},warning",
  "priority": 4
}
```
Streak = consecutive days with `{signal},1` in daily_signals.csv before today. Context = user's words if they gave a reason.

### type: "habit" (gym/sleep/meditate/deep_work/ate_clean/calories)
```json
{
  "type": "habit",
  "title": "{signal}: {done|missed}",
  "body": "✓ {signal}={done|missed}.{context_if_any}\nLast 7d: {count}/7",
  "tags": "{signal}",
  "priority": 3
}
```
Last 7d = count of `{signal},1` rows in the 7 calendar days ending today.

### type: "reflection"
```json
{
  "type": "reflection",
  "title": "Reflection: {domain}",
  "body": "✓ Lesson: {lesson}\nChange: {change}",
  "tags": "memo,{domain}",
  "priority": 3
}
```
Show lesson and change only. Do not include win — the notification reinforces the forward-looking action.

### type: "todo"
```json
{
  "type": "todo",
  "title": "Todo added",
  "body": "✓ {item}\nOpen todos: {count_where_done=0}",
  "tags": "clipboard",
  "priority": 3
}
```

### type: "idea"
```json
{
  "type": "idea",
  "title": "Idea captured",
  "body": "✓ Routed to idea pipeline: {first_30_chars}...",
  "tags": "bulb",
  "priority": 3
}
```

### type: "multi" (voice note hit multiple categories)
```json
{
  "type": "multi",
  "title": "Logged {n} items",
  "body": "✓ {category}: {one-line summary}\n✓ {category}: {one-line summary}",
  "tags": "{first_category_tag}",
  "priority": 3
}
```
Use the most specific type's tag. Each line follows that type's body pattern but condensed to one line. If an addiction relapse is among them, priority = 4.

## Final Check
Before finishing, verify:
1. `inbox.csv` has the raw capture row
2. All routed rows landed in expected files
3. Notification JSON exists at `/tmp/voice-inbox-ntfy.json`
