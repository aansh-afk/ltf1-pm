#!/usr/bin/env bash
# Block commits that introduce secret-looking files (.env*, *.pem, *.p8, *.key)
# at any path in the repo. Designed to run as a pre-commit hook:
#
#   ln -sf ../../scripts/check-no-secrets.sh .git/hooks/pre-commit
#
# Exit codes: 0 = ok, 1 = secret file in the index.
set -euo pipefail

staged=$(git diff --cached --name-only --diff-filter=ACMR)

# Patterns that should never be committed.
deny_patterns=(
  '(^|/)\.env($|\.[^/]*$)'
  '\.pem$'
  '\.p8$'
  '\.key$'
  '(^|/)id_(rsa|ed25519|ecdsa|dsa)$'
  'service-account.*\.json$'
)

bad=()
while IFS= read -r path; do
  [[ -z "$path" ]] && continue
  for pat in "${deny_patterns[@]}"; do
    if [[ "$path" =~ $pat ]]; then
      bad+=("$path")
      break
    fi
  done
done <<<"$staged"

if (( ${#bad[@]} )); then
  printf '\n[check-no-secrets] Blocked: secret-looking files staged:\n' >&2
  for p in "${bad[@]}"; do
    printf '  - %s\n' "$p" >&2
  done
  printf '\nMove the file outside the repo and rotate the key. See docs/security/local-secrets.md.\n' >&2
  exit 1
fi
