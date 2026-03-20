#!/usr/bin/env bash
set -euo pipefail

readonly session_name="xiaohongshu-readonly"

allowed_commands=(
  open
  snapshot
  get
  wait
  scroll
  click
  back
  forward
  reload
  screenshot
  pdf
  tab
  close
  session
)

command_name=""
for arg in "$@"; do
  if [[ "$arg" == --* ]]; then
    continue
  fi
  command_name="$arg"
  break
done

if [[ -z "$command_name" ]]; then
  printf 'usage: %s <agent-browser command> [args...]\n' "$0" >&2
  exit 2
fi

is_allowed=1
for allowed in "${allowed_commands[@]}"; do
  if [[ "$command_name" == "$allowed" ]]; then
    is_allowed=0
    break
  fi
done

if [[ $is_allowed -ne 0 ]]; then
  printf 'forbidden command for xiaohongshu read-only mode: %s\n' "$command_name" >&2
  exit 2
fi

exec agent-browser \
  --session "$session_name" \
  --session-name "$session_name" \
  --allowed-domains "xiaohongshu.com,*.xiaohongshu.com" \
  --content-boundaries \
  --max-output 50000 \
  --confirm-actions "eval,download" \
  "$@"
