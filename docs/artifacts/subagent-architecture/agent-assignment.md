# Agent Assignment: Subagent Architecture

## Wave 1 (parallel)

### Agent: codebase-skills
Questions: Q1, Q2, Q3, Q4, Q5, Q14, Q15
Tools: read/grep/glob on `.claude/skills/`
Focus: Inventory all skills, decompose their steps, classify each step as deterministic vs judgment

### Agent: codebase-scripts-lib
Questions: Q6, Q7, Q8, Q11
Tools: read/grep/glob on `scripts/`, `app/app/lib/`
Focus: Existing deterministic logic, reusable functions, repeated data transformations

### Agent: codebase-api
Questions: Q9, Q10, Q12
Tools: read/grep/glob on `app/app/api/`
Focus: API route computations, pre-aggregation, output format patterns

### Agent: docs
Questions: Q13
Tools: read core docs
Focus: Existing guidance on deterministic vs LLM boundaries

## Wave 2 — NONE (no cross-ref questions)

## Human Questions (Phase 3)
Q16, Q17 — these are design questions for the user, not researchable
