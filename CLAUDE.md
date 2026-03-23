# Progress Tracker

Personal life execution system for health, career, relationships, finances, fun, personal_growth, and environment.

## Objective

Turn daily inputs into reliable next actions using canonical CSV data.

## Canonical Domain Taxonomy (7 domains)

Use these exact IDs anywhere a life area/domain/category is referenced:

| Domain ID         | Covers                                         |
| ----------------- | ---------------------------------------------- |
| `health`          | body comp, training, nutrition, sleep, emotional regulation |
| `career`          | deep work, output, visibility, skills          |
| `relationships`   | partner, friends, family, social               |
| `finances`        | income, net worth, spending, compounding       |
| `fun`             | hobbies, play, positive-sum leisure            |
| `personal_growth` | reading, reflection, philosophy, learning, meditation, spirituality, addiction recovery, sobriety |
| `environment`     | home, workspace, surroundings, city, aesthetics |

Travel is a sub-concern (`finances` + `fun` + `relationships`), not a standalone domain.
Legacy domain IDs (`addiction`, `mental`) in historical CSV rows remain valid — do not backfill.

### 4-Pillar Vision Model

The 4-pillar model is the human-facing overlay used in `data/vision.json`, the `/vision` page, and weekly+ check-ins. The 7 canonical IDs remain the tagging standard in all CSVs.

| Pillar | ID | Canonical IDs | Covers |
|--------|-----|--------------|--------|
| Health | `health` | `health` | Body comp, training, nutrition, sleep, emotional regulation |
| Wealth | `wealth` | `career`, `finances` | Deep work, output, visibility, skills, income, net worth |
| Love | `love` | `relationships` | Partner, friends, family, social |
| Self | `self` | `personal_growth`, `fun`, `environment` | Reading, reflection, meditation, addiction recovery, hobbies, home |

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
| **Core Data** | L1 | `data/*.csv` | "What does core data say?" |
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
| `docs/life-playbook.md` | Domain protocols and constraints             |
| `docs/app-intent.md`   | Product direction, health metrics, decisions  |
| `docs/feature-spec-template.md` | Spec skeleton (sections 1-10) -- used by `/feature-interview` |
| `docs/execution-playbook.md` | Async execution, verification gates, Chrome protocol, lessons |

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

## CSV Headers (quick ref — full semantics in `docs/data-schemas.md`)

```
daily_signals: date,signal,value,unit,context,source,capture_id,category
workouts:      date,workout,exercise,set,weight,reps,notes
plan:          date,start,end,item,done,notes,domain
todos:         id,item,done,created,domain
reflections:   date,domain,win,lesson,change,archived
inbox:         capture_id,captured_at,source,raw_text,status,suggested_destination,normalized_text,error
groceries:     item,section,done,added
resources:     title,author,type,domain,status,notes
briefing_feedback: date,state,rating,feedback_text,briefing_hash
experiments:        name,hypothesis,start_date,duration_days,domain,status,verdict,reflection
```

## Skills

| Skill            | Purpose                                 | Triggers                               |
| ---------------- | --------------------------------------- | -------------------------------------- |
| `/log`           | Quick-fire utility for one-off CSV writes. `/checkin` + voice cover most logging — `/log` is best for quick weight entries and notes | `log weight`, `log note`, `log relapse` |
| `/weekly-review` | Weekly accountability and planning      | `weekly review`, `plan the week`       |
| `/review-notes`  | Cross-CSV activity summary              | `review notes`, `what happened`        |
| `/checkin`       | Single entry point for all daily writes. Morning: log, anchor, plan. Evening: decompress, reflect, set tomorrow. Also handles weekly/monthly/quarterly. Absorbed /plan skill. | `checkin`, `check in`, `morning check-in`, `plan`, `add block` |
| `/feature-interview` | Scope a feature: audit, interview, lock decisions, write spec | `feature interview`, `spec a feature`, `new feature` |
| `/audit`         | Codebase health scan (read-only, versioned reports) | `audit`, `find dead code`, `cleanup scan` |
| `/remove-slop`   | Strip AI-generated code slop from diff   | `remove slop`, `clean up slop`, `slop check` |
| `/qa`            | Live smoke test via Chrome — hits routes, reads console/network, fixes issues | `qa`, `smoke test`, `test the app` |
| `/relationship`  | CBT-informed relationship coach — thought records, pattern review, state snapshot | `relationship`, `basia`, `relationship doubt` |

## Guardrails

- CSVs are truth.
- Keep logic in `lib/` and `api/`, not UI.
- Voice + text both flow through the same inbox pipeline.
- Keep navigation flat: use top-level routes for primary surfaces; avoid secondary route trees and prefer in-page tabs/sidebars/modals for depth.
- **Agents are for reasoning, not computation.** Easily-defined compute (streaks, aggregations, date math, filtering, pivoting, grids, scoring) belongs in `scripts/`. Agents receive pre-computed JSON via stdout and reason over the residual. An agent that counts rows is wasting tokens.

## Health Metrics (must not degrade)

- **3-layer boundary integrity**: CSV (data) / lib+api (intelligence) / pages (surface) stays clean
- **Flat navigation**: no new route trees — depth via in-page UI only
- **Capture reliability**: voice/text intake pipeline must keep working
- **Data simplicity**: no new CSV files unless existing ones genuinely can't hold the data
- **Startup friction**: daily use shouldn't require more steps than it does today

## Escalation Triggers (Project-Specific)

In addition to root-level escalation rules, ask before:

- Creating a new top-level route or API endpoint.
- Modifying CSV schemas (adding/removing/renaming columns).
- Changing the voice-inbox script.

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
