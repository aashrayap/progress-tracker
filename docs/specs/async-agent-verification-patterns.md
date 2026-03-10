# Async Agent Self-Verification Patterns

Patterns for background pipelines using `claude --print` (single-shot, non-interactive).

## Current Patterns (What Exists)

| Pipeline | Verification | Fallback |
|----------|-------------|----------|
| voice-inbox.sh | Post-hoc JSON schema validation (type/title/body/tags), enum check, body prefix check | Generic notification if validation fails |
| idea-pipeline.sh | Read-back: reads worktree CSV after claude --print to check status was updated | Sets status=failed if empty |

Shared: writer lock serialization, cleanup traps, extensive logging. No retry logic — launchd cycles ARE the retry loop.

## Recommended Patterns

### 1. Output Schema Validation (Shell-side)

Validate claude --print output before consuming it:

```bash
validate_briefing() {
  local json_file="$1"

  # Parse check
  jq empty "$json_file" 2>/dev/null || return 1

  # Required fields
  for field in state insight quote priorities generated_at; do
    jq -e ".$field" "$json_file" >/dev/null 2>&1 || return 1
  done

  # Enum check
  local state=$(jq -r '.state' "$json_file")
  case "$state" in
    recovery|momentum|neutral|danger|explore|disruption) ;;
    *) return 1 ;;
  esac

  return 0
}
```

### 2. Cross-Referencing (Agent-side)

Include in the prompt:

> After generating the briefing, verify:
> 1. Any streak count you mention matches what you computed from daily_signals.csv
> 2. Any quote you selected exists verbatim in quotes.csv
> 3. Any plan item you reference exists in plan.csv
> 4. Output a `verified: true|false` field in your JSON

Shell validates the flag:
```bash
verified=$(jq -r '.verified // false' "$output")
if [ "$verified" != "true" ]; then
  log "Agent self-verification failed"
  # Keep previous briefing.json intact
  exit 0
fi
```

### 3. Retry with Error Context

Agent retries internally (fast, in-memory). Shell retries via next launchd cycle (slow, 60s).

```bash
# If output fails validation, don't overwrite good briefing
if ! validate_briefing /tmp/briefing-candidate.json; then
  log "Validation failed, keeping previous briefing"
  exit 0  # Next cycle retries
fi

# Atomic swap only after validation passes
mv /tmp/briefing-candidate.json data/briefing.json
```

Key: write to temp file, validate, then atomic rename. Never write directly to data/briefing.json.

### 4. Idempotency

Same CSV state should produce functionally equivalent briefings. Enforce via:

- Hash CSV modification times before invoking claude --print
- Store hash in briefing.json (`input_hash` field)
- Skip generation if hash matches current briefing

```bash
current_hash=$(stat -f "%m" data/daily_signals.csv data/reflections.csv data/plan.csv data/todos.csv 2>/dev/null | md5)
existing_hash=$(jq -r '.input_hash // empty' data/briefing.json 2>/dev/null)

if [ "$current_hash" = "$existing_hash" ]; then
  exit 0  # No changes, skip
fi
```

### 5. Failure Classification

| Class | Recoverable | Shell Action |
|-------|-------------|--------------|
| `schema_error` | No | Log, keep previous briefing, alert |
| `transient_error` | Yes | Log, keep previous briefing, retry next cycle |
| `empty_output` | Yes | Log, keep previous briefing, retry next cycle |
| `stale_input` | N/A | Skip generation (CSVs unchanged) |

### 6. Multi-Step Self-Check (Agent Prompt Pattern)

Include in briefing prompt:

> Before outputting your final JSON, run this self-check:
> - [ ] state matches the signals you analyzed (not assumed)
> - [ ] insight references today's date and recent data
> - [ ] quote exists in the quotes.csv you were given
> - [ ] priorities are actionable (verbs, not observations)
> - [ ] no hallucinated data (streak counts, dates, weights)
>
> If any check fails, fix it before outputting. Set `verified: false` only if you cannot fix it.

### 7. Post-hoc Shell Validation (Template)

```bash
# Write to temp, validate, atomic swap
claude --print ... > /tmp/briefing-raw.txt 2>> "$LOG_FILE" || {
  log "claude --print failed"; exit 0
}

# Extract JSON (agent may output markdown-wrapped JSON)
jq '.' /tmp/briefing-raw.txt > /tmp/briefing-candidate.json 2>/dev/null || {
  # Try extracting from markdown code block
  sed -n '/^```json/,/^```/p' /tmp/briefing-raw.txt | sed '1d;$d' | \
    jq '.' > /tmp/briefing-candidate.json 2>/dev/null || {
      log "Could not parse JSON from output"; exit 0
    }
}

if validate_briefing /tmp/briefing-candidate.json; then
  # Add metadata
  jq --arg hash "$current_hash" --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    '. + {input_hash: $hash, generated_at: $ts}' \
    /tmp/briefing-candidate.json > data/briefing.json
  log "Briefing updated"
else
  log "Validation failed, keeping previous briefing"
fi
```

## Key Principles

1. **Schema in shell, logic in agent**: Shell validates JSON shape and enums. Agent validates semantic correctness.
2. **Never overwrite good with bad**: Write to temp, validate, atomic swap.
3. **Launchd IS your retry loop**: Don't add retry logic. Failed cycle = try again in 60s.
4. **Idempotency via input hashing**: Skip work when nothing changed.
5. **Agent reads back its own writes**: Catches filesystem errors at the source.

## Files Referenced

- `scripts/voice-inbox.sh` lines 138-170 (schema validation template)
- `scripts/idea-pipeline.sh` lines 364-376 (read-back verification)
- `.claude/prompts/voice-inbox.md` lines 99-232 (output schema definition)
