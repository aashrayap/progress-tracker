# Features

## Active Surfaces
| Route | Surface | Role |
|---|---|---|
| `/` | Hub | Priority and next action |
| `/plan` | Plan | Time-block execution and completion |
| `/health` | Health | Workout/body metrics and progression |
| `/reflect` | Reflect | Reflection evidence and recurring lessons |
| `/ideas` | Alias | Redirect to Reflect |

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
