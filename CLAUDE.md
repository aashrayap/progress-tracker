# Progress Tracker

Personal life system: weight, addiction recovery, fitness, money, travel.

## Docs (read when working on related areas)

| Doc | When to read |
|-----|-------------|
| `docs/architecture.md` | System design, data flow, voice pipeline, app structure |
| `docs/data-schemas.md` | CSV formats, relationships, write conventions |
| `docs/features.md` | Current surfaces, what exists, what's planned |
| `docs/personal-os.md` | Runtime loop, memory model, build phases |
| `docs/life-playbook.md` | Domain protocols: fitness, meals, addiction, finance, travel |

## Commands

```bash
cd app && npm run dev     # Next.js app on localhost:3000
nvm use 22.14.0           # Required for Next.js 16
```

## Key Paths

```
app/app/lib/csv.ts        ← CSV read/write utilities
app/app/lib/config.ts     ← static config (profile, exercises, triggers)
app/app/api/              ← API routes (hub, plan, health, reflections, etc.)
app/app/components/       ← UI components
scripts/voice-inbox.sh    ← voice pipeline processor
```

## Data Files (repo root)

| File | Purpose |
|------|---------|
| `daily_signals.csv` | Daily facts: habits, metrics, streaks |
| `workouts.csv` | Set-level gym data |
| `plan.csv` | Daily schedule blocks |
| `todos.csv` | Task backlog |
| `reflections.csv` | Daily micro-reflections (win/lesson/change) |
| `inbox.csv` | Append-only raw capture audit log |

Full schemas: `docs/data-schemas.md`

## Skills

| Skill | Purpose | Triggers |
|-------|---------|----------|
| /log | Data entry → daily_signals.csv (+ todos for unstructured notes) | log weight, log day, log trigger, log relapse |
| /reflect | Daily micro-AAR → reflections.csv | reflect, what did I learn, end of day review |
| /weekly-review | Accountability, metrics check | plan the week, weekly review, how did I do |
| /review-notes | Review notes/activity across all CSVs | review notes, what happened, show notes |

## Rules

- **CSVs are truth** — all state lives in CSV files at repo root
- **docs/ is reference** — read the relevant doc when working on that area
- **Minimal by default** — no bloat, no dead code
- **Delete > comment** — remove unused code completely
- **Voice-first input** — iOS Shortcut → GitHub Issue → auto-processed
