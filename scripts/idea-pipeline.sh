#!/bin/bash
# idea-pipeline.sh — polls inbox.csv for ideas, investigates + implements via Claude Code
# Runs via launchd every 60 seconds

set -euo pipefail

unset CLAUDECODE 2>/dev/null || true

REPO="aashrayap/progress-tracker"
PROJECT_DIR="$HOME/Documents/tracker"
LOCK_FILE="/tmp/idea-pipeline.lock"
WRITER_LOCK_DIR="/tmp/tracker-csv-writer.lock.d"
WORKTREE_ROOT="$HOME/.local/state/tracker-idea-worktrees"
LOG_FILE="$HOME/.local/log/idea-pipeline.log"
NTFY_TOPIC="ash-9f2k7x3m"
WRITER_LOCK_HELD=0
WORKTREE_DIR=""
WORKTREE_BRANCH=""

mkdir -p "$(dirname "$LOG_FILE")"
mkdir -p "$WORKTREE_ROOT"

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
  if [ -n "$WORKTREE_DIR" ] && [ -d "$WORKTREE_DIR" ]; then
    git -C "$PROJECT_DIR" worktree remove --force "$WORKTREE_DIR" >/dev/null 2>&1 || true
  fi
  if [ -n "$WORKTREE_BRANCH" ] && git -C "$PROJECT_DIR" show-ref --verify --quiet "refs/heads/$WORKTREE_BRANCH"; then
    git -C "$PROJECT_DIR" branch -D "$WORKTREE_BRANCH" >/dev/null 2>&1 || true
  fi
  rm -f "$LOCK_FILE"
}

find_next_logged_idea() {
  node - "$PROJECT_DIR/inbox.csv" <<'NODE'
const fs = require("fs");
const file = process.argv[2];
if (!file || !fs.existsSync(file)) process.exit(0);

const content = fs.readFileSync(file, "utf8").trim();
if (!content) process.exit(0);

const lines = content.split(/\r?\n/).slice(1).filter(Boolean);

function parseCSVLine(line) {
  const out = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      const next = line[i + 1];
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      out.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  out.push(current.trim());
  return out;
}

for (const line of lines) {
  const row = parseCSVLine(line);
  if ((row[5] || "") === "idea" && (row[4] || "") === "logged") {
    process.stdout.write(JSON.stringify({ captureId: row[0] || "", rawText: row[3] || "" }));
    process.exit(0);
  }
}
NODE
}

read_idea_state() {
  local csv_path="$1"
  local capture_id="$2"
  node - "$csv_path" "$capture_id" <<'NODE'
const fs = require("fs");
const file = process.argv[2];
const captureId = process.argv[3];
if (!file || !captureId || !fs.existsSync(file)) process.exit(0);

const content = fs.readFileSync(file, "utf8").trim();
if (!content) process.exit(0);

const lines = content.split(/\r?\n/).slice(1).filter(Boolean);

function parseCSVLine(line) {
  const out = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      const next = line[i + 1];
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      out.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  out.push(current.trim());
  return out;
}

for (const line of lines) {
  const row = parseCSVLine(line);
  if ((row[0] || "") === captureId) {
    process.stdout.write(
      JSON.stringify({
        status: row[4] || "",
        normalizedText: row[6] || "",
        error: row[7] || "",
      })
    );
    process.exit(0);
  }
}
NODE
}

update_root_inbox_entry() {
  local capture_id="$1"
  local status="$2"
  local normalized_text="$3"
  local error_text="$4"
  node - "$PROJECT_DIR/inbox.csv" "$capture_id" "$status" "$normalized_text" "$error_text" <<'NODE'
const fs = require("fs");
const [file, captureId, status, normalizedText, errorText] = process.argv.slice(2);
if (!file || !captureId || !fs.existsSync(file)) process.exit(2);

const content = fs.readFileSync(file, "utf8");
const lines = content.split(/\r?\n/);
const header = lines[0] || "capture_id,captured_at,source,raw_text,status,suggested_destination,normalized_text,error";
const dataLines = lines.slice(1).filter(Boolean);

function parseCSVLine(line) {
  const out = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      const next = line[i + 1];
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      out.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  out.push(current.trim());
  return out;
}

function csvQuote(value) {
  if (!value) return "";
  const escaped = value.replace(/"/g, '""');
  return /[",\n]/.test(value) ? `"${escaped}"` : value;
}

const rows = dataLines.map(parseCSVLine);
let found = false;

for (const row of rows) {
  if ((row[0] || "") === captureId) {
    row[4] = status || row[4] || "";
    row[6] = normalizedText || "";
    row[7] = errorText || "";
    found = true;
    break;
  }
}

if (!found) process.exit(3);

const outLines = rows.map((row) =>
  [
    csvQuote(row[0] || ""),
    csvQuote(row[1] || ""),
    csvQuote(row[2] || ""),
    csvQuote(row[3] || ""),
    csvQuote(row[4] || ""),
    csvQuote(row[5] || ""),
    csvQuote(row[6] || ""),
    csvQuote(row[7] || ""),
  ].join(",")
);

const output = `${header}\n${outLines.join("\n")}${outLines.length ? "\n" : ""}`;
const tmpPath = `${file}.tmp.${process.pid}.${Date.now()}`;
fs.writeFileSync(tmpPath, output);
fs.renameSync(tmpPath, file);
NODE
}

# Prevent concurrent runs
if [ -f "$LOCK_FILE" ]; then
  pid=$(cat "$LOCK_FILE" 2>/dev/null)
  if kill -0 "$pid" 2>/dev/null; then
    log "Already running (pid $pid), skipping"
    exit 0
  fi
  rm -f "$LOCK_FILE"
fi
echo $$ > "$LOCK_FILE"
trap cleanup EXIT

cd "$PROJECT_DIR"
git pull --rebase --quiet 2>/dev/null || true

# Ensure this automation never consumes local in-progress edits
current_branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")
if [ "$current_branch" != "main" ]; then
  log "Expected main branch, found '$current_branch'; skipping"
  exit 0
fi

if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
  log "Working tree has tracked changes; skipping for safety"
  exit 0
fi

if [ ! -f "$PROJECT_DIR/inbox.csv" ]; then
  exit 0
fi

idea_json=$(find_next_logged_idea)
if [ -z "$idea_json" ]; then
  exit 0
fi

capture_id=$(echo "$idea_json" | jq -r '.captureId // empty')
raw_text=$(echo "$idea_json" | jq -r '.rawText // empty')
if [ -z "$capture_id" ]; then
  log "Idea parse returned empty capture_id; skipping"
  exit 0
fi

log "Found idea: $capture_id — $raw_text"

if ! acquire_writer_lock; then
  log "Shared writer lock busy, skipping"
  exit 0
fi

git -C "$PROJECT_DIR" fetch origin main --quiet 2>/dev/null || true
base_ref="main"
if git -C "$PROJECT_DIR" rev-parse --verify --quiet origin/main >/dev/null; then
  base_ref="origin/main"
fi

WORKTREE_BRANCH="idea-$capture_id"
WORKTREE_DIR="$WORKTREE_ROOT/$capture_id"

if [ -d "$WORKTREE_DIR" ]; then
  git -C "$PROJECT_DIR" worktree remove --force "$WORKTREE_DIR" >/dev/null 2>&1 || rm -rf "$WORKTREE_DIR"
fi
if git -C "$PROJECT_DIR" show-ref --verify --quiet "refs/heads/$WORKTREE_BRANCH"; then
  git -C "$PROJECT_DIR" branch -D "$WORKTREE_BRANCH" >/dev/null 2>&1 || true
fi

if ! git -C "$PROJECT_DIR" worktree add --quiet -b "$WORKTREE_BRANCH" "$WORKTREE_DIR" "$base_ref"; then
  log "Failed to create worktree for $capture_id"
  exit 1
fi

cp "$PROJECT_DIR/inbox.csv" "$WORKTREE_DIR/inbox.csv"
system_prompt=$(cat "$WORKTREE_DIR/.claude/prompts/idea-pipeline.md")

cd "$WORKTREE_DIR"
claude --print \
  --append-system-prompt "$system_prompt" \
  --permission-mode bypassPermissions \
  "Process this idea from the voice inbox.

Capture ID: $capture_id
Raw idea text: $raw_text
Repo: $REPO

Steps:
1. Read inbox.csv and update this entry's status to 'investigating'
2. Scan the codebase — read relevant files to understand current patterns
3. Assess against 3 layers (Data/Logic/Surface) and runtime loop stages
4. Update inbox.csv normalized_text with your investigation summary
5. If the idea is viable:
   a. Use the existing branch idea-$capture_id (already checked out)
   b. Implement the change following existing patterns
   c. Run: git add <specific changed code files only> && git commit -m 'feat: <description>'
   d. Run: git push -u origin idea-$capture_id
   e. Create PR with structured notes (runtime loop stage, layer impact, risk)
   f. Update inbox.csv: status=shipped, error=<PR URL>
6. If the idea is NOT viable:
   a. Update inbox.csv: status=failed, error=<reason>
7. Do NOT stage or commit CSV data files (especially inbox.csv)." \
  2>> "$LOG_FILE" || {
    log "ERROR processing idea $capture_id"
  }

idea_state_json=$(read_idea_state "$WORKTREE_DIR/inbox.csv" "$capture_id" || true)
status=$(echo "$idea_state_json" | jq -r '.status // empty')
normalized_text=$(echo "$idea_state_json" | jq -r '.normalizedText // ""')
error_text=$(echo "$idea_state_json" | jq -r '.error // ""')

if [ -z "$status" ]; then
  status="failed"
  error_text="pipeline did not return idea status"
fi

if ! update_root_inbox_entry "$capture_id" "$status" "$normalized_text" "$error_text"; then
  log "Failed to update root inbox for $capture_id"
fi

# Send push notification
cd "$PROJECT_DIR"

if [ "$status" = "shipped" ]; then
  pr_url="$error_text"
  curl -s \
    -H "Title: PR ready" \
    -H "Tags: bulb,white_check_mark" \
    -H "Priority: 3" \
    -H "Markdown: yes" \
    -H "Click: $pr_url" \
    -d "✓ Idea implemented and PR opened.
$raw_text" \
    "ntfy.sh/$NTFY_TOPIC" > /dev/null 2>&1 || log "ntfy push failed"
elif [ "$status" = "failed" ]; then
  log "Idea $capture_id was not viable"
fi

# Push inbox.csv updates (status changes happen on main)
cd "$PROJECT_DIR"
if git diff --quiet inbox.csv 2>/dev/null; then
  :
else
  git add inbox.csv && git commit -m "idea: update inbox status for $capture_id" && git push --quiet 2>/dev/null || log "Push failed"
fi

release_writer_lock
log "Done with idea $capture_id"
