# Progress Tracker

Personal life execution system for weight, addiction recovery, fitness, money, and travel.

## Objective
Turn daily inputs into reliable next actions using canonical CSV data.

## Read Before Editing
| Doc | Use when |
|---|---|
| `docs/architecture.md` | System boundaries, data flow, voice pipeline |
| `docs/data-schemas.md` | CSV headers and write semantics |
| `docs/features.md` | Active surfaces and current gaps |
| `docs/personal-os.md` | Runtime loop and decision quality |
| `docs/life-playbook.md` | Domain protocols and constraints |

## Commands
```bash
cd app && npm run dev
nvm use 22.14.0
```

## Key Paths
- `app/app/lib/csv.ts`
- `app/app/lib/config.ts`
- `app/app/api/`
- `app/app/components/`
- `scripts/voice-inbox.sh`

## Canonical Data Files
- `daily_signals.csv`
- `workouts.csv`
- `plan.csv`
- `todos.csv`
- `reflections.csv`
- `inbox.csv`

## Skills
| Skill | Purpose | Triggers |
|---|---|---|
| `/log` | Structured data entry to canonical CSVs | `log weight`, `log day`, `log relapse` |
| `/reflect` | Daily micro-reflection capture | `reflect`, `what did I learn` |
| `/weekly-review` | Weekly accountability and planning | `weekly review`, `plan the week` |
| `/review-notes` | Cross-CSV activity summary | `review notes`, `what happened` |

## Guardrails
- CSVs are truth.
- Keep logic in `lib/` and `api/`, not UI.
- Minimal by default.
- Delete obsolete code/docs instead of commenting out.
- Voice + text both flow through the same inbox pipeline.
