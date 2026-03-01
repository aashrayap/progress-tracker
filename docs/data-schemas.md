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

## Relationship Notes
- `gym=1` in `daily_signals.csv` can have supporting set data in `workouts.csv`.
- `inbox.csv` is append-only audit memory for raw captures.
- `plan.csv` + `todos.csv` represent action memory.
- `reflections.csv` stores evidence for future rule updates.
