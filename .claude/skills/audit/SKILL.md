---
name: audit
description: Codebase health scan. Finds dead files, stale docs, orphaned code, and doc drift. Read-only — identifies but never deletes.
---

# Audit

Read-only codebase health scan. Outputs findings to conversation + versioned report.

## Triggers

- `audit`, `audit codebase`, `codebase audit`
- `find dead code`, `cleanup scan`, `what's stale`

## Output

1. Concise summary in conversation
2. Versioned report written to `docs/audits/YYYY-MM-DD.md`

Reports must be concise (<80 lines). Capture findings only, not explanations.

## Scan Protocol

Scan each layer bottom-up. For each layer, check references bidirectionally (does the thing reference valid targets? is the thing referenced by anything?).

### L0: Core Docs

Files: `CLAUDE.md`, `docs/*.md`, `.claude/skills/*/SKILL.md`, `.claude/prompts/*.md`, memory `MEMORY.md`

Checks:
- Do file paths referenced in docs still exist?
- Do CSV names in `data-schemas.md` match actual `data/*.csv` files?
- Do routes listed in `features.md` match actual `app/app/*/page.tsx` files?
- Do skills listed in `CLAUDE.md` match actual skill directories?
- Are there shipped specs in `docs/specs/` that should be archived or deleted?
- Does `MEMORY.md` contain claims that contradict current code?

### L1: Core Data

Files: `data/*.csv`

Checks:
- Is every CSV referenced by at least one API route or lib function? (grep for the filename in `app/`)
- Do CSV headers match what `data-schemas.md` documents?
- Are there CSV files not listed in `CLAUDE.md` canonical data section?

### L2: Intelligence

Files: `app/app/lib/*.ts`, `app/app/api/*/route.ts`

Checks:
- Is every lib file imported by at least one consumer? (grep for the filename)
- Is every API route called by at least one page or skill? (grep for the route path)
- Are there exports from lib files that nothing imports?

### L3: Surfaces

Files: `app/app/*/page.tsx`, `app/app/components/*.tsx`

Checks:
- Is every component imported by at least one page?
- Are there pages not linked in navigation (BottomNav)?
- Are there redirect-only pages that could be removed?

## Report Format

```markdown
# Audit YYYY-MM-DD

## Summary
- X findings across Y layers
- HIGH: N | MEDIUM: N | LOW: N

## L0: Core Docs
| Finding | Confidence | Detail |
|---------|-----------|--------|

## L1: Core Data
| Finding | Confidence | Detail |
|---------|-----------|--------|

## L2: Intelligence
| Finding | Confidence | Detail |
|---------|-----------|--------|

## L3: Surfaces
| Finding | Confidence | Detail |
|---------|-----------|--------|

## Recommended Actions
- [numbered list, most impactful first]
```

## Confidence Levels

- **HIGH**: Zero references in code. Safe to remove.
- **MEDIUM**: Low references or flagged for removal in prior decisions. Verify before acting.
- **LOW**: Possible drift or minor inconsistency. Note for awareness.

## Rules

- Read-only. Never delete, edit, or create files (except the audit report).
- Use `Glob` and `Grep` tools, not shell commands, for file discovery.
- Cross-reference bidirectionally: check both "is this used?" and "does this reference valid things?"
- Skip files that are obviously active (e.g., page.tsx files linked in nav with live API calls).
- Compare against previous audits in `docs/audits/` to note recurring findings or resolved items.
- Keep the report under 80 lines. If more findings exist, prioritize HIGH confidence.
