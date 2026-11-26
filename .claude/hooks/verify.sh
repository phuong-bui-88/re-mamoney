#!/usr/bin/env bash
# Stop hook: block "done" while the verification gate fails.
# Runs for Claude Code (.claude/settings.json) and Devin (imports .claude hooks).
# Gate: type-check + jest + lint. Allows exactly one retry via stop_hook_active.

input=$(cat)

# Already retried once because of this hook: allow stop to avoid a loop.
echo "$input" | grep -q '"stop_hook_active": *true' && exit 0

# Resolve repo root: prefer the agent-provided project dir, else derive from
# this script's location (.claude/hooks/ -> repo root).
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-${DEVIN_PROJECT_DIR:-}}"
if [ -n "$PROJECT_DIR" ]; then
  cd "$PROJECT_DIR" || exit 2
else
  cd "$(dirname "$0")/../.." || exit 2
fi

# Clean tree (docs-only questions, no changes): nothing to gate.
[ -z "$(git status --porcelain 2>/dev/null)" ] && exit 0

if ! out=$(npm run type-check && npm test -- --no-coverage && npm run lint 2>&1); then
  {
    echo "Verification gate failed. Fix it before finishing:"
    echo "$out" | tail -n 40
    echo ""
    echo "If this is unrelated pre-existing breakage, say so explicitly in your report."
  } >&2
  exit 2
fi

exit 0
