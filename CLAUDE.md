# Progress Tracker

Personal life execution system for health, addiction, mental, career, relationships, finances, fun, and personal_growth.

## Objective

Turn daily inputs into reliable next actions using canonical CSV data.

## Canonical Domain Taxonomy (8 domains)

Use these exact IDs anywhere a life area/domain/category is referenced:

| Domain ID         | Covers                                         |
| ----------------- | ---------------------------------------------- |
| `health`          | body comp, training, nutrition, meals          |
| `addiction`       | sobriety, triggers, relapse, streaks           |
| `mental`          | sleep, meditation, emotional regulation        |
| `career`          | deep work, output, visibility, skills          |
| `relationships`   | partner, friends, family, social               |
| `finances`        | income, net worth, spending, compounding       |
| `fun`             | hobbies, play, positive-sum leisure            |
| `personal_growth` | reading, reflection, philosophy, learning      |

Travel is a sub-concern (`finances` + `fun` + `relationships`), not a standalone domain.

## System Vocabulary

Use these terms consistently in docs, specs, code comments, and conversation:

```
┌─────────────────────────────────────────────────────────┐
│ Layer 0: Core Docs       (defines the system)           │
│ Layer 1: Core Data       (records evidence)             │ ← Foundation
├─────────────────────────────────────────────────────────┤
│ Layer 2: Intelligence    (lib + api — computes meaning) │ ← Backend = L0-L2
├─────────────────────────────────────────────────────────┤
│ Layer 3: Surfaces        (pages + components — UI)      │
└─────────────────────────────────────────────────────────┘
```

| Term | Layers | Contains | When to use |
|------|--------|----------|-------------|
| **Core Docs** | L0 | `CLAUDE.md`, `docs/*.md` | "Does this align with core docs?" |
| **Core Data** | L1 | `data/*.csv`, `insights.csv` | "What does core data say?" |
| **Foundation** | L0 + L1 | Core Docs + Core Data | "Bring the UI in line with foundation" |
| **Intelligence** | L2 | `app/app/lib/`, `app/app/api/` | "This logic belongs in intelligence, not surfaces" |
| **Backend** | L0-L2 | Foundation + Intelligence | "Is this a backend or surface change?" |
| **Surfaces** | L3 | `app/app/*/page.tsx`, `app/app/components/` | "Surfaces consume, they don't define" |

Core rule: each layer only depends downward. Surfaces consume Intelligence. Intelligence reads Foundation. Foundation is self-contained.

## Read Before Editing

| Doc                     | Use when                                     |
| ----------------------- | -------------------------------------------- |
| `docs/architecture.md`  | System boundaries, data flow, voice pipeline |
| `docs/data-schemas.md`  | CSV headers and write semantics              |
| `docs/features.md`      | Active surfaces and current gaps             |
| `docs/personal-os.md`   | Runtime loop and decision quality            |
| `docs/life-playbook.md` | Domain protocols and constraints             |
| `docs/app-intent.md`   | Product direction, health metrics, decisions  |
| `docs/feature-spec-template.md` | Feature spec + verification protocol (read before any feature work) |

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

- `data/daily_signals.csv`
- `data/workouts.csv`
- `data/plan.csv`
- `data/todos.csv`
- `data/reflections.csv`
- `data/mind_loops.csv`
- `data/groceries.csv`
- `data/inbox.csv`

## Skills

| Skill            | Purpose                                 | Triggers                               |
| ---------------- | --------------------------------------- | -------------------------------------- |
| `/log`           | Structured data entry to canonical CSVs | `log weight`, `log day`, `log relapse` |
| `/reflect`       | Daily micro-reflection capture          | `reflect`, `what did I learn`          |
| `/weekly-review` | Weekly accountability and planning      | `weekly review`, `plan the week`       |
| `/review-notes`  | Cross-CSV activity summary              | `review notes`, `what happened`        |
| `/checkin`       | Guided daily/weekly/monthly check-in     | `checkin`, `check in`, `morning check-in` |

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
- Breaking the layer boundary: Foundation (L0-L1) → Intelligence (L2) → Surfaces (L3).

## Verification (Project-Specific)

In addition to root-level verification:

1. Run `cd app && npm run build` — fix any errors before reporting done.
2. If you modified an API route, show the curl command to test it.
3. If you modified UI, describe what changed visually.
