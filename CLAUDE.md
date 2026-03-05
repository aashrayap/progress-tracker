# Progress Tracker

Personal life execution system for weight, addiction recovery, fitness, money, and travel.

## Objective

Turn daily inputs into reliable next actions using canonical CSV data.

## Read Before Editing

| Doc                     | Use when                                     |
| ----------------------- | -------------------------------------------- |
| `docs/architecture.md`  | System boundaries, data flow, voice pipeline |
| `docs/data-schemas.md`  | CSV headers and write semantics              |
| `docs/features.md`      | Active surfaces and current gaps             |
| `docs/personal-os.md`   | Runtime loop and decision quality            |
| `docs/life-playbook.md` | Domain protocols and constraints             |
| `docs/app-intent.md`   | Product direction, health metrics, decisions  |

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
- `mind_loops.csv`
- `groceries.csv`
- `inbox.csv`

## Skills

| Skill            | Purpose                                 | Triggers                               |
| ---------------- | --------------------------------------- | -------------------------------------- |
| `/log`           | Structured data entry to canonical CSVs | `log weight`, `log day`, `log relapse` |
| `/reflect`       | Daily micro-reflection capture          | `reflect`, `what did I learn`          |
| `/weekly-review` | Weekly accountability and planning      | `weekly review`, `plan the week`       |
| `/review-notes`  | Cross-CSV activity summary              | `review notes`, `what happened`        |

## Guardrails

- CSVs are truth.
- Keep logic in `lib/` and `api/`, not UI.
- Voice + text both flow through the same inbox pipeline.
- Keep navigation flat: use top-level routes for primary surfaces; avoid secondary route trees and prefer in-page tabs/sidebars/modals for depth.

## Escalation Triggers (Project-Specific)

In addition to root-level escalation rules, ask before:

- Creating a new top-level route or API endpoint.
- Modifying CSV schemas (adding/removing/renaming columns).
- Changing the voice-inbox or idea-pipeline scripts.

## Common Failure Modes

- Adding business logic to page components instead of `lib/` or `api/`.
- Creating a new CSV file when an existing one can hold the data.
- Adding config values to `config.ts` that are really runtime data (belongs in CSV).
- Breaking the 3-layer boundary: CSV (data) → lib+api (intelligence) → pages (surface).

## Verification (Project-Specific)

In addition to root-level verification:

1. Run `cd app && npm run build` — fix any errors before reporting done.
2. If you modified an API route, show the curl command to test it.
3. If you modified UI, describe what changed visually.
