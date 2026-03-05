# App (Next.js)

Web execution surface for the Progress Tracker.

## Scope
- Present decisions and current state from canonical CSV data.
- Mutate data only through API routes.
- Keep business logic in `app/app/lib` and `app/app/api`.

## Routes
| Route | Role |
|---|---|
| `/` | Hub: current priority + next action |
| `/plan` | Calendar/time-block execution |
| `/health` | Training + body metrics |
| `/mind` | Mind loops + reflection analysis |
| `/resources` | Library (resources + quotes) |
| `/ideas` | Idea pipeline status |
| `/vision` | Optional standalone strategy view |

Redirects:
- `/reflect` -> `/mind`
- `/quotes` -> `/resources`

## Core APIs
- `/api/hub`
- `/api/daily-signals`
- `/api/health`
- `/api/mind`
- `/api/reflections`
- `/api/plan`, `/api/plan/range`
- `/api/todos`
- `/api/ideas`
- `/api/groceries`
- `/api/resources`
- `/api/quotes`

## Data Location
Canonical CSVs live at repo root (`../`).

## Development
```bash
nvm use
npm install
npm run dev
```

Validation:
```bash
npm run lint
npm run build
```

## Guardrails
1. Reuse shared helpers from `app/app/lib/*`.
2. Keep UI components presentation-focused.
3. Preserve backwards-safe parsing for historical data labels.
