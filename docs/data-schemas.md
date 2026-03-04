# Data Schemas

All canonical state lives in CSV files at repo root.

## daily_signals.csv
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

## workouts.csv
```
date,workout,exercise,set,weight,reps,notes
```

## plan.csv
```
date,start,end,item,done,notes
```

## todos.csv
```
id,item,done,created
```

## reflections.csv
```
date,domain,win,lesson,change
```

## inbox.csv
```
capture_id,captured_at,source,raw_text,status,suggested_destination,normalized_text,error
```

## mind_loops.csv
```
date,trigger,autopilot_action,updated_action,response,lens,emotion_before,emotion_after,body_sensation,thought_pattern,value_target,source,capture_id
```

Fields:
- `lens`: therapy framework — `CBT`, `DBT`, `IFS`, `ACT`, `somatic`, or empty
- `emotion_before` / `emotion_after`: 0–10 scale
- `thought_pattern`: e.g. `catastrophizing`, `emotional_reasoning`, `black_and_white`
- `value_target`: which life value this loop connects to

## groceries.csv
```
item,section,done,added
```

Sections follow HEB store walk order:
`produce`, `bakery`, `deli`, `meat`, `dairy`, `frozen`, `beverages`, `canned`, `pasta_rice`, `baking`, `cereal`, `snacks`, `condiments`, `household`, `health`

- Rolling checklist — items added throughout the week, checked off during trip
- `done`: `0|1`
- Clear completed items after each shopping trip

## resources.csv
```
title,author,type,domain,status,notes
```

- `type`: `book`, `essay`, `article`, `video`, `podcast`
- `domain`: freeform life area — `spirituality`, `tech`, `fitness`, `addiction`, `finance`, `nutrition`, `psychology`, etc.
- `status`: `unread`, `reading`, `done`

## Relationship Notes
- `gym=1` in `daily_signals.csv` can have supporting set data in `workouts.csv`.
- `meditate=1` in `daily_signals.csv` can have supporting loop data in `mind_loops.csv`.
- `inbox.csv` is append-only audit memory for raw captures.
- `plan.csv` + `todos.csv` represent action memory.
- `reflections.csv` stores evidence for future rule updates.
