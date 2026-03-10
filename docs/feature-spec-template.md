# Feature Spec Template

System-agnostic specification template for AI-assisted development. Any AI system (Claude, Cursor, Copilot, Codex) or human developer should read this before starting feature work.

This template defines what must be specified before implementation, how to verify the result, and what to do when verification fails.

**Terminology note:** The process of scoping a feature using this template is called a **feature interview**. This is distinct from `/checkin` (the daily/weekly/monthly life check-in skill). "Interview" = extracting requirements for a feature. "Check-in" = capturing daily signals, intentions, and reflections.

## Spec Status

Every spec file begins with a `Status` line before the title. Valid values:

| Status | Meaning |
|--------|---------|
| `draft` | Still being scoped or written |
| `in-progress` | Implementation underway |
| `shipped` | Delivered and verified |
| `archived` | Superseded or abandoned |

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

**Verification & fix loop**: See `docs/execution-playbook.md` Phase 4 for the full verification protocol (build, diff, browser, spec adherence gates) and fix loop.

---

## Quick-Start (copy-paste for new features)

```markdown
Status: draft

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
