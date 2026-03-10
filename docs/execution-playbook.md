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

## Phase 1 & 2: Interview + Spec

Run `/feature-interview` to execute the interactive interview and generate a spec file. The skill handles:
- Auditing current state (reads relevant files, presents inventory)
- Structured interview (usage, value, ambiguity resolution)
- Decision locking (all TBDs resolved before spec)
- Spec generation in `docs/specs/` using `docs/feature-spec-template.md`

The output is a self-contained spec file that Phase 3 executes against.

### Chrome Verification Protocol (embed in spec for UI tasks)

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

### The "Must NOT Change" List

The single most important guardrail. Agents will "improve" things outside scope without an explicit blocklist. The `/feature-interview` skill ensures this list is included in every spec.

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
4. **Remove slop**: Run `/remove-slop` to strip AI-generated code patterns (unnecessary comments, defensive overkill, `as any` casts, style inconsistencies). Do this before Chrome verification so you're verifying clean code.
5. **Chrome verification yourself**: Navigate every affected route
   - Screenshot (or JS DOM inspect if screenshot tool is down)
   - Console errors
   - Visual contract comparison
6. **Regression routes**: Open unchanged pages, confirm nothing broke
7. **Build**: `npm run build` after any reverts

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

1. **Mark spec as shipped**: Change `Status: in-progress` to `Status: shipped` in the spec file
2. **Update decisions log** in `docs/app-intent.md`
3. **Update architecture doc** if routes/APIs changed
4. **Save methodology improvements** to this playbook
5. **Note agent failure patterns** for future spec guardrails

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
