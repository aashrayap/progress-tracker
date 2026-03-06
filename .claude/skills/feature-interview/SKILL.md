---
name: feature-interview
description: Interactive feature interview that audits current state, surfaces requirements through structured questions, locks decisions, and outputs a self-contained spec file. Run before any non-trivial feature work.
---

# Feature Interview

Structured process for scoping a feature before implementation. Produces a spec file in `docs/specs/` that any agent or human can execute independently.

## Commands

- `/feature-interview` -- start a new feature interview
- `/feature-interview <topic>` -- start with a specific feature area in mind

## Process

### Phase 1: Audit Current State

Before asking questions, understand what exists:

1. Read `docs/app-intent.md` for product direction and health metrics
2. Read every file relevant to the feature area (routes, components, lib, API, data schemas)
3. Present a structured inventory to the user:

```
CURRENT STATE: [feature area]
Routes:      [list with what each contains]
Data:        [CSVs/schemas involved]
API:         [endpoints involved]
Components:  [key components]
```

4. Wait for the user to confirm or correct the inventory before proceeding.

### Phase 2: Interview

Challenge each element systematically. Do NOT accept first answers at face value.

**For each existing surface/feature in scope, ask:**
- What's your actual usage? (daily / occasional / rare / never)
- Does this trace back to a core goal in app-intent.md?
- What would you miss if it disappeared?
- What's missing that should be here?

**For ambiguous areas** (user says "I'm not sure" or "maybe"):
- Present 2-3 concrete options with text mockups
- Show trade-offs for each
- Let the user pick rather than guessing

**Go one level deeper** on anything the user feels strongly about:
- What specific behavior do you want?
- What's the minimal version that would be useful?
- What would make this annoying or wrong?

Ask questions in batches of 3-5 to keep the conversation moving. Do not front-load 20 questions.

### Phase 3: Lock Decisions

Before writing any spec, present a decision table:

```
| # | Decision | Detail | Status |
|---|----------|--------|--------|
| 1 | [thing]  | [what] | Locked |
| 2 | [thing]  | [what] | TBD    |
```

Every TBD must be resolved before proceeding to Phase 4. Ask the user to resolve each one.

### Phase 4: Write the Spec

Read `docs/feature-spec-template.md` for the spec skeleton. Generate a spec file at `docs/specs/<feature-name>.md` containing:

1. **Problem Statement** -- what, why, user-facing effect
2. **Scope** -- files to modify, create, and must-NOT-change list
3. **Visual Contract** (UI tasks) -- what user should see/not see per route
4. **Success Criteria** -- 3-12 binary YES/NO checks
5. **Failure Definitions** -- table: failure type -> detection -> action
6. **Invariants** -- what must NOT change under any circumstance
7. **Per-File Checkpoints** -- yes/no questions after each file edit
8. **Diff Contract** -- WHAT/WHY/PRESERVES/REMOVES/RISK before each edit
9. **Abort Conditions** -- when to stop and ask
10. **Implementation Order** -- phases from lowest risk to highest
11. **Verification Route** -- which gates apply (build, diff, browser, spec adherence)

The spec must be **self-contained** -- an agent with no conversation history should be able to execute it. Include the "must NOT change" list (agents will modify things outside scope without it).

### Phase 5: Hand Off

After the spec is written, present:

1. Summary of what was decided
2. Path to the spec file
3. Ready-to-use agent launch prompt from `docs/execution-playbook.md` (Phase 3)
4. Ask: "Ready to execute, or do you want to review the spec first?"

## Key Rules

- Never skip the audit. Read files before asking questions.
- Never write a spec with unresolved TBDs.
- The spec file is the deliverable, not the conversation.
- Reference `docs/feature-spec-template.md` for structure -- don't memorize it.
- Reference `docs/execution-playbook.md` for the execution handoff -- don't duplicate it.
- Check `docs/app-intent.md` to ensure the feature aligns with product direction.
