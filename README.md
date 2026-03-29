# Progress Tracker

Local-first personal assistant system for daily execution.

## Primary Objective
Convert daily life data into one clear next action, then close the loop with reflection.

At any time, the system should answer:
1. What matters now?
2. What pattern is forming?
3. What should I do next?

## Operating Model
`Capture -> Normalize -> Decide -> Execute -> Reflect -> Adapt`

Rules:
- CSVs in `data/` are canonical truth.
- Shared interpretation/mutation logic lives in `app/app/lib` and `app/app/api`.
- UI surfaces consume read models and trigger actions; they do not invent semantics.

## Canonical Data Files
| File | Purpose |
|---|---|
| `data/daily_signals.csv` | Daily facts (habits, metrics, events) |
| `data/workouts.csv` | Set-level workout detail |
| `data/plan.csv` | Time blocks and completion |
| `data/todos.csv` | Action backlog |
| `data/reflections.csv` | Win/lesson/change memory |
| `data/inbox.csv` | Raw capture audit log |

## Product Surfaces
| Route | Role |
|---|---|
| `/` | Hub: priority and next action |
| `/plan` | Calendar execution + todo scheduling |
| `/health` | Training and body metrics |
| `/mind` | Mind loops + reflection analysis |
| `/ideas` | Idea pipeline status |
| `/resources` | Library surface (resources + quotes) |
| `/vision` | Optional standalone strategy view |

Redirects:
- `/quotes` -> `/resources`

## Voice + Text Pipeline
Phone capture (voice or text) is sent through GitHub Issues and processed by `scripts/voice-inbox.sh`:
1. Append raw capture to `data/inbox.csv`
2. Route normalized data to canonical CSVs
3. Commit changes
4. Comment + close issue

## Key Paths
- `app/app/lib/csv.ts` - CSV access and analytics helpers
- `app/app/lib/config.ts` - static domain config
- `app/app/api/*` - API read/write surface
- `app/app/components/*` - UI components
- `.claude/prompts/voice-inbox.md` - voice intake instructions
- `.claude/skills/*` - local assistant skills

## Development
```bash
cd app
nvm use 22.14.0
npm install
npm run dev
```

Validation:
```bash
npm run lint
npm run build
```

## Documentation
- `CLAUDE.md` - assistant operating instructions for this repo
- `app/README.md` - app-specific architecture and guardrails
- `docs/architecture.md` - system flow and boundaries
- `docs/data-schemas.md` - CSV contracts
- `docs/life-playbook.md` - life-domain protocols and constraints

## Cleanup Rules
- Minimal by default
- Delete obsolete files directly
- Keep one canonical description per concept
- Prefer deterministic logic over hidden prompt behavior
