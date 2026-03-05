# Foundation Restructure — Tracker System

## Context

We completed a design interview to restructure the tracker's foundational files. The goal is NOT app code changes — it's restructuring the docs, CSVs, and context files that the system reasons over.

The core problem: the tracker has four different vocabularies describing the same life areas. This plan unifies them under one canonical domain taxonomy and fills the missing layers (L3 intent, L4 spec) that make the system's AI reasoning effective.

## Canonical Domain Taxonomy (8 domains)

This is the single source of truth. Every file that references a life area uses these IDs:

| Domain | Covers |
|--------|--------|
| health | body comp, training, nutrition, meals |
| addiction | sobriety, triggers, relapse, streaks |
| mental | sleep, meditation, emotional regulation |
| career | deep work, output, visibility, skills |
| relationships | partner, friends, family, social |
| finances | income, NW, spending, compounding |
| fun | hobbies, play, positive-sum leisure |
| personal_growth | reading, reflection, philosophy, learning |

Travel is a sub-concern (finances + fun + relationships), not a domain.

## Two Orthogonal Layering Models

App architecture (how code is built):
- Layer 1: CSV data
- Layer 2: lib + api (intelligence)
- Layer 3: Pages (surfaces)

AI stack (how the system reasons):
- L1 Prompt Craft: skill prompts, /log, /reflect, weekly review
- L2 Context Engineering: CSVs, CLAUDE.md, data-schemas.md, architecture.md
- L3 Intent Engineering: app-intent.md, life-playbook.md, vision.md
- L4 Spec Engineering: distillation rules, acceptance criteria, what "good" means

The system is strong at L1-L2 but weak at L3-L4. This work fills L3 and starts L4.

## Files to Change (in priority order)

### 1. CLAUDE.md — define canonical domain taxonomy (L2)
Add the 8-domain list as the shared vocabulary. All files reference this.

### 2. docs/vision.md — NEW file (L3)
Distill from `vision-session.md` (the raw planning session) into an actionable per-domain goals doc. Do NOT copy the raw session — distill it. Structure:

- Per-domain (all 8 canonical domains): goals at 3 horizons (now / 90-day / 2-year)
- "Now" = immediate focus this week
- "90-day" = matches dopamine reset + habit stabilization timeline
- "2-year" = maps to the March 2028 Best Possible Self scene in vision-session.md
- Include current satisfaction + alignment scores from the wheel of life in vision-session.md
- Do NOT include anti-goals, odyssey plans, or identity map — those live in vision-session.md as historical context

Add a changelog table at the bottom:
```
## Changelog
| Date | What Changed | Why |
|------|-------------|-----|
| 2026-03-05 | Initial distillation from vision session | Foundation restructure |
```

This becomes the intent lens the system uses to decide what matters. When vision shifts, update this file and add a changelog row.

### 3. docs/life-playbook.md — restructure around 8 domains (L3)
Current playbook covers 4 domains (weight/fitness, addiction, meals, finance) with travel as a 5th. Reorganize headings to match all 8 canonical domains. Existing protocols get mapped to their domain. Missing domains get explicit stubs (## Career Protocol - TBD). Keep operating priorities and daily structure sections.

### 4. docs/app-intent.md — add distillation rules section (L3/L4)
Add a section defining: what counts as a pattern, what threshold to surface, max items on Hub (3), what "high-leverage" means (ranked by playbook priority weights). This is the first L4 spec.

### 5. docs/data-schemas.md — document new schemas (L2)
Add insights.csv schema. Document the domain field standardization across CSVs. Note that old rows keep legacy values, new entries use canonical taxonomy.

### 6. insights.csv — NEW file (L2)
Schema: id,domain,insight,evidence_count,first_seen,last_seen,status,source
- domain: one of the 8 canonical domains
- status: active | dormant | resolved
- source: reflection | mind_loop | signal | manual
This is the distillation layer between raw capture and surfaces.

### 7. todos.csv — add optional domain column (L2)
Add domain as last column. Optional — empty is fine. Existing rows don't need backfill.

### 8. plan.csv — add optional domain column (L2)
Add domain as last column. Optional — empty is fine. Existing rows don't need backfill.

### 9. daily_signals.csv + reflections.csv — taxonomy adoption (L2)
Going forward, category (signals) and domain (reflections) fields use canonical taxonomy. No backfill of existing rows needed.

## Execution Contract

This spec follows the Execution Contract Template defined in `docs/app-intent.md`. All sections below are mandatory for autonomous execution.

### Invariants (must NOT change)

- **Addiction recovery protocol wording in life-playbook.md is sacred** — restructure around it, do not reword the interruption sequence or zero-negotiation boundaries
- **Operating priorities order** (sleep > eating > training > addiction > deep work) must be preserved exactly in life-playbook.md
- **Daily structure section** in life-playbook.md — keep as-is, only move if restructuring requires it
- **Existing CSV data rows** — no modifications, no backfill, no reordering
- **No files outside the 9 listed in this spec** may be created or modified
- **No app code** — no changes to anything under `app/app/`, `app/lib/`, `app/api/`, or any `.tsx`/`.ts` file
- **Resources section** in life-playbook.md (books, essays) — preserve exactly

### Per-File Checkpoints

After completing each file, answer these before moving to the next. If any answer is "no," stop and explain what went wrong.

1. Does this file use only the 8 canonical domain IDs? (health, addiction, mental, career, relationships, finances, fun, personal_growth)
2. Did I preserve all existing content that wasn't explicitly marked for removal or restructuring?
3. Does my diff contain ONLY changes this spec asked for? (no cleanup, no improvements, no reformatting of untouched sections)
4. Can I trace every change to a specific numbered plan item (1-9)?
5. If this is a doc file: did I read it before editing, and does the new version contain all information the old version had?

### Diff Contract

Before writing each file, output this block:

```
DIFF CONTRACT — [filename]
WHAT: [1-line description]
WHY: Plan item #[N] — [item title]
PRESERVES: [what existing content stays]
REMOVES: [what is deleted, or "nothing"]
RISK: [what could go wrong]
```

### Abort Conditions

Stop and ask the user if any of these occur:

- A file's current content doesn't match what you expected (e.g., someone already edited it)
- The spec says to restructure content but you're unsure whether restructuring changes its meaning
- You need to modify a file not listed in the 9-file plan
- Two plan items seem to conflict
- Distilling vision-session.md data is ambiguous (unclear what maps to which domain or horizon)
- A checkpoint answer is "no"
- You're tempted to "improve" something the spec didn't ask for

## Constraints

- DO NOT modify app code (no page.tsx, no lib/, no api/ changes)
- DO NOT backfill existing CSV rows — new taxonomy applies going forward only
- DO NOT create files beyond what's listed above
- Extend existing files over creating new ones where possible
- Keep docs concise — bullets over prose
- Each file change should be independently reviewable
- Read every file before modifying it

## Acceptance Criteria

1. CLAUDE.md contains the canonical 8-domain taxonomy that all other files reference
2. vision.md exists with distilled per-domain goals at 3 horizons (now/90-day/2-year), sourced from vision-session.md
3. life-playbook.md has a section for each of the 8 domains (protocols or stubs)
4. app-intent.md has a distillation rules section with concrete thresholds
5. data-schemas.md documents insights.csv and the domain standardization
6. insights.csv exists with correct headers and no data rows yet
7. todos.csv and plan.csv have domain as a new optional column
8. No app code was modified
9. All docs reference the same 8 domain IDs consistently
10. Every file change was preceded by a diff contract output
11. Every file change was followed by checkpoint answers (all "yes")

## Flow After Completion

```
vision.md (where am I going — goals per domain)
    |
    v
life-playbook.md (rules per domain — how to get there)
    |
    v
CSVs capture daily evidence --> insights.csv distills patterns
    tagged by domain              tagged by domain
                                      |
                                      v
                                 Hub shows top insights
                                 that matter today
```
