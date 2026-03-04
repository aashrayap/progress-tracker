# Features

## Active Surfaces
| Route | Surface | Role |
|---|---|---|
| `/` | Hub | Priority and next action |
| `/vision` | Vision | Identity and long-range orientation |
| `/plan` | Plan | Time-block execution and completion |
| `/health` | Health | Workout/body metrics and progression |
| `/mind` | Mind | Cognitive loop analysis and interventions |
| `/reflect` | Reflect | Reflection evidence and recurring lessons |
| `/ideas` | Ideas | Voice idea pipeline status |
| `/quotes` | Quotes | Reference quotes |
| `/resources` | Resources | Learning and reading pipeline |

## Navigation Rule
- Keep primary surfaces as top-level routes.
- Avoid secondary route trees for core product areas.
- Use in-page tabs, sidebars, or modals when a surface needs detail.

## What Is Working
- Single canonical data model based on CSV files
- End-to-end capture path from phone to structured logs
- Hub-driven daily decision payload
- Calendar/todo execution loop
- Reflection capture and lesson surfacing

## Current Gaps
1. Data integrity hardening (idempotency, file-locking strategy)
2. Stable plan row identity model
3. Better correction/edit UX for logged signals
4. Reduced duplication across documentation and assistant instructions

## Cleanup Direction
- Keep docs short and canonical
- Remove obsolete files and references quickly
- Keep behavior deterministic and auditable
