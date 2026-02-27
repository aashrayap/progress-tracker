# App (Next.js)

Web interface for the Personal Assistant OS.

## Scope

This app is the decision and execution surface over canonical CSV data in the repo root.

- Reads and writes through API routes in `app/app/api/*`.
- Uses shared domain/data logic in `app/app/lib/*`.
- Should keep UI focused on action, not raw data browsing.

## Main Routes

| Route | Purpose |
|------|---------|
| `/` | Hub: next action, momentum, daily orientation |
| `/review` | Capture triage and routing review |
| `/plan` | Time blocks + todo execution |
| `/reflect` | Insights/evidence/actions by timeframe |
| `/health` | Training, weight, and workout progression |
| `/ideas` | Backlog lifecycle view |

## Core APIs

| Endpoint | Role |
|---------|------|
| `/api/hub` | Aggregated decision payload for Hub |
| `/api/daily-signals` | Canonical daily event read/write |
| `/api/health` | Health/workout read model |
| `/api/reflections` | Reflection read/write + patterns |
| `/api/deep-work` | Deep-work analytics by timeframe |
| `/api/reflect-insights` | Timeframe-aware insight synthesis |
| `/api/inbox` | Capture queue and review status updates |
| `/api/ideas` | Idea/action backlog read/write |
| `/api/plan` + `/api/plan/range` | Plan CRUD + calendar range read model |
| `/api/todos` | Todo CRUD |

## Data Location

Canonical CSVs live one directory up from this app:

- `../inbox.csv`
- `../daily_signals.csv`
- `../workouts.csv`
- `../reflections.csv`
- `../ideas.csv`
- `../plan.csv`
- `../todos.csv`

## Development

```bash
nvm use
npm install
npm run dev
```

Run checks before finishing changes:

```bash
npm run lint
npm run build
```

## Guardrails

1. Keep business logic in API/lib, not UI components.
2. Reuse canonical helpers from `app/app/lib/csv.ts` and `app/app/lib/config.ts`.
3. Maintain backwards-safe parsing for legacy data labels.
4. Prefer timeframe-aware endpoints for Reflect/analysis features.

## References

- `../README.md`
- `../docs/personal-os.md`
- `../docs/life-playbook.md`
