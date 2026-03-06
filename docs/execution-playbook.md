# Execution Playbook: Large Feature E2E with AI Agents

Reusable methodology for specifying, executing, and verifying large features using Claude Code. Derived from the Hub Restructure (March 2026) which cut 7 tabs to 6, restructured Hub, added inline todos to Plan, and fixed Ideas pipeline — all in one session.

---

## When to Use This

- Task touches 3+ files
- Task has UI changes that need visual verification
- Task is complex enough that "done" is ambiguous without criteria
- You want to delegate execution to a subagent and only review results

Skip for: single-file fixes, copy changes, data-only additions.

---

## Phase 1: Interview Before Spec

Do NOT jump to implementation. Interview first to surface real requirements.

### Step 1: Audit Current State

Read every relevant file. Map what exists today:
- Every page/route and what it contains
- Every data source and how it flows
- Every API endpoint and what it serves
- Navigation structure

Present this as a structured inventory to the user.

### Step 2: Challenge Each Element

For each surface/feature, ask:
- What's your actual usage? (daily / occasional / rare / never)
- Does this trace back to a core goal?
- What would you miss if it disappeared?
- What's missing that should be here?

### Step 3: Go Deeper on Ambiguous Areas

Don't accept first answers at face value. For areas where the user says "I'm not sure" or "maybe":
- Present 2-3 concrete options with mockups (text-based is fine)
- Show trade-offs for each
- Let the user pick rather than guessing

### Step 4: Lock Decisions

Before writing any spec, confirm a decision table:

```
| Decision | Detail | Status |
|----------|--------|--------|
| [thing]  | [what] | Locked / TBD |
```

Every TBD must be resolved before Phase 2.

---

## Phase 2: Write the Spec

Use the feature-spec-template (`docs/feature-spec-template.md`) as the skeleton. The spec must be **self-contained** — an agent with no conversation history should be able to execute it.

### Required Sections

1. **Intent Alignment** — what to optimize for, trade-off rules, health metrics
2. **Problem Statement** — what, why, user-facing effect
3. **Scope** — explicit file lists:
   - Files to modify (exhaustive)
   - Files to create
   - **Files that must NOT change** (critical — agents WILL modify things outside scope without this)
4. **Visual Contract** — what the user should see and NOT see, per route, at specific viewport
5. **Success Criteria** — binary YES/NO checks (3-12 items)
6. **Failure Definitions** — table mapping failure type to detection method to action
7. **Invariants** — what must NOT change under any circumstance
8. **Per-File Checkpoints** — yes/no questions after each file edit
9. **Diff Contract** — WHAT/WHY/PRESERVES/REMOVES/RISK stated before each edit
10. **Abort Conditions** — when to stop and ask instead of guessing
11. **Implementation Order** — phases from lowest risk to highest risk
12. **Verification Route** — all gates with Chrome verification protocol

### Chrome Verification Protocol (mandatory for UI tasks)

Embed this in the spec:

```
Before reporting done:
1. Ensure dev server running
2. Get tab context (tabs_context_mcp)
3. For each affected route:
   a. Navigate (mcp__claude-in-chrome__navigate)
   b. Screenshot (mcp__claude-in-chrome__computer action=screenshot)
   c. Console check (mcp__claude-in-chrome__read_console_messages pattern="error|Error")
   d. Network check (mcp__claude-in-chrome__read_network_requests)
   e. Compare against visual contract
   f. If mismatch: fix loop, do NOT report
4. For regression routes: navigate + screenshot + confirm unchanged
5. For redirects: navigate + confirm destination
6. Resize to target viewport before Plan/responsive screenshots
```

**Fallback when screenshot tool disconnects** (known issue):
- Use `mcp__claude-in-chrome__javascript_tool` for DOM inspection
- Query section headers, element presence/absence, CSS classes
- Use `curl -sI` for redirect verification
- This provides equivalent functional evidence

### The "Must NOT Change" List

This is the single most important guardrail. Agents will "improve" things outside scope. Without an explicit blocklist, they will:
- Refactor files they read during investigation
- Add features to pages they were only supposed to inspect
- Change schemas they think could be "better"

Be exhaustive. List every file and data schema that should be untouched.

---

## Phase 3: Execute with Subagent

### Launch Protocol

```
Agent tool:
- subagent_type: general-purpose
- mode: acceptEdits
- prompt: Points to spec file as SOLE source of truth
         + project CLAUDE.md for conventions
         + explicit Node version and dev server port
         + "only report when all gates pass or abort condition hit"
```

### What to Include in the Agent Prompt

1. Path to the spec document
2. Path to project CLAUDE.md
3. Working directory and app directory
4. Node version (`nvm use X`)
5. Dev server port
6. Chrome verification requirement
7. "Read every file before editing"
8. "If you hit an abort condition, STOP and explain"

### What NOT to Include

- Don't repeat the entire spec in the prompt (point to the file)
- Don't give implementation hints (let the agent follow the spec)
- Don't say "be creative" or "improve things" (agents will over-scope)

---

## Phase 4: Verify the Agent's Work

The agent will report a confidence summary. Do NOT trust it blindly.

### Your Verification Checklist

1. **Diff review**: `git diff --stat` — are only expected files changed?
2. **Scope violations**: Did the agent touch "must NOT change" files? (This happened in Hub Restructure — agent modified Vision despite explicit blocklist. Caught during Chrome verification.)
3. **Revert violations**: `git checkout -- <file>` for any out-of-scope changes
4. **Chrome verification yourself**: Navigate every affected route
   - Screenshot (or JS DOM inspect if screenshot tool is down)
   - Console errors
   - Visual contract comparison
5. **Regression routes**: Open unchanged pages, confirm nothing broke
6. **Build**: `npm run build` after any reverts

### Common Agent Failures to Watch For

| Failure | How to Catch | Fix |
|---------|-------------|-----|
| Modified "must NOT change" files | `git diff --stat` | `git checkout -- <file>` |
| Added unrequested features | Read the diff | Revert or simplify |
| Changed data schemas without spec approval | Check CSV headers + types.ts | Evaluate: useful extension or scope creep? |
| Skipped Chrome verification | Agent reports "screenshot tool down" | Run verification yourself |
| Introduced console errors | Browser console check | Fix or have agent fix |

---

## Phase 5: Record and Learn

After successful execution:

1. **Update decisions log** in `docs/app-intent.md`
2. **Update architecture doc** if routes/APIs changed
3. **Save methodology improvements** to this playbook
4. **Note agent failure patterns** for future spec guardrails

---

## Quick Reference: Tool Chain

```
INTERVIEW
  Read (audit files) -> present inventory -> ask questions -> lock decisions

SPEC
  Write (spec file using feature-spec-template)

EXECUTE
  Agent (subagent_type=general-purpose, mode=acceptEdits, point to spec)

VERIFY
  Bash (git diff --stat, npm run build, curl redirects)
  mcp__claude-in-chrome__tabs_context_mcp (get tabs)
  mcp__claude-in-chrome__navigate (open each route)
  mcp__claude-in-chrome__computer action=screenshot (visual evidence)
  mcp__claude-in-chrome__javascript_tool (DOM inspection fallback)
  mcp__claude-in-chrome__read_console_messages (error check)
  mcp__claude-in-chrome__resize_window (responsive testing)

REVERT VIOLATIONS
  Bash (git checkout -- <file>)
  Bash (npm run build) to confirm still clean
```

---

## Template: Agent Launch Prompt

```
You are executing a feature spec. Your SOLE source of truth is the spec document.

1. Read the spec: `[path to spec]`
2. Read the project CLAUDE.md: `[path]`
3. Execute each phase in the spec's Implementation Order
4. Follow Per-File Checkpoints after every file edit
5. Follow the Diff Contract before every file edit
6. At the final phase, run ALL verification gates including Chrome browser verification
7. Only report back when all gates pass OR you hit an abort condition

Working directory: [path]
App directory: [path]
Node: `nvm use [version]`
Dev server: localhost:[port]

Chrome verification is a HARD REQUIREMENT. Use mcp__claude-in-chrome__* tools.
Do NOT modify any file in the "must NOT change" list.
Read every file before editing it.
If you hit an abort condition, STOP and explain.
```

---

## Lessons from Hub Restructure (March 2026)

1. **Interview saved scope creep**: User initially wanted to cut Vision, then reversed during interview. Without the interview, we'd have cut it and had to undo.

2. **"Must NOT change" list is essential**: Agent modified Vision page despite the spec saying not to. Caught during regression verification and reverted with `git checkout`.

3. **Screenshot tool is unreliable**: The `mcp__claude-in-chrome__computer` screenshot action intermittently disconnects. Always have the JS DOM inspection fallback ready. The other Chrome tools (navigate, javascript_tool, read_console_messages) are stable.

4. **Phase ordering matters**: Data additions first (zero risk), then API changes (no UI breakage), then nav changes, then complex UI work. If something breaks in Phase 4, Phases 1-3 are still clean.

5. **Agents over-scope by default**: Without explicit "must NOT change" constraints, agents will refactor, add features, and "improve" things beyond the spec. The more explicit the boundaries, the better the result.

6. **Verify yourself**: Agent self-reports are optimistic. Always run your own diff review and Chrome verification before accepting the result.
