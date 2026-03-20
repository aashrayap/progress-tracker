# Data Schemas

All canonical state lives in CSV files under `data/`.

## Canonical Domain Standard

Use these exact IDs for domain/category tagging in new rows:
- `health` (includes sleep, emotional regulation — formerly `mental`)
- `career`
- `relationships`
- `finances`
- `fun`
- `personal_growth` (includes meditation, spirituality, addiction recovery — formerly `addiction`)
- `environment`

Legacy IDs (`addiction`, `mental`) in historical rows remain valid — do not backfill.

Standardized fields:
- `data/daily_signals.csv` -> `category` (optional; canonical IDs for new rows)
- `data/reflections.csv` -> `domain` (canonical IDs for new rows)
- `data/todos.csv` -> `domain` (optional; canonical IDs when set)
- `data/plan.csv` -> `domain` (optional; canonical IDs when set)
- `data/resources.csv` -> `domain` (canonical IDs for new rows; legacy freeform values may remain)

Legacy rows keep historical values. Do not backfill old entries solely for taxonomy changes.

## data/daily_signals.csv
```
date,signal,value,unit,context,source,capture_id,category
```

Common signals:
- `weight` (number)
- `lol`, `weed`, `poker` (`0|1`)
- `gym`, `sleep`, `meditate`, `deep_work`, `ate_clean` (`0|1`)
- `calories` (number)
- `trigger` (text)
- `relapse` (text)
- `reset` (`1`)
- `mind` — trigger keyword in `value`, pipe-delimited context: `thought: X | action: Y | circumstance: Z`, `category` = `mental` or `addiction`
- `category`: optional canonical domain ID for the signal context (`health`, `career`, `relationships`, `finances`, `fun`, `personal_growth`, `environment`)
- `social_contact` (`0|1`) — weekly signal for meaningful social contact, `category=relationships`
- `vision_reviewed` (`1`) — review checkpoint, `context=morning|afternoon|evening`, `category=personal_growth`. Logged via ritual blueprint checkboxes on /vision.
- `weekly_experiment` (text) — **legacy** (replaced by `data/experiments.csv`), `value=<domain>`, `context=<description>`
- `experiment_result` (`yes|partial|no`) — **legacy**, `context=<what was learned>`
- `weekly_goal` (text) — **legacy**, `value=<domain>`, `context=<goal text>`
- `weekly_goal_result` (`complete|missed|partial`) — **legacy**, `context=<goal text>`

## data/workouts.csv
```
date,workout,exercise,set,weight,reps,notes
```

## data/plan.csv
```
date,start,end,item,done,notes,domain
```

## data/todos.csv
```
id,item,done,created,domain
```

## data/reflections.csv
```
date,domain,win,lesson,change,archived
```

- `domain`: canonical domain ID for new rows; legacy values remain valid for historical rows.
- `archived`: `0|1` style flag used by the reflections API (`1` means hidden from active views); leave empty for new rows unless archiving.

## data/inbox.csv
```
capture_id,captured_at,source,raw_text,status,suggested_destination,normalized_text,error
```

## data/groceries.csv
```
item,section,done,added
```

Sections follow HEB store walk order:
`produce`, `bakery`, `deli`, `meat`, `dairy`, `frozen`, `beverages`, `canned`, `pasta_rice`, `baking`, `cereal`, `snacks`, `condiments`, `household`, `health`

- Rolling checklist — items added throughout the week, checked off during trip
- `done`: `0|1`
- Clear completed items after each shopping trip

## data/resources.csv
```
title,author,type,domain,status,notes
```

- `type`: `book`, `essay`, `article`, `video`, `podcast`
- `domain`: canonical domain ID for new rows (`health`, `career`, `relationships`, `finances`, `fun`, `personal_growth`, `environment`); legacy freeform values may remain in old rows
- `status`: `unread`, `reading`, `done`



## data/briefing_feedback.csv
```
date,state,rating,feedback_text,briefing_hash
```

- `state`: briefing state at time of feedback (e.g. `recovery`, `streak`)
- `rating`: `good` or `bad`
- `briefing_hash`: MD5 hash linking feedback to the specific briefing that was shown
- Written by `/api/hub/briefing-feedback` when user rates the daily briefing card

## data/vision.json

JSON file (not CSV). Read/write via `/api/vision` (GET + PUT). Content authored via JSON edit, skills, or checkin.

Reinvention Formula schema — 4-domain ABT(H) model with identity script, ritual blueprint, and weekly review sections:

```json
{
  "identityScript": {
    "coreTraits": "<string>",
    "nonNegotiables": "<string>",
    "languageRules": { "use": ["<string>"], "forbid": ["<string>"] },
    "physicalPresence": "<string>",
    "socialFilter": "<string>",
    "decisionStyle": "<string>"
  },
  "antiVision": "<string>",
  "domains": [
    {
      "id": "health|wealth|love|self",
      "label": "<display name>",
      "hex": "<color hex>",
      "canonicalIds": ["<canonical domain IDs mapped to this vision domain>"],
      "actual": "<string — where I am now>",
      "becoming": "<string — vivid target state>",
      "timeline": "<string — specific deadline>",
      "habits": ["<string — daily actions>"]
    }
  ],
  "intentions": { "daily": "<string>", "weekly": "<string>" },
  "ritualBlueprint": {
    "morning|midday|evening": { "steps": ["<string>"], "habitStacks": ["<string>"] }
  },
  "inputControl": {
    "mentors": [], "books": [], "podcasts": [], "playlists": [],
    "nutritionRules": [], "purgeList": []
  },
  "distractions": {
    "digital": [], "physical": [], "social": [], "mental": [],
    "triggerReplacements": [{ "trigger": "<string>", "replacement": "<string>" }]
  },
  "habitAudit": { "productive": [], "neutral": [], "destructive": [] }
}
```

- 4 vision domains: Health (`health`), Wealth (`career`, `finances`), Love (`relationships`), Self (`personal_growth`, `fun`, `environment`)
- `canonicalIds` maps each vision domain to the 7 canonical domain IDs (one-to-many)
- Consumed by `/vision` page (daily ritual surface) and `/api/vision`

### Vision Write Semantics

vision.json is written via `/api/vision` (PUT for full replace, PATCH for partial update).

| Cadence | Writer | Fields | Merge behavior |
|---------|--------|--------|---------------|
| Weekly | `/checkin weekly` | `domains[].actual`, `domains[].habits`, `intentions.weekly` | Deep merge — only specified domain fields update, others preserved |
| Monthly | `/checkin monthly` | `identityScript`, `antiVision`, `intentions` | Top-level key replace — new identityScript replaces old |
| Quarterly | `/checkin quarterly` | All fields | Full replace via PUT |
| Manual | JSON edit | Any | Full replace via PUT |

The `vision_reviewed` signal in daily_signals.csv tracks when the user reviewed vision.json content:
- `signal=vision_reviewed`, `value=1`, `context=morning|afternoon|evening`, `category=personal_growth`
- Logged via ritual blueprint checkboxes on /vision page
- One signal per context per day (morning, afternoon, evening)

## data/experiments.csv
```
name,hypothesis,start_date,duration_days,domain,status,verdict,reflection
```

- `name`: short label for the experiment (e.g. "Morning meditation before gym")
- `hypothesis`: expected outcome (e.g. "Better focus in first deep work block")
- `start_date`: `YYYY-MM-DD` — date experiment began
- `duration_days`: integer, default 7, minimum 1
- `domain`: canonical domain ID (`health`, `career`, `relationships`, `finances`, `fun`, `personal_growth`, `environment`)
- `status`: `active` or `concluded`
- `verdict`: empty when `status=active`; one of `kept`, `dropped`, `extended` when `status=concluded`
- `reflection`: empty when `status=active`; one-line reflection when concluded

Derived state (computed at read time, not stored):
- **Expired**: `status=active` AND `today >= start_date + duration_days` — needs concluding
- **Day count**: `today - start_date + 1` for active experiments, capped at `duration_days`

Replaces the legacy `weekly_experiment` and `experiment_result` signals in `daily_signals.csv` for new experiments. Historical signal rows in `daily_signals.csv` are preserved — not backfilled or deleted.

## Side Effect Rules

Enforced by `app/app/lib/router.ts`. Side effects are one level deep — secondary writes call csv.ts directly, never re-enter the router.

| Trigger | Side Effect | Depth |
|---------|-------------|-------|
| workout rows written for date X | ensure `gym=1` in daily_signals for date X | primary |
| `gym=1` written for date X | mark plan item matching "Gym" done | secondary |
| `sleep=1` written for date X | mark plan item matching "Sleep" done | secondary |
| `meditate=1` written for date X | mark plan item matching "Meditate" done | secondary |
| `deep_work=1` written for date X | mark plan item matching "Deep work" done | secondary |

Plan matching uses case-insensitive substring match against a fixed keyword map. No AI, no NLP. If no matching plan item exists, the side effect is a no-op.

## Relationship Notes
- `gym=1` in `data/daily_signals.csv` can have supporting set data in `data/workouts.csv`.
- `signal=mind` in `data/daily_signals.csv` stores mind entries (trigger/thought/action/circumstance) captured during check-in.
- `data/inbox.csv` is append-only audit memory for raw captures.
- `data/plan.csv` + `data/todos.csv` represent action memory.
- `data/reflections.csv` stores evidence for future rule updates.
