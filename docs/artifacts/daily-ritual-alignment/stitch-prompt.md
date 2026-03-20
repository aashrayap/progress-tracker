# Vision Page Redesign — Stitch UI Prompt

Design a web app page called "Vision" — the daily ritual surface for a personal life execution system. Dark theme, mobile-first (390px wide), also works at desktop (1280px).

## Design System

- Background: pure black (#000)
- Cards: zinc-900/60 with backdrop blur, border white/10, rounded-xl
- Text: zinc-100 (primary), zinc-300 (body), zinc-400 (secondary), zinc-500 (muted), zinc-600 (hint)
- Accents: emerald-500 (positive/done), red-500 (negative/miss), orange-500 (warning)
- Domain colors: Health=#10b981 (emerald), Wealth=#f59e0b (amber), Love=#ec4899 (pink), Self=#a855f7 (purple)
- Font: system sans-serif, small text sizes (xs, sm). Uppercase tracking-wide for labels.
- No borders heavier than white/10. Subtle, minimal, dark.

## Page Layout — Information Hierarchy

The page has TWO zones: a "Daily Read" zone (always visible, top of page) and a "Deep Review" zone (collapsed by default, for weekly/monthly use).

### ZONE 1: Daily Read (always visible)

This is what the user reads every morning in under 2 minutes. Compact, no fluff.

#### Section 1: Identity Script (always expanded)
A card with these fields stacked vertically:
- **Core Traits**: "The person behind all these domains: grounded, positive, present. The guy people feel better around — not performing, just being. Calm energy, real conversations, no front."
- **Non-Negotiables**: "Wim Hof every morning. Movement and gym. Meditation. Clean eating. Deep work. No substances. No video games. Quietness, reflection, and stillness."
- **Language Rules**: Two rows of small pill chips. Green pills for "use" words: "Locked in", "Non-negotiable", "Just do it", "Embrace discomfort", "Embrace pain". Red pills for "forbid" words: "Tired", "Maybe", "Try", "I think".

Each field has a tiny uppercase label (10px, zinc-500) above it. Text is sm size, zinc-300.

#### Section 2: Anti-Vision (always visible, compact)
A single line or short paragraph in a subtle card, slightly red-tinted border-left:
"Smokes weed. Skips gym for any emotion or timing excuse. Watches porn. Isolates. Reactive. Overweight. Hates himself."
Text is sm, zinc-400. Red-400/30 left border accent.

#### Section 3: Today's Intention + Briefing (side by side on desktop, stacked on mobile)
Left card (or top on mobile):
- "This week:" followed by the weekly mantra text
- "Today:" followed by the daily mantra text
- Small muted text, zinc-400 labels, zinc-200 values

Right card (or bottom on mobile):
- Briefing state badge: a small colored pill showing "momentum" (emerald), "recovery" (orange), "danger" (red), "neutral" (zinc), etc.
- One line of insight text (the AI-generated daily briefing)
- 3-4 priority bullets below it
- Small quote at bottom in italic zinc-500

#### Section 4: Morning Ritual Checklist (active, interactive)
A card showing the current ritual phase steps as a checklist. Title shows which phase based on time of day (morning before 12, midday 12-5, evening after 5).

Steps for morning:
1. Wake — no devices
2. Journal
3. Warm water
4. Wim Hof 2 rounds
5. Review identity script
6. Journal thoughts
7. Plan the day
8. Execute

Below steps, show habit stacks in italic zinc-500:
- "After waking → no devices, journal first"
- "After warm water → Wim Hof + identity script"

At bottom: a checkbox row "Morning review complete ✓" that logs the completion.

#### Section 5: Today's Plan Preview (compact)
A small card showing today's time blocks as a mini timeline or compact list:
- Each block shows: time range, item name, done status (checkmark or empty)
- Example: "7:00-7:30 Meditate ✓" / "9:00-10:30 Deep work" / "11:00-12:00 Gym - Day A"
- Max 8 items visible, scrollable if more
- Muted styling, this is a preview not the full planner

---

### ZONE 2: Deep Review (collapsed by default)

Each section below is a collapsible card. Header shows section name + a chevron. Collapsed by default. User expands during Sunday weekly review or monthly review.

#### Section 6: North Star — 4 Domain Cards (collapsed)
When expanded, shows 4 cards side by side (2x2 grid on desktop, stacked on mobile). Each card has:
- Colored left border matching domain color
- Domain name as title (Health, Wealth, Love, Self)
- **A — Actual**: current state description (zinc-400, xs text)
- **B — Becoming**: target state (zinc-300, xs text, slightly brighter)
- **T — Timeline**: deadline date (zinc-500)
- **H — Habits**: bullet list of 3-5 habits (zinc-400)

Example Health card:
- A: "Hit planned gym sessions, run protein-first meals, prioritize sleep quality..."
- B: "200 lbs with an athletic Olympic lifter build. Lean, strong, disciplined."
- T: "December 2026"
- H: "Train daily", "No substances", "Clean eating", "Sleep by 9:30", "Track via app"

#### Section 7: Habit Grid — 28 Days (collapsed)
When expanded, shows a heat map grid:
- Rows: Score, then individual habits (sleep, gym, weed, ate_clean, deep_work, meditate, lol, poker, clarity, vision_reviewed)
- Columns: last 28 days grouped by week
- Cells: 28x28px squares. Emerald=done, Red=missed, zinc-800=not logged
- Score row uses gradient: red (0-2), orange (3-4), lime (5-6), emerald (7-8)
- Row labels on left (4.5rem wide), date labels on top per week
- Today's column has a ring highlight

#### Section 8: Experiments (collapsed)
When expanded, shows active experiments as cards:
- Experiment name, hypothesis, day count / duration, domain badge
- Status: active (emerald dot) or expired (red dot)
- Past experiments shown below with verdict

#### Section 9: Input Control (collapsed)
When expanded, shows categorized lists:
- Mentors: "Daniel Abrada"
- Books: "As a Man Thinketh", "The Perfume of Silence"
- Nutrition Rules: bullet list
- (Podcasts, Playlists, Purge List shown if non-empty)

#### Section 10: Distractions (collapsed)
When expanded:
- Digital: "League of Legends", "Poker apps", "Instagram", "YouTube", "Porn"
- Mental: "Comparison spirals", "Relationship rumination", "Future fantasizing without action"
- Trigger Replacements: red trigger → green replacement arrows
  - "Boredom after work → Walk with Cooper or cook"
  - "Stress/overwhelm → Breathwork or cold shower"
  - "Urge to game → Read or meditate"

#### Section 11: Habit Audit (collapsed)
When expanded, three columns (or stacked on mobile):
- Productive (emerald text): Gym, Meditation, Deep work, Clean eating, Sleep routine, Journaling, Wim Hof
- Neutral (zinc text): Cooking, Walking Cooper, Reading
- Destructive (red text): Weed, League of Legends, Poker, Porn, Late-night scrolling, Skipping gym on emotion, Isolating

---

## Visual Separators

Between Zone 1 and Zone 2, show a thin separator with label:
"Weekly / Monthly Review" in zinc-600, centered, with horizontal rules on each side.

## Key Interactions
- Collapsible sections: tap header to expand/collapse, chevron rotates
- Ritual checklist checkbox: single tap to mark complete
- Habit grid cells: tap to open trend modal (not needed in mockup, just make cells tappable-looking)
- Plan items: tap to toggle done status

## What NOT to include
- No edit buttons or modals (this is a read-only ritual surface)
- No settings gear
- No onboarding or empty states (assume all data is populated)
- No bottom navigation bar (it exists but is a separate component, not part of this page)

## Mobile Priority
Design mobile-first at 390px width. The daily read zone (Sections 1-5) should fit in roughly 2-3 scroll heights. The user should be able to read identity + anti-vision + briefing + ritual steps without expanding anything.
