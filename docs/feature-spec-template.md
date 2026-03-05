# Feature Spec Template

System-agnostic specification template for AI-assisted development. Any AI system (Claude, Cursor, Copilot, Codex) or human developer should read this before starting feature work.

This template defines what must be specified before implementation, how to verify the result, and what to do when verification fails.

## When to Use This

- Any task that modifies UI or touches multiple files
- Any task where "done" is ambiguous without explicit criteria
- Skip for trivial single-file fixes where the change is self-evidently correct

## The Spec (define before implementation)

### 1. Problem Statement

What is being changed and why. Self-contained — a reader shouldn't need to ask clarifying questions.

```
PROBLEM:
- What: ___
- Why: ___
- User-facing effect: ___
```

### 2. Affected Files

Explicit scope boundary. Nothing outside this list should be modified.

```
SCOPE:
- Files to modify: [list]
- Files to create: [list or "none"]
- Files that must NOT change: [list or "all others"]
```

### 3. Visual Contract (UI tasks only)

What the page should look like after implementation. This is the reference screenshots are compared against.

```
VISUAL CONTRACT:
- Page/route: ___
- Viewport: ___ (default: 1280x800)

What the user SHOULD see:
- [element] at [location] with [state]
- [element] at [location] with [state]

What the user should NOT see:
- No console errors
- No layout overflow or broken styling
- No missing data or empty states (unless expected)
- No regressions on surrounding elements
```

Be specific. "Button looks good" is not a visual contract. "Blue primary button labeled 'Save' below the form, right-aligned, 40px height" is.

### 4. Success Criteria

Binary YES/NO checks. No "mostly" or "looks good." An observer can verify these without asking the implementer.

```
SUCCESS:
- [ ] Build passes (zero errors)
- [ ] Page loads without console errors
- [ ] [specific element] visible at [specific location]
- [ ] [specific interaction] produces [specific result]
- [ ] No files modified outside declared scope
- [ ] Health metrics preserved (see app-intent.md)
```

3-5 criteria. If you can't write them, the task isn't well-defined yet.

### 5. Failure Definitions

What constitutes failure, and the action each failure triggers. Without this, the implementer guesses whether something is "close enough."

| Failure Type | Detection Method | Action |
|---|---|---|
| Build/type error | `npm run build` output | Fix code, rebuild |
| Console error | Browser console check | Trace to source, fix |
| Visual mismatch | Screenshot vs visual contract | Fix CSS/JSX, re-screenshot |
| API failure | Network request check (non-200) | Fix route handler |
| Scope violation | `git diff --stat` | Revert unintended changes |
| Criterion not met | Success criteria check | Re-read spec, implement missing piece |
| Regression | Surrounding elements changed | Revert, find non-destructive approach |

### 6. Invariants (what must NOT change)

More protective than success criteria. Criteria catch "not done." Invariants catch "done wrong."

```
INVARIANTS:
- [specific content] must not be reworded, only restructured
- [specific ordering] must be preserved
- Existing data rows must not be modified
- No files outside [explicit list] may be created or modified
```

Check invariants at every step, not just at the end.

### 7. Per-File Checkpoints (multi-file tasks)

After completing each file, answer these yes/no questions before proceeding. If any answer is "no," stop and explain.

Default questions (extend per task):
- Does this file reference only the canonical vocabulary defined in the spec?
- Did I preserve all existing content that wasn't explicitly marked for removal?
- Does my diff contain ONLY changes the spec asked for?
- Can I trace every change to a specific spec item?

### 8. Diff Contract (multi-file tasks)

Before writing each file, state:
- **WHAT**: 1-line description of the change
- **WHY**: which spec item it maps to
- **PRESERVES**: what existing content is kept
- **REMOVES**: what is being deleted and why
- **RISK**: what could go wrong with this specific change

### 9. Abort Conditions

Explicit "stop and ask" rules. Without these, the implementer guesses through ambiguity and compounds errors.

Default conditions (extend per task):
- File content doesn't match expected state when first read
- Change requires modifying something outside the declared scope
- Two spec items conflict with each other
- A checkpoint question answer is "no"
- 3 consecutive fix cycles fail on the same issue
- A fix introduces a new failure (don't cascade)
- Screenshot shows something ambiguous that can't be evaluated against the visual contract

### 10. Verification Route

Which verification gates apply to this task.

| Gate | Applies | Method |
|---|---|---|
| Build | Yes/No | `npm run build`, type-check |
| Diff review | Yes/No | `git diff --stat`, scope check |
| Browser verification | Yes/No | Navigate to page, screenshot, console check |
| Spec adherence | Yes/No | Walk each success criterion |
| Confidence report | Always | Summary to user with evidence |

---

## Verification Protocol (run before reporting done)

### Gate 1: Build

```
npm run build
```

Zero errors. Fix before proceeding.

### Gate 2: Diff Review

```
git diff --stat
```

- Only expected files changed?
- No out-of-scope modifications?
- Invariants intact?

### Gate 3: Browser Verification (UI tasks)

1. Ensure dev server is running
2. Navigate to the affected page
3. Take a screenshot
4. Read browser console (filter for errors/warnings)
5. Read network requests (check for failed API calls)
6. Compare screenshot against visual contract:
   - Expected elements present?
   - Unexpected elements absent?
   - Layout correct at target viewport?
   - No visual regressions on surrounding content?

Tool-specific implementation:
- **Claude Code**: `mcp__claude-in-chrome__*` tools (navigate, computer/screenshot, read_console_messages, read_network_requests)
- **Cursor/Copilot**: Playwright MCP or browser preview
- **Manual**: Open page in browser, inspect visually, check DevTools console

### Gate 4: Spec Adherence

Walk each success criterion from section 4. For each one:
- **YES**: criterion met
- **NO**: enter fix loop
- **PARTIAL**: treat as NO

### Gate 5: Confidence Report

Return to user:
- What was done (1-2 sentences)
- What was verified (which gates passed)
- What wasn't verified (manual checks needed)
- Screenshot evidence (if UI task)
- Uncertainty flags (if any)

---

## Fix Loop

When any gate fails:

```
implement --> build --> screenshot --> evaluate
    ^                                    |
    |            PASS --> DONE           |
    |                                    |
    +--- fix <-- FAIL <-----------------+
          |
          +-- max 3 retries per failure type
          +-- each retry must change approach (not repeat same fix)
          +-- 3 fails on same issue --> stop, explain, ask user
          +-- fix introduces NEW failure --> stop, don't cascade
```

The loop is async — the implementer continues fixing without returning to the user until either all gates pass or an abort condition is hit.

---

## Quick-Start (copy-paste for new features)

```markdown
## Feature: [name]

### Problem
[what and why]

### Scope
- Modify: [files]
- Create: [files or "none"]

### Visual Contract
- Page: [route]
- See: [what should appear]
- Not see: [what should not appear]

### Success Criteria
- [ ] [criterion 1]
- [ ] [criterion 2]
- [ ] [criterion 3]

### Failure Actions
- Build error -> fix and rebuild
- Visual mismatch -> fix and re-screenshot
- [task-specific failure] -> [action]

### Invariants
- [what must not change]

### Abort If
- [when to stop and ask]

### Verification: [build | build + browser | browser only]
```
