# Feature Spec: Vision Page Redesign

## 1. Problem Statement

```
PROBLEM:
- What: The /vision page is a low-gravity surface with hardcoded data in the component (L3).
  It shows a static radar chart and task-like goals but surfaces none of the rich vision content
  (anti-goals, quotes, AI analysis, domain-specific questions). It violates the 4-layer architecture
  by keeping data in the Surface layer instead of Foundation.
- Why: The vision page should be a daily morning page — a reminder of direction and "why."
  Currently it's rarely visited because it offers no dynamic insight, no emotional resonance,
  and no connection to actual tracked data.
- User-facing effect: Opening /vision each morning shows an AI-analyzed view of how each life
  domain is tracking, with motivational quotes, domain-specific guiding questions, and priority
  focus areas for the week and month — all derived from real data.
```

## 2. Affected Files

```
SCOPE:
- Files to create:
  - app/app/api/vision/route.ts        (L2: API route — reads CSVs + core docs, returns analysis)
  - app/app/lib/vision.ts              (L2: vision analysis logic, domain questions, types)

- Files to modify:
  - app/app/vision/page.tsx            (L3: rebuild surface to consume API)
  - data/quotes.csv                    (L1: seed with "As a Man Thinketh" quotes mapped to domains)
  - docs/vision.md                     (L0: add last_scored date, monthly re-score protocol)

- Files that must NOT change:
  - All other CSV schemas (no column changes)
  - All other page routes
  - Navigation (BottomNav.tsx)
  - Voice/idea pipeline scripts
  - app/app/lib/config.ts (no new config values for runtime data)
```

## 3. Visual Contract

```
VISUAL CONTRACT:
- Page/route: /vision
- Viewport: 390x844 (mobile-first, iPhone 14 Pro) + 1280x800 (desktop)

DEFAULT VIEW (no domain selected):
- Radar chart at top (same octagonal shape, sat/align lines)
- Below chart: "Overview" card containing:
  - 1-2 sentence AI-generated overall status (e.g., "Health and addiction are your
    highest-leverage areas this week. Sleep consistency is driving momentum.")
  - "This Week" focus: 2-3 bullet priority actions across domains
  - "This Month" focus: 2-3 bullet priority actions across domains
- No "Core Question" banner at bottom (removed — replaced by per-domain questions)

DOMAIN SELECTED VIEW (tap a wedge):
- Radar chart remains visible with selected domain highlighted
- Below chart: domain detail card containing (in order):
  1. Domain header: colored dot + label + sat/align scores
  2. Quote block: a quote from quotes.csv mapped to this domain
     - Styled as blockquote with author attribution
  3. AI insight: 2-3 sentence analysis of this domain based on recent data
     - What's going well, what needs attention, patterns detected
  4. Domain core question: a guiding question specific to this domain
     - NOT the generic "trade escape for building" — domain-specific
  5. Focus actions: "This Week" and "This Month" columns
     - Derived from plan.csv, daily_signals, core docs, and vision.md goals

What the user should NOT see:
- No console errors
- No generic "Core Question" banner (replaced by per-domain)
- No hardcoded dimension data in the component
- No "All Goals Grid" (removed — replaced by overview + domain detail)
- No empty states without explanation
- No loading spinner longer than 2 seconds on localhost
```

## 4. Success Criteria

```
SUCCESS:
- [ ] Build passes (zero errors, zero type errors)
- [ ] /vision loads and renders radar chart with data from API (not hardcoded)
- [ ] Tapping a domain shows: quote, AI insight, domain question, focus actions
- [ ] Default view shows overall AI analysis + week/month priorities
- [ ] quotes.csv contains at least 8 quotes from "As a Man Thinketh" mapped to domains
- [ ] API route reads from data/*.csv and docs/vision.md (not hardcoded)
- [ ] docs/vision.md has last_scored date and monthly re-score note
- [ ] No files modified outside declared scope
```

## 5. Failure Definitions

| Failure Type | Detection Method | Action |
|---|---|---|
| Build/type error | `npm run build` output | Fix code, rebuild |
| Console error | Browser console check | Trace to source, fix |
| Visual mismatch | Screenshot vs visual contract | Fix CSS/JSX, re-screenshot |
| API failure | Network request check (non-200) | Fix route handler, check file paths |
| Hardcoded data in Surface | Code review of page.tsx | Move to lib/vision.ts or API response |
| Scope violation | `git diff --stat` | Revert unintended changes |
| Quote not showing | Browser check per domain | Verify quotes.csv has domain-mapped entries |
| Empty AI insight | Browser check | Verify API reads CSVs correctly, fallback text exists |

## 6. Invariants

```
INVARIANTS:
- Radar chart visual shape and interaction pattern (tap wedge to select) must be preserved
- 8-domain taxonomy IDs must match CLAUDE.md canonical list exactly:
  health, addiction, mental, career, relationships, finances, fun, personal_growth
- Existing CSV files must not have columns added/removed/renamed
- No new CSV files created (quotes.csv already exists with headers)
- Layer boundaries: page.tsx must NOT contain analysis logic, data reading, or domain definitions
- Navigation structure unchanged (flat, /vision remains top-level)
- vision.md existing content preserved (only additions: last_scored, re-score protocol)
```

## 7. Per-File Checkpoints

After completing each file, verify:

- Does this file reference only canonical domain IDs from CLAUDE.md?
- Does this file respect the layer boundary (L0/L1/L2/L3)?
- Does my diff contain ONLY changes the spec asked for?
- Can I trace every change to a specific spec item?
- If L2 (lib/api): does it only read downward (L0-L1)?
- If L3 (surface): does it only consume L2 output, never read CSVs directly?

## 8. Design Details

### 8a. Domain Core Questions

Each domain gets a guiding question that replaces the generic "core question." These live in `app/app/lib/vision.ts`:

| Domain | Core Question |
|--------|--------------|
| health | "Am I treating my body like it has to last 80 more years?" |
| addiction | "Am I choosing discomfort now to avoid suffering later?" |
| mental | "Is my mind working for me or against me today?" |
| career | "Am I building something that compounds, or just staying busy?" |
| relationships | "Am I showing up for the people who matter, or hiding?" |
| finances | "Does my spending reflect my actual priorities?" |
| fun | "Am I having fun that creates energy, or fun that drains it?" |
| personal_growth | "Am I learning things that change how I act, or just what I know?" |

### 8b. API Route Design (`/api/vision`)

**Request**: GET /api/vision

**Response shape**:
```typescript
{
  lastScored: string;              // date from vision.md
  overview: {
    status: string;                // 1-2 sentence overall analysis
    weekFocus: string[];           // 2-3 priority actions for the week
    monthFocus: string[];          // 2-3 priority actions for the month
  };
  domains: {
    [domainId: string]: {
      satisfaction: number;
      alignment: number;
      quote: { text: string; author: string; source: string } | null;
      insight: string;             // 2-3 sentence AI analysis for this domain
      weekFocus: string[];         // domain-specific week actions
      monthFocus: string[];        // domain-specific month actions
      coreQuestion: string;
    }
  }
}
```

**Data sources the API reads**:
- `docs/vision.md` — wheel scores, domain goals, last_scored date
- `data/daily_signals.csv` — recent signals for pattern detection
- `data/quotes.csv` — quotes mapped to domains
- `data/plan.csv` — upcoming planned items per domain
- `data/reflections.csv` — recent reflections per domain
- `data/workouts.csv` — recent workout data (for health domain)

**Analysis logic** (in `app/app/lib/vision.ts`):
- Parse vision.md for scores and goals
- Read last 14 days of daily_signals, group by domain
- Read last 7 days of plan.csv for upcoming focus
- Read last 14 days of reflections for domain patterns
- For health: read last 7 days of workouts
- Generate per-domain insight by combining:
  - Vision goal for current horizon vs. actual signal data
  - Reflection themes (wins, lessons, changes)
  - Streak/consistency patterns from signals
- Generate overview by identifying top 2-3 domains needing attention
- Derive week/month focus from plan.csv + vision.md goals + signal gaps

**Note on "AI analysis"**: The analysis is heuristic-based (pattern matching on CSV data), not LLM-generated at request time. The API reads data, applies rules from the distillation system (app-intent.md), and returns structured analysis. This keeps the page fast and avoids LLM API dependencies.

### 8c. Quotes Seeding

Seed `data/quotes.csv` with quotes from "As a Man Thinketh" by James Allen, mapped to domains via a `domain` column (adding this column since the CSV currently only has: id, text, author, source, added).

Updated schema: `id,text,author,source,domain,added`

Sample mappings:
- health: "The body is the servant of the mind..."
- addiction: "Self-control is strength. Right thought is mastery. Calmness is power."
- mental: "A man is literally what he thinks, his character being the complete sum of all his thoughts."
- career: "All that a man achieves and all that he fails to achieve is the direct result of his own thoughts."
- personal_growth: "Men are anxious to improve their circumstances, but are unwilling to improve themselves."
- relationships: "The soul attracts that which it secretly harbours; that which it loves, and also that which it fears."
- finances: "He who would accomplish little must sacrifice little; he who would achieve much must sacrifice much."
- fun: "Happiness is won by determination and the practice of what is good, not by pursuing pleasure."

### 8d. Monthly Re-Score Protocol

Add to `docs/vision.md`:

```markdown
## Re-Score Protocol

Last scored: 2026-03-05

Re-score the wheel monthly (minimum). Use `/reflect` or a dedicated interview session
to reassess satisfaction and alignment for each domain. Update the Wheel Scores table
above and append a changelog entry with what shifted and why.

Next scheduled: 2026-04-05
```

## 9. Abort Conditions

- File content doesn't match expected state when first read
- Change requires modifying something outside the declared scope
- Two spec items conflict with each other
- A checkpoint question answer is "no"
- 3 consecutive fix cycles fail on the same issue
- A fix introduces a new failure
- quotes.csv schema change breaks any existing consumer of quotes data
- API route takes longer than 2 seconds to respond on localhost

## 10. Verification Route

| Gate | Applies | Method |
|---|---|---|
| Build | Yes | `cd app && npm run build` |
| Diff review | Yes | `git diff --stat`, verify only scoped files changed |
| Browser verification | Yes | Full Chrome extension verification (see below) |
| Spec adherence | Yes | Walk each success criterion |
| Confidence report | Yes | Summary with evidence + screenshots |

### Browser Verification Protocol (Gate 3 — mandatory before reporting done)

Use `mcp__claude-in-chrome__*` tools to verify the UI end-to-end. Do NOT report done without completing this gate.

**Step 1: Setup**
- Ensure dev server is running (`cd app && npm run dev`)
- Call `mcp__claude-in-chrome__tabs_context_mcp` to get current browser state
- Navigate to `http://localhost:3000/vision` via `mcp__claude-in-chrome__navigate`

**Step 2: Default View Check**
- Take screenshot via `mcp__claude-in-chrome__computer` (action: screenshot)
- Verify against visual contract:
  - [ ] Radar chart renders with 8 domains
  - [ ] Overview card visible with AI status, week focus, month focus
  - [ ] No generic "Core Question" banner
  - [ ] No hardcoded "All Goals Grid"
- Read console via `mcp__claude-in-chrome__read_console_messages` — zero errors
- Read network via `mcp__claude-in-chrome__read_network_requests` — /api/vision returns 200

**Step 3: Domain Selection Check**
- Click a domain wedge (e.g., health) via `mcp__claude-in-chrome__computer` (action: click)
- Take screenshot
- Verify:
  - [ ] Quote block visible with "As a Man Thinketh" quote + author
  - [ ] AI insight text visible (2-3 sentences, not empty)
  - [ ] Domain-specific core question visible (not the generic one)
  - [ ] Week + month focus actions visible
- Repeat for at least 2 more domains to confirm all render correctly

**Step 4: Failure Loop**
- If any check fails: fix, rebuild, re-navigate, re-screenshot
- Max 3 retries per failure type
- If 3 retries fail on same issue: stop and report to user with screenshots

**Step 5: Evidence Collection**
- Save final screenshots showing: default view, 3 selected domains
- Include in confidence report to user
