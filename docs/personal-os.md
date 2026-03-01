# Personal OS Blueprint

## Mission
Reduce decision friction by converting raw life input into clear, evidence-backed actions.

## Runtime Loop
`Capture -> Normalize -> Interpret -> Decide -> Execute -> Reflect -> Adapt`

## Success Criteria
1. Daily startup is low-friction and gives one clear next move.
2. Weekly reviews produce rule updates, not just notes.
3. Lessons compound into better future decisions.

## Memory Model
1. Event memory: what happened (`daily_signals`, `workouts`, `reflections`)
2. State memory: where things stand now (API read models)
3. Rule memory: what to do when patterns recur (playbook + recurring lessons)
4. Action memory: what changes next (`plan`, `todos`)

## Operating Contracts
1. CSVs are canonical source of truth.
2. Shared business logic lives in `app/app/lib` and `app/app/api`.
3. Surfaces execute; they do not redefine semantics.
4. Insights should map to an action path when possible.

## Decision Quality Bar
A recommendation should be:
- time-bounded,
- evidence-backed,
- actionable,
- reviewable later as done/not-done.

## Near-Term Focus
1. Data integrity and stable write contracts
2. Better capture quality and routing confidence
3. Stronger reflection-to-action closure
4. More reliable next-action ranking in Hub
