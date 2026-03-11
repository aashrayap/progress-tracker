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
- `weekly_experiment` (text) — one small behavior change to test this week, `value=<domain>`, `context=<description>`
- `experiment_result` (`yes|partial|no`) — outcome of last week's experiment, `context=<what was learned>`
- `weekly_goal` (text) — 1-3 vision-connected goals per week, `value=<domain>`, `context=<goal text>`
- `weekly_goal_result` (`complete|missed|partial`) — outcome of prior week's goal, `context=<goal text>`

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

JSON file (not CSV). Read-only from the app's perspective — authored manually or by AI sessions.

```json
{
  "horizon": "March 2029",
  "identityNorthStar": "<string>",
  "domains": [
    {
      "id": "<slug>",
      "label": "<display name>",
      "canonicalId": "<canonical domain ID>",
      "hex": "<color hex>",
      "threeYearDestination": "<string>",
      "now": "<string>",
      "ninetyDay": "<string>",
      "threeYear": "<string>"
    }
  ]
}
```

- `canonicalId` maps each vision domain to the 7 canonical domain IDs (a vision domain may share a canonicalId with another, e.g. `family_friends` and `romance` both map to `relationships`)
- Consumed by `/api/vision` (GET, read-only) and rendered on the `/vision` surface
- Supersedes the previous hardcoded vision data in `app/app/vision/page.tsx`

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
