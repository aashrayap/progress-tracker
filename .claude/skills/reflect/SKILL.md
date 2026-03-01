---
name: reflect
description: Capture daily micro-reflections (win/lesson/change) by domain.
---

# Reflect

Capture concise end-of-day reflection entries.

## Canonical File
- `~/Documents/tracker/reflections.csv`

## Header
```
date,domain,win,lesson,change
```

## Commands
- `/reflect`
- `/reflect <domain>`
- `/reflect <freeform text>`

## Valid Domains
- `gym`
- `addiction`
- `deep_work`
- `eating`
- `sleep`

## Behavior
Prompted mode:
1. Resolve domain
2. Ask `win`, `lesson`, `change`
3. Append reflection row

Natural-language mode:
1. Infer domain
2. Extract `win`, `lesson`, `change`
3. Append reflection row

## Rules
- Keep fields short and concrete.
- If uncertain, leave unclear fields blank rather than guessing.
- Avoid motivational filler; report facts.
