#!/bin/bash
# voice-inbox.sh — polls GitHub Issues for voice notes, processes with Claude Code
# Runs via launchd every 5 seconds

set -euo pipefail

# Allow running from within another Claude session (e.g. during testing)
unset CLAUDECODE 2>/dev/null || true

REPO="aashrayap/progress-tracker"
PROJECT_DIR="$HOME/Documents/tracker"
LOCK_FILE="/tmp/voice-inbox.lock"
LOG_FILE="$HOME/.local/log/voice-inbox.log"
NTFY_TOPIC="ash-9f2k7x3m"

mkdir -p "$(dirname "$LOG_FILE")"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$LOG_FILE"
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
trap 'rm -f "$LOCK_FILE"' EXIT

# Pull latest to avoid conflicts
cd "$PROJECT_DIR"
git pull --rebase --quiet 2>/dev/null || true

# Find open issues with "Voice" in title (filter locally — GitHub search index can lag)
all_issues=$(gh issue list --repo "$REPO" --state open --json number,title,body,createdAt 2>/dev/null)
issues=$(echo "$all_issues" | jq '[.[] | select(.title | test("^Voice"; "i"))]')

count=$(echo "$issues" | jq 'length')
if [ "$count" = "0" ] || [ -z "$count" ]; then
  exit 0
fi

log "Found $count voice issue(s)"

echo "$issues" | jq -c '.[]' | while read -r issue; do
  number=$(echo "$issue" | jq -r '.number')
  title=$(echo "$issue" | jq -r '.title')
  body=$(echo "$issue" | jq -r '.body')
  created=$(echo "$issue" | jq -r '.createdAt')
  date_str=$(echo "$created" | cut -d'T' -f1)

  log "Processing issue #$number: $title"

  # Read the prompt template
  system_prompt=$(cat "$PROJECT_DIR/.claude/prompts/voice-inbox.md")

  # Clean up previous notification
  rm -f /tmp/voice-inbox-ntfy.txt

  # Run Claude Code with the voice-inbox prompt
  claude --print \
    --append-system-prompt "$system_prompt" \
    --permission-mode bypassPermissions \
    "Process this voice note from $date_str. Issue #$number. Repo: $REPO

Voice note content:
$body

Steps:
1. Read daily_signals.csv, inbox.csv, ideas.csv, and reflections.csv to understand current format
2. Determine if this is a daily signal, workout, reflection, idea, or unresolved inbox item
3. Append to the appropriate CSV file(s)
4. Run: git add daily_signals.csv inbox.csv ideas.csv workouts.csv reflections.csv && git commit -m 'voice: process issue #$number'
5. Run: gh issue comment $number --repo $REPO --body '<your summary>'
6. Run: gh issue close $number --repo $REPO
7. Write push notification to /tmp/voice-inbox-ntfy.txt (see prompt for format rules)" \
    2>> "$LOG_FILE" || log "ERROR processing issue #$number"

  # Send push notification from temp file
  if [ -f /tmp/voice-inbox-ntfy.txt ]; then
    ntfy_msg=$(cat /tmp/voice-inbox-ntfy.txt)
    if [ -n "$ntfy_msg" ]; then
      curl -s -d "$ntfy_msg" "ntfy.sh/$NTFY_TOPIC" > /dev/null 2>&1 || log "ntfy push failed"
    fi
    rm -f /tmp/voice-inbox-ntfy.txt
  else
    log "No notification file generated for issue #$number"
  fi

  log "Done with issue #$number"
done

# Push any commits
cd "$PROJECT_DIR"
git push --quiet 2>/dev/null || log "Push failed (will retry next run)"
