# Data Schemas

All data lives in CSV files at repo root.

## daily_signals.csv — Canonical daily signals

```
date,signal,value,unit,context,source,capture_id,category
```

| signal | values | meaning |
|--------|--------|---------|
| weight | number | lbs |
| lol, weed, poker | 0/1 | 0=relapse, 1=clean |
| gym, sleep, meditate, deep_work, ate_clean | 0/1 | 0=missed, 1=done |
| calories | number | daily total |
| trigger | text | what caused craving |
| relapse | text | what was relapsed on |
| reset | 1 | marks a reset day |

## workouts.csv — Set-level gym data

```
date,workout,exercise,set,weight,reps,notes
```

## plan.csv — Daily schedule

```
date,start,end,item,done,notes
```

- All-day events: `start=0, end=0`
- Completion: `done` as `"1" | "0" | ""`
- No dedicated primary key (keyed by `date + item`)

## todos.csv — Task backlog

```
id,item,done,created
```

- Auto-increment numeric `id`

## reflections.csv — Daily micro-reflections

```
date,domain,win,lesson,change
```

| domain | meaning |
|--------|---------|
| gym | workout reflection |
| addiction | recovery reflection |
| deep_work | focused work reflection |
| eating | nutrition reflection |
| sleep | sleep quality reflection |

## inbox.csv — Capture queue

```
capture_id,captured_at,source,raw_text,status,suggested_destination,normalized_text,error
```

- Statuses: `new | needs_review | accepted | archived | failed`

## ideas.csv — Idea backlog

```
id,created_at,title,details,domain,status,source,capture_id
```

- Domains: `app | health | life | system`
- Statuses: `inbox | reviewed | building | archived`

## Relationships

```
daily_signals.csv ──── gym=1 means detail in workouts.csv
                  ──── deep_work=1 + context has session detail
                  ──── ate_clean + calories = nutrition state
inbox.csv ─────────── routes to: daily_signals, workouts, reflections, ideas
reflections.csv ───── one per domain per day (gym, addiction, deep_work, eating, sleep)
```
