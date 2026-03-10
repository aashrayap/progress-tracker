---
name: feature-interview
description: Interactive feature interview that audits current state, surfaces requirements through structured questions, locks decisions, writes a spec, and executes autonomously with fresh-context subagents. Run before any non-trivial feature work.
---

# Feature Interview

End-to-end process for scoping, specifying, executing, and shipping a feature. Uses separate context windows to prevent intent leakage. Produces artifacts in `docs/artifacts/<feature>/` and a spec file in `docs/specs/`. Executes with parallel subagents, verifies the result, and ships.

## Commands

- `/feature-interview` -- start a new feature interview
- `/feature-interview <topic>` -- start with a specific feature area in mind

## Context Window Architecture

Each phase runs in a separate context window with explicit inputs and outputs. The ticket is deliberately excluded from Phase 2 (Research) to keep findings objective.

```
Window 1          Window 2            Window 3              Window 4
┌──────────┐     ┌──────────────┐    ┌───────────────┐     ┌──────────┐
│ QUESTIONS│────▶│ RESEARCH     │───▶│ DESIGN        │────▶│ SPEC     │
│          │     │              │    │ DISCUSSION    │     │          │
│ ticket   │     │ questions    │    │ ticket +      │     │ design + │
│ in       │     │ ONLY         │    │ research +    │     │ research │
│          │     │ ❌ no ticket │    │ core docs     │     │          │
└──────────┘     └──────────────┘    └───────────────┘     └──────────┘
```

## Process

### Phase 1: Generate Research Questions (Window 1)

**Context in:** ticket/feature description
**Context out:** `docs/artifacts/<feature>/questions.md`
**Human role:** review, add, remove, approve questions

1. Read the ticket or feature description provided by the user.
2. Generate research questions — things you would need to learn about the codebase to implement this feature. Output ONLY questions, not answers or implementation ideas.
3. Always include this standard question: *"What do the core docs (architecture.md, data-schemas.md, app-intent.md) say about the areas relevant to this feature?"*
4. Write questions to `docs/artifacts/<feature>/questions.md`.
5. Present questions to the user for review. Wait for approval before proceeding.

**Output format:**

```markdown
# Research Questions: <feature name>

## Codebase Questions
1. [question about existing code/patterns]
2. [question about existing code/patterns]
...

## Core Docs Questions
N. What do the core docs (architecture.md, data-schemas.md, app-intent.md) say about the areas relevant to this feature?

## Open Questions
N+1. [anything ambiguous from the ticket itself]
```

### Phase 2: Research (Window 2 — can run unattended)

**Context in:** `docs/artifacts/<feature>/questions.md` ONLY
**Context out:** `docs/artifacts/<feature>/research.md`
**Human role:** optional review

**CRITICAL: Do NOT include the ticket or feature description in this context window. The subagent receives only the questions.**

1. Launch a subagent with fresh context. Pass it ONLY the questions file.
2. The subagent reads the codebase to answer each question.
3. Surface ALL patterns found — do not filter by relevance (the subagent does not know what feature is being built).
4. Note any open questions that could not be answered from the codebase.
5. Write findings to `docs/artifacts/<feature>/research.md`.

**Output format:**

```markdown
# Research: <questions file reference>

## Findings

### [Question 1 text]
[Objective findings with file paths and line numbers]

### [Question 2 text]
[Objective findings]

...

## Patterns Found
- Pattern A: [description] — used in [files] (N occurrences)
- Pattern B: [description] — used in [files] (N occurrences)
- Pattern C: [description] — used in [files] (N occurrences)

## Core Docs Summary
[What architecture.md, data-schemas.md, app-intent.md say about relevant areas]

## Open Questions
- [Things that could not be determined from the codebase]
```

### Phase 3: Design Discussion (Window 3 — human in the loop)

**Context in:** ticket + `docs/artifacts/<feature>/research.md` + `docs/app-intent.md`
**Context out:** `docs/artifacts/<feature>/design.md`
**Human role:** THIS IS WHERE YOU THINK — answer design questions, disambiguate patterns, lock decisions

1. Read the ticket, research doc, and `docs/app-intent.md`. Check that the feature aligns with product direction.

2. **Pattern disambiguation.** For each area where the research doc found multiple patterns:
   - Present all patterns found with file references
   - Ask the user which is current and should be followed
   - Lock the answer as a numbered decision

3. **Design questions.** Challenge each element systematically. Do NOT accept first answers at face value.

   **For each surface/feature in scope, ask:**
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

4. **Before locking decisions**, prompt: "Want to run `/consider:inversion` on this feature? It surfaces failure modes before locking decisions. (skip to proceed)"

5. **Lock decisions.** Present a decision table:

   ```
   | # | Decision | Detail | Status |
   |---|----------|--------|--------|
   | 1 | [thing]  | [what] | Locked |
   | 2 | [thing]  | [what] | TBD    |
   ```

   Every TBD must be resolved before proceeding. Ask the user to resolve each one.

6. **Before structure outline**, prompt: "Want to run `/consider:pareto` on the locked scope? It identifies which 20% of this drives 80% of value. (skip to proceed)"

7. **Agent self-verification question** (ask once, after core scope is clear):

   > "How should the agent verify its own output before presenting results to you? Some options:
   > - Build/lint gate only (minimum)
   > - Schema validation on generated data
   > - Cross-reference against source data
   > - Agent self-check checklist in prompt
   > - Chrome visual verification against spec
   > - Something else?
   >
   > This determines what goes into the spec's verification gates and the agent prompt."

   Lock the answer as a numbered decision. If the feature involves background/async agents, also ask about output validation strategy.

8. **Structure outline.** Design the implementation order using vertical phases (tracer bullets):
   - Wire the feature end-to-end first with minimal logic (endpoint → data → UI placeholder)
   - Then add logic in vertical passes through the stack
   - Each phase should be independently verifiable
   - Include testing strategy (unit, integration, manual test cases)

9. Write everything to `docs/artifacts/<feature>/design.md`.

**Output format:**

```markdown
# Design: <feature name>

## Summary
[1-3 sentence summary of what we're building and why]

## Pattern Decisions
| # | Area | Chosen Pattern | Rejected Alternatives |
|---|------|---------------|----------------------|
| 1 | ...  | ...           | ...                  |

## Design Decisions
| # | Decision | Detail | Status |
|---|----------|--------|--------|
| 1 | ...      | ...    | Locked |

## Verification Strategy
[Locked verification approach]

## Structure Outline
### Phase 1: [Tracer bullet — wire end to end]
- [task]
- [task]
- Verify: [what to check]

### Phase 2: [Add core logic]
- [task]
- [task]
- Verify: [what to check]

### Phase N: [Testing + polish]
- [task]
- Verify: [what to check]
```

### Phase 4: Write Spec + Confirm (Window 4)

**Context in:** `docs/artifacts/<feature>/design.md` + `docs/artifacts/<feature>/research.md`
**Context out:** `docs/specs/<feature>.md`
**Human role:** final review before execution

Read `docs/feature-spec-template.md` for the spec skeleton. Generate a spec file at `docs/specs/<feature>.md` with `Status: draft` as the first line, containing:

1. **Problem Statement** -- what, why, user-facing effect
2. **Scope** -- files to modify, create, and must-NOT-change list
3. **Visual Contract** (UI tasks) -- what user should see/not see per route
4. **Success Criteria** -- 3-12 binary YES/NO checks
5. **Failure Definitions** -- table: failure type -> detection -> action
6. **Invariants** -- what must NOT change under any circumstance
7. **Per-File Checkpoints** -- yes/no questions after each file edit
8. **Diff Contract** -- WHAT/WHY/PRESERVES/REMOVES/RISK before each edit
9. **Abort Conditions** -- when to stop and ask
10. **Implementation Order** -- phases from the structure outline, structured as atomic tasks with dependencies noted, using vertical/tracer bullet ordering

The spec must be **self-contained** -- an agent with no conversation history should be able to execute it. Include the "must NOT change" list (agents will modify things outside scope without it).

After writing the spec, present a confirmation summary:

```
SPEC SUMMARY: [feature name]
Path: docs/specs/[name].md

LOCKED DECISIONS:
├─ [decision 1]
├─ [decision 2]
└─ [decision N]

EXECUTION PLAN:
├─ Wave 1: [task A], [task B]  (parallel — independent)
├─ Wave 2: [task C]            (depends on A+B)
└─ Wave 3: [task D]            (depends on C)

AGENT VERIFICATION (each agent does this before reporting complete):
├─ Per-file checkpoints (yes/no after each edit)
├─ Diff contract (WHAT/WHY/PRESERVES/REMOVES/RISK)
├─ Build gate: npm run build
├─ Scope check: only files in task scope modified
└─ Chrome verification (UI tasks): navigate + screenshot + console check

POST-EXECUTION VERIFICATION:
├─ /remove-slop (strip AI patterns)
├─ /audit (codebase health scan)
├─ Diff review (scope violations, must-NOT-change)
├─ Success criteria walkthrough (binary YES/NO)
└─ Chrome verification by user (UI tasks)

Ready to execute?
```

Wait for user confirmation. On confirmation, proceed directly to Phase 5.

### Phase 5: Execute

Break the spec's Implementation Order into atomic tasks grouped by dependency into waves.

**Wave execution:**

1. For each wave, spawn subagent(s) in parallel — one per task
2. Each subagent gets fresh context and receives:
   - Path to the spec file (sole source of truth)
   - Its specific task scope (which section of Implementation Order)
   - Path to project CLAUDE.md for conventions
   - Working directory and app directory
   - Node version (`nvm use 22.14.0`) and dev server port
   - "Read every file before editing"
   - "Commit atomically when your task is complete"
   - "If you hit an abort condition, STOP and explain"
   - "Do NOT modify any file in the must NOT change list"
   - Per-file checkpoints and diff contract from the spec
   - Chrome verification requirement (UI tasks)
3. Each subagent commits its work with a conventional commit: `type(scope): description`
4. Wait for all subagents in the wave to complete before starting the next wave
5. If a subagent hits an abort condition, pause all execution and surface the issue

**Subagent launch template:**

```
You are executing one task from a feature spec. Your SOLE source of truth is the spec document.

1. Read the spec: [path to spec]
2. Read the project CLAUDE.md: [path]
3. Your task: [specific task description from Implementation Order]
4. Your file scope: [files this task touches]
5. Follow Per-File Checkpoints after every file edit
6. Follow the Diff Contract before every file edit
7. Run verification gates when your task is complete:
   - npm run build (must pass)
   - git diff --stat (only your scoped files modified)
   - Chrome verification if UI task (navigate + console check)
8. Commit your work: git add [scoped files] && git commit
9. Only report back when all gates pass OR you hit an abort condition

Working directory: [path]
App directory: [path]
Node: nvm use 22.14.0
Dev server: localhost:[port]

Do NOT modify any file in the "must NOT change" list.
Read every file before editing it.
If you hit an abort condition, STOP and explain.
```

Mark spec status as `in-progress` when execution begins.

### Phase 6: Verify

After all waves complete:

0. **Subtraction pass**: Prompt: "Want to run `/consider:via-negativa` on this diff? It identifies what to remove before shipping. (skip to proceed)"
1. **Remove slop**: Run `/remove-slop` to strip AI-generated code patterns from the diff
2. **Audit**: Run `/audit` for codebase health scan — flag dead files, orphaned code, doc drift
3. **Diff review**: `git diff --stat` against pre-execution state
   - Check for scope violations (files outside spec)
   - Check must-NOT-change list
   - Revert any violations: `git checkout -- <file>`
4. **Build gate**: `npm run build` — must pass with zero errors
5. **Chrome verification** (UI tasks):
   - Navigate every affected route
   - Screenshot or JS DOM inspect
   - Console error check
   - Network request check
   - Compare against visual contract
   - Check regression routes (unchanged pages still work)
6. **Success criteria walkthrough**: Walk each criterion from the spec, binary YES/NO
7. **Fix loop**: If any gate fails:
   - Generate fix tasks from failures
   - Spawn subagent(s) to execute fixes with fresh context
   - Re-verify after fixes
   - Abort after 3 consecutive fix cycles on the same issue — escalate to user

Present verification results:

```
VERIFICATION: [feature name]
├─ Slop removal: [clean / N patterns fixed]
├─ Audit: [clean / N issues found]
├─ Scope: [clean / N violations reverted]
├─ Build: [pass / fail]
├─ Chrome: [pass / N issues] (UI tasks)
├─ Criteria: [N/N passed]
└─ Status: [PASS → proceed to ship / FAIL → fix loop]
```

### Phase 7: Ship

After all verification gates pass:

1. **Doc-sync checklist** (check each, update if yes):
   - Did this feature introduce a new pattern? → update `docs/architecture.md`
   - Did this feature change data schemas? → update `docs/data-schemas.md`
   - Did this feature deprecate an old pattern? → mark deprecated in `docs/architecture.md`
   - Did this feature add or change a surface? → update `docs/features.md`
2. Mark spec `Status: shipped`
3. Update `docs/app-intent.md` decisions log with any new directional decisions
4. Update `docs/architecture.md` if routes or APIs changed
5. Run `/ship` (stage, commit, push)
6. Present final summary:

```
SHIPPED: [feature name]
├─ Spec: docs/specs/[name].md
├─ Artifacts: docs/artifacts/[name]/
├─ Commits: [N atomic commits]
├─ Files changed: [N]
├─ Docs updated: [list any updated core docs]
└─ All gates passed
```

## Key Rules

- Never skip the research phase. Objective codebase understanding before design decisions.
- Never include the ticket in the Phase 2 (Research) context window. This is the core decontamination principle.
- Never write a spec with unresolved TBDs.
- The spec file is the deliverable of Phases 1-4, not the conversation.
- Reference `docs/feature-spec-template.md` for structure -- don't memorize it.
- Reference `docs/execution-playbook.md` for Chrome verification details -- don't duplicate it.
- Check `docs/app-intent.md` to ensure the feature aligns with product direction.
- Each subagent gets fresh context -- this is the whole point. Never reuse a subagent across tasks.
- Audit is mandatory in Phase 6, not optional.
- 3 consecutive fix cycles on the same issue = abort and escalate to user.
- Research artifacts are unique per feature — do not reuse across features.
