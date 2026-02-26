# Personal OS Principles

## Core Problem Statement

The system captures life data well, but it does not yet reliably convert that data into better next decisions.

- Data entry is strong; behavioral guidance is inconsistent.
- The product is still organized as separate trackers, while the goal is a personal operating system that compounds judgment over years.

## North Star

Build a closed-loop life system:

Capture -> Interpret -> Decide -> Execute -> Reflect -> Adapt

If any step is weak or disconnected, compounding breaks.

## Product Principles

1. Decision-first, not dashboard-first
   - Prioritize next action quality over metric abundance.

2. One truth model per concept
   - Each domain concept (habit completion, session detail, trigger, reflection) has one canonical representation.

3. Reflection drives planning
   - Yesterday's lessons and changes should feed today's decisions by default.

4. Structure over prose drift
   - Free text is allowed, but core dimensions (domain, category, context) should be machine-readable.

5. Time-contextual interface
   - Morning, daytime, and evening views should serve different decisions.

6. Compounding memory
   - Repeated lessons and trigger patterns are promoted automatically and become harder to ignore.

7. Low-friction capture, high-quality synthesis
   - Logging remains simple; interpretation gets smarter.

8. Graceful under failure
   - Misses and relapses never break the loop; they become decision data.

## What Good Looks Like

Every input (manual or voice) should produce three outcomes:

1. Clean event written to storage
2. Meaningful state update
3. Time-appropriate next-decision prompt

At point of use, the app should answer:

- What matters now?
- What pattern is emerging?
- What one action best changes trajectory today?

## Current Failure Modes (to avoid)

- Meaning hidden in notes, reducing analyzability.
- Logic duplicated across APIs, causing drift and contradictions.
- Reflection present but not central to the daily control loop.
- UX segmented by page instead of unified by decision lifecycle.

## Definition of Done for New Features

Before shipping any feature, verify all checks below:

1. Loop integrity
   - Does it strengthen at least one step in Capture -> Interpret -> Decide -> Execute -> Reflect -> Adapt?

2. Schema clarity
   - Are new semantics structured (not only free text)?
   - Is there one canonical location for the concept?

3. Decision timing
   - Does the feature surface in the moment a user can act on it?

4. Cross-surface consistency
   - Do APIs and UI agree on data contracts and meaning?

5. Compounding value
   - Will repeated usage increase future decision quality?

6. Failure resilience
   - Does behavior remain useful on bad days (misses, relapses, low motivation)?

## PR Checklist (copy into future PRs)

- [ ] Improves decision quality, not only data visibility
- [ ] Uses canonical schema/domain model
- [ ] Preserves or improves voice capture simplicity
- [ ] Integrates reflections into next-day planning flow
- [ ] Avoids duplicated metric logic in multiple routes
- [ ] Includes at least one compounding feedback mechanism (pattern, trend, or reminder)
- [ ] Works in both good-day and bad-day scenarios
