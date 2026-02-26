---
name: reflect
description: Daily micro-reflection (win/lesson/change). Use when user says "reflect", "what did I learn", "end of day review", "how did today go", or wants to capture a reflection on gym, addiction, deep work, eating, or sleep.
---

# Reflect

2-minute daily micro-AAR (After Action Review) across all life domains.

## CSV Schema

```
reflections.csv: date,domain,win,lesson,change
```

| Field | What it captures | Max length |
|-------|-----------------|------------|
| domain | gym, addiction, deep_work, eating, sleep | one word |
| win | What went right (even small) | 1 sentence |
| lesson | What I noticed/learned | 1 sentence |
| change | One micro-adjustment for next time | 1 sentence |

## File Location
```
~/Documents/tracker/reflections.csv
```

## Commands

```
/reflect                    → prompted reflection (asks domain, then 3 questions)
/reflect gym                → reflect on today's gym session
/reflect addiction          → reflect on today's addiction/recovery
/reflect deep_work          → reflect on today's deep work
/reflect eating             → reflect on today's eating
/reflect sleep              → reflect on today's sleep
/reflect <freeform text>    → parse domain + reflection from natural language
```

## Behavior

### Prompted mode (`/reflect` or `/reflect <domain>`)

1. If no domain specified, ask: "What domain? gym / addiction / deep_work / eating / sleep"
2. Ask 3 questions in sequence:
   - "What went right?" → win
   - "What did you learn?" → lesson
   - "What's one change for next time?" → change
3. Append row to reflections.csv
4. Confirm with format below

### Natural language mode (`/reflect <freeform>`)

Parse the text to extract domain, win, lesson, and change. Examples:

```
/reflect gym felt weak after 6 days off, learned I need to deload after gaps, will drop 10% next time
→ domain: gym
→ win: showed up after 6 days off
→ lesson: need to deload after long gaps
→ change: drop weight 10% if 4+ days since last session

/reflect didn't smoke today but boredom hit hard at 3pm, need to schedule afternoon activities
→ domain: addiction
→ win: stayed clean
→ lesson: 3pm boredom is a recurring trigger
→ change: schedule afternoon walk or errand
```

### Voice inbox support

Voice notes starting with "reflect" or containing reflection language ("learned that", "next time I should", "what went well") should be routed here.

## Output Format

```
Reflected on [domain] for [date]:
├─ ✓ Win: [win]
├─ 💡 Lesson: [lesson]
└─ → Change: [change]
```

## Surfacing Reflections

When running /weekly-review or /review-notes, reflections.csv should be included:

```
📅 [DATE]
├─ 🪞 [domain]: [win] | learned: [lesson] | change: [change]
```

The "change" field from yesterday should be surfaced in morning planning.

## Rules

- One reflection per domain per day (overwrite if same domain+date exists)
- Keep all fields to ONE sentence max
- If user gives verbose input, distill to essence
- Never editorialize or add motivational commentary
- If lesson or change is unclear, leave blank rather than fabricate
- Domain must be one of: gym, addiction, deep_work, eating, sleep
