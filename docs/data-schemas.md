# Data Schemas

All canonical state lives in CSV files under `data/`.

## Canonical Domain Standard

Use these exact IDs for domain/category tagging in new rows:
- `health`
- `addiction`
- `mental`
- `career`
- `relationships`
- `finances`
- `fun`
- `personal_growth`

Standardized fields:
- `data/daily_signals.csv` -> `category` (optional; canonical IDs for new rows)
- `data/reflections.csv` -> `domain` (canonical IDs for new rows)
- `data/insights.csv` -> `domain` (required; canonical IDs only)
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
- `category`: optional canonical domain ID for the signal context (`health`, `addiction`, `mental`, `career`, `relationships`, `finances`, `fun`, `personal_growth`)

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

## data/insights.csv
```
id,domain,insight,evidence_count,first_seen,last_seen,status,source
```

Fields:
- `domain`: required canonical domain ID (`health`, `addiction`, `mental`, `career`, `relationships`, `finances`, `fun`, `personal_growth`)
- `evidence_count`: integer count of confirming events/notes
- `status`: `active`, `dormant`, `resolved`
- `source`: `reflection`, `mind_loop`, `signal`, `manual`

## data/inbox.csv
```
capture_id,captured_at,source,raw_text,status,suggested_destination,normalized_text,error
```

## data/mind_loops.csv
```
date,trigger,autopilot_action,updated_action,response,lens,emotion_before,emotion_after,body_sensation,thought_pattern,value_target,source,capture_id
```

Fields:
- `lens`: therapy framework — `CBT`, `DBT`, `IFS`, `ACT`, `somatic`, or empty
- `emotion_before` / `emotion_after`: 0–10 scale
- `thought_pattern`: e.g. `catastrophizing`, `emotional_reasoning`, `black_and_white`
- `value_target`: which life value this loop connects to

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
- `domain`: canonical domain ID for new rows (`health`, `addiction`, `mental`, `career`, `relationships`, `finances`, `fun`, `personal_growth`); legacy freeform values may remain in old rows
- `status`: `unread`, `reading`, `done`

## Relationship Notes
- `gym=1` in `data/daily_signals.csv` can have supporting set data in `data/workouts.csv`.
- `meditate=1` in `data/daily_signals.csv` can have supporting loop data in `data/mind_loops.csv`.
- `data/inbox.csv` is append-only audit memory for raw captures.
- `data/plan.csv` + `data/todos.csv` represent action memory.
- `data/reflections.csv` stores evidence for future rule updates.
