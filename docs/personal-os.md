# Personal Assistant OS Blueprint

This document defines how the repo should operate as a personal assistant, not just a tracker.

## Mission

Convert your lived data into reliable decisions and proactive support with minimal repeated instruction.

## What "Assistant OS" Means

The system is successful only when it can do all three consistently:

1. Remember: keep durable context across days and weeks.
2. Reason: detect patterns and risks from current timeframe data.
3. Recommend: produce a clear next action with evidence.

## North Star Outcomes

1. You rarely need to re-explain goals, constraints, or patterns.
2. Daily startup cost is low: one glance gives the next best action.
3. Weekly reviews produce concrete rule updates, not vague notes.
4. Behavior improves over time because reflection changes planning.

## Runtime Loop

```
Capture -> Normalize -> Interpret -> Decide -> Execute -> Reflect -> Adapt
```

### 1) Capture

- Inputs: web app, voice notes, CLI logs.
- Rule: capture should be fast and low-friction.

### 2) Normalize

- Convert raw text to canonical schema fields.
- Resolve aliases and legacy values (example: workout labels).

### 3) Interpret

- Build read models by timeframe and domain.
- Detect trend shifts, misses, and recurring lessons.

### 4) Decide

- Generate one priority next action and optional supporting actions.
- Link each recommendation to concrete evidence.

### 5) Execute

- Present action in the right surface (Hub, Plan, Health, Reflect).
- Make completion logging one click where possible.

### 6) Reflect

- Capture `win`, `lesson`, `change` for each meaningful day.
- Promote repeated lessons to explicit operating rules.

### 7) Adapt

- Update plan templates, triggers, and action backlog.
- Improve future prompts and priorities automatically.

## Memory Model

To avoid repeated explanations, memory must be explicit.

1. Event Memory
   - Source: `daily_signals.csv`, `workouts.csv`, `reflections.csv`.
   - Role: what happened.
2. State Memory
   - Source: derived API read models.
   - Role: where things stand right now.
3. Rule Memory
   - Source: recurring lessons and playbook constraints.
   - Role: what to do when patterns repeat.
4. Action Memory
   - Source: `plan.csv`, `todos.csv`.
   - Role: what is being changed next.

## System Contracts

1. CSVs are canonical source of truth.
2. Shared domain logic lives in `app/app/lib/`.
3. API routes own interpretation and decision payloads.
4. UI surfaces consume read models; they do not invent business logic.
5. Every generated insight should map to at least one action path.

## Product Surfaces and Roles

| Surface | Primary Role |
|---------|--------------|
| `Hub` | Priority and next action now |
| `Plan` | Time-block execution and completion |
| `Reflect` | Evidence + insights + action promotion |
| `Health` | Training and body-composition execution |

## Decision Quality Bar

A recommendation is valid only if it is:

1. Time-bounded (for this day/week/month).
2. Evidence-backed (specific logs/patterns).
3. Actionable (clear action verb).
4. Comparable (can be reviewed later as done/not done).

## 90-Day Build Program

### Phase 1: Contract Stability

1. Freeze canonical headers and parsing behavior.
2. Eliminate semantic drift across endpoints.
3. Add explicit normalization utilities where needed.

### Phase 2: Shared Interpretation

1. Ensure all major read routes support timeframe filtering.
2. Align domain labels and category semantics.
3. Remove duplicate interpretation logic in pages.

### Phase 3: Proactive Decisions

1. Strengthen `/api/hub` next-action prioritization.
2. Add deterministic heuristics for risk and momentum.
3. Ensure recommendations include supporting evidence snippets.

### Phase 4: Action Closure

1. Tighten reflection-to-action flow.
2. Ensure promoted reflection actions can become plan blocks quickly.
3. Track whether recommended actions were actually completed.

### Phase 5: Compounding Memory

1. Promote recurring lessons into explicit rules.
2. Feed those rules into future decision ranking.
3. Improve "bad day" behavior with fallback plans.

## Weekly Review Questions

1. Which recommendations produced real behavior change?
2. Which repeated lessons are not yet encoded as rules?
3. Where is data quality too weak for reliable decisions?
4. What should be automated next to reduce manual overhead?

## Definition of Done for New Features

A feature ships only if it:

1. Strengthens at least one stage of the runtime loop.
2. Uses canonical data semantics.
3. Reduces decision friction, not just adds UI.
4. Improves compounding over repeated use.
5. Keeps behavior useful on low-energy or relapse-risk days.
