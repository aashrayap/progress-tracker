#!/bin/bash
# briefing-pipeline.sh — generates data/briefing.json via claude --print
# Runs via launchd every 60s, stat-based CSV change detection

set -euo pipefail

unset CLAUDECODE 2>/dev/null || true

CLAUDE_BIN="$HOME/.local/bin/claude"
PROJECT_DIR="$HOME/Documents/2026/tracker"
LOCK_FILE="/tmp/briefing-pipeline.lock"
WRITER_LOCK_DIR="/tmp/tracker-csv-writer.lock.d"
LOG_FILE="$HOME/.local/log/briefing-pipeline.log"
BRIEFING_PATH="$PROJECT_DIR/data/briefing.json"
BRIEFING_TMP="$PROJECT_DIR/data/.briefing.json.tmp-$$"
HASH_FILE="/tmp/briefing-pipeline-hash"
WRITER_LOCK_HELD=0

mkdir -p "$(dirname "$LOG_FILE")"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$LOG_FILE"
}

acquire_writer_lock() {
  if mkdir "$WRITER_LOCK_DIR" 2>/dev/null; then
    echo $$ > "$WRITER_LOCK_DIR/pid"
    WRITER_LOCK_HELD=1
    return 0
  fi

  local holder=""
  if [ -f "$WRITER_LOCK_DIR/pid" ]; then
    holder=$(cat "$WRITER_LOCK_DIR/pid" 2>/dev/null || true)
  fi

  if [ -n "$holder" ] && ! kill -0 "$holder" 2>/dev/null; then
    rm -rf "$WRITER_LOCK_DIR"
    if mkdir "$WRITER_LOCK_DIR" 2>/dev/null; then
      echo $$ > "$WRITER_LOCK_DIR/pid"
      WRITER_LOCK_HELD=1
      return 0
    fi
  fi

  return 1
}

release_writer_lock() {
  if [ "$WRITER_LOCK_HELD" = "1" ]; then
    rm -f "$WRITER_LOCK_DIR/pid"
    rmdir "$WRITER_LOCK_DIR" 2>/dev/null || rm -rf "$WRITER_LOCK_DIR"
    WRITER_LOCK_HELD=0
  fi
}

cleanup() {
  release_writer_lock
  rm -f "$LOCK_FILE"
  rm -f "$BRIEFING_TMP"
}

# Prevent concurrent runs
if [ -f "$LOCK_FILE" ]; then
  pid=$(cat "$LOCK_FILE" 2>/dev/null)
  if kill -0 "$pid" 2>/dev/null; then
    exit 0
  fi
  rm -f "$LOCK_FILE"
fi
echo $$ > "$LOCK_FILE"
trap cleanup EXIT

# Compute input hash from CSV mtimes
compute_hash() {
  local csv_files=(
    "$PROJECT_DIR/data/daily_signals.csv"
    "$PROJECT_DIR/data/reflections.csv"
    "$PROJECT_DIR/data/plan.csv"
    "$PROJECT_DIR/data/todos.csv"
    "$PROJECT_DIR/data/quotes.csv"
    "$PROJECT_DIR/data/briefing_feedback.csv"
  )
  local hash_input=""
  for f in "${csv_files[@]}"; do
    if [ -f "$f" ]; then
      hash_input+="$(stat -f '%m' "$f" 2>/dev/null || echo 0)"
    fi
  done
  # Add hour bucket during waking hours (7am-10pm) to trigger hourly regeneration
  local current_hour
  current_hour=$(date '+%H')
  if [ "$current_hour" -ge 7 ] && [ "$current_hour" -le 22 ]; then
    hash_input+="h${current_hour}"
  fi
  echo -n "$hash_input" | md5 -q 2>/dev/null || echo -n "$hash_input" | md5sum | cut -d' ' -f1
}

INPUT_HASH=$(compute_hash)

# Skip if CSVs haven't changed
if [ -f "$HASH_FILE" ]; then
  PREV_HASH=$(cat "$HASH_FILE" 2>/dev/null || true)
  if [ "$INPUT_HASH" = "$PREV_HASH" ] && [ -f "$BRIEFING_PATH" ]; then
    exit 0
  fi
fi

if ! acquire_writer_lock; then
  log "Writer lock busy, deferring"
  exit 0
fi

log "Generating briefing (hash: ${INPUT_HASH:0:8}...)"

# Build context payload
CONTEXT=""

# Last 14 days of daily signals
CONTEXT+="## daily_signals.csv (last 14 days)
"
if [ -f "$PROJECT_DIR/data/daily_signals.csv" ]; then
  head -1 "$PROJECT_DIR/data/daily_signals.csv" >> /dev/null
  FOURTEEN_DAYS_AGO=$(date -v-14d '+%Y-%m-%d')
  CONTEXT+="$(head -1 "$PROJECT_DIR/data/daily_signals.csv")
$(awk -F',' -v cutoff="$FOURTEEN_DAYS_AGO" '$1 >= cutoff' "$PROJECT_DIR/data/daily_signals.csv" | tail -n +1)
"
fi

# Last 7 reflections
CONTEXT+="
## reflections.csv (last 7)
"
if [ -f "$PROJECT_DIR/data/reflections.csv" ]; then
  CONTEXT+="$(head -1 "$PROJECT_DIR/data/reflections.csv")
$(tail -n +2 "$PROJECT_DIR/data/reflections.csv" | tail -7)
"
fi

# Full plan.csv
CONTEXT+="
## plan.csv
"
if [ -f "$PROJECT_DIR/data/plan.csv" ]; then
  CONTEXT+="$(cat "$PROJECT_DIR/data/plan.csv")
"
fi

# Full todos.csv
CONTEXT+="
## todos.csv
"
if [ -f "$PROJECT_DIR/data/todos.csv" ]; then
  CONTEXT+="$(cat "$PROJECT_DIR/data/todos.csv")
"
fi

# Full quotes.csv
CONTEXT+="
## quotes.csv
"
if [ -f "$PROJECT_DIR/data/quotes.csv" ]; then
  CONTEXT+="$(cat "$PROJECT_DIR/data/quotes.csv")
"
fi

# Recent feedback
CONTEXT+="
## briefing_feedback.csv (recent)
"
if [ -f "$PROJECT_DIR/data/briefing_feedback.csv" ]; then
  CONTEXT+="$(head -1 "$PROJECT_DIR/data/briefing_feedback.csv")
$(tail -n +2 "$PROJECT_DIR/data/briefing_feedback.csv" | tail -10)
"
fi

CONTEXT+="
## Input hash
$INPUT_HASH

## Today
$(date '+%Y-%m-%d')
"

# Read the system prompt
SYSTEM_PROMPT=$(cat "$PROJECT_DIR/.claude/prompts/briefing-pipeline.md")

# Generate briefing
"$CLAUDE_BIN" --print \
  --append-system-prompt "$SYSTEM_PROMPT" \
  "Generate today's briefing JSON from this data:

$CONTEXT" \
  > "$BRIEFING_TMP" 2>> "$LOG_FILE" || {
    log "ERROR: claude --print failed"
    rm -f "$BRIEFING_TMP"
    release_writer_lock
    exit 1
  }

# Validate: must be valid JSON with required fields
if ! python3 -c "
import json, sys
with open('$BRIEFING_TMP') as f:
    d = json.load(f)
required = ['state', 'insight', 'priorities', 'quote', 'generated_at', 'verified']
for k in required:
    assert k in d, f'Missing field: {k}'
valid_states = ['momentum', 'recovery', 'neutral', 'danger', 'explore', 'disruption']
assert d['state'] in valid_states, f'Invalid state: {d[\"state\"]}'
assert isinstance(d['priorities'], list), 'priorities must be a list'
assert isinstance(d['quote'], dict), 'quote must be an object'
assert d['verified'] == True, 'Briefing not self-verified'
" 2>> "$LOG_FILE"; then
  log "ERROR: Validation failed, keeping old briefing.json"
  rm -f "$BRIEFING_TMP"
  release_writer_lock
  exit 1
fi

# Inject input_hash into the JSON (in case agent didn't use the right one)
python3 -c "
import json
with open('$BRIEFING_TMP') as f:
    d = json.load(f)
d['input_hash'] = '$INPUT_HASH'
with open('$BRIEFING_TMP', 'w') as f:
    json.dump(d, f, indent=2)
" 2>> "$LOG_FILE"

# Atomic swap
mv "$BRIEFING_TMP" "$BRIEFING_PATH"
echo "$INPUT_HASH" > "$HASH_FILE"

release_writer_lock
log "Briefing generated successfully (state: $(python3 -c "import json; print(json.load(open('$BRIEFING_PATH'))['state'])" 2>/dev/null || echo unknown))"
