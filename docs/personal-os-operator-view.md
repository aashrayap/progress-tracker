# Personal OS Operator View

One-screen mental model for running the system.

## Decision Loop (single view)

```
                               PERSONAL OS
┌─────────────────────────────────────────────────────────────────────────────────┐
│ CAPTURE            INTERPRET             DECIDE               EXECUTE           │
│                                                                                 │
│ Manual input       Domain readers        Priority now         Plan + habits      │
│ Voice inbox        Pattern detection     One next action      Workout/tasks      │
│ CSV append         State snapshots       Risk flags           Completion marks   │
└───────────┬───────────────────┬──────────────────┬──────────────────┬────────────┘
            │                   │                  │                  │
            ▼                   ▼                  ▼                  ▼
      log.csv +             API contracts       Hub/Pages         plan.csv
      reflections.csv       (stable meaning)    (time-aware)      todos.csv
      workouts.csv                                                 workouts.csv
            │                                                          │
            └──────────────────────────────┬───────────────────────────┘
                                           ▼
                                  REFLECT + ADAPT
                              reflections.csv updates
                         yesterday change -> today decision
```

## Clock View (when to show what)

```
Morning (prime)            Day (execute)                 Evening (close loop)
------------------         ------------------            ---------------------
- Yesterday changes        - Current plan block          - Domain reflection
- Main risk today          - Habit completion            - Win/Lesson/Change
- One key action           - Gym/work tracking           - Carry forward change
```

## Truth Stack

```
Level 1: Raw events      -> log.csv, workouts.csv, reflections.csv
Level 2: Domain meaning  -> app/app/lib/csv.ts + app/app/lib/types.ts
Level 3: Decisions       -> API payloads and UI prompts
```

Rule: if meaning is only in free text, it is not fully operational.

## Command Center Questions

At any point, the system should answer:

1. What matters now?
2. What pattern is forming?
3. What one action changes trajectory today?

If a screen cannot answer one of these, it is informational, not operational.

## Failure Alarms

```
ALARM A: Duplicate logic      -> Same metric computed differently in multiple routes
ALARM B: Buried semantics     -> Category/context trapped in notes text
ALARM C: Reflection orphaning -> Lessons captured but not shown at decision time
ALARM D: Tracker mode drift   -> More logging surfaces, no stronger next-action guidance
```

## Operator Checklist (daily)

```
[ ] Morning: reviewed yesterday's change before planning
[ ] Day: captured key events with minimal friction
[ ] Evening: wrote at least one high-quality reflection
[ ] System: today's reflection influenced tomorrow's first decision
```

## Build Guardrail

Any new feature must improve at least one of:

- decision timing
- meaning consistency
- compounding memory
- resilience on bad days

If not, do not ship.
