#!/bin/sh
# Fail-closed proof that an isolated Worker is serving the commit under test.
# Usage: check-deployed-version.sh <expected-sha> <deployed-version-body>
# Empty, non-hex, or mismatched bodies exit 1. Never treat missing /version
# as a prefix match (bash `case "$sha" in ""*)` is `*` and would pass).
set -eu

EXPECTED="${1:-}"
DEPLOYED="${2:-}"

if [ -z "$EXPECTED" ] || ! printf '%s' "$EXPECTED" | grep -Eq '^[0-9a-fA-F]{7,40}$'; then
  echo "Expected SHA is missing or not a git SHA."
  exit 1
fi

if [ -z "$DEPLOYED" ]; then
  echo "Isolated Worker /version was empty or unreachable."
  exit 1
fi

if ! printf '%s' "$DEPLOYED" | grep -Eq '^[0-9a-fA-F]{7,40}$'; then
  echo "Isolated Worker /version is not a git SHA."
  exit 1
fi

case "$EXPECTED" in
  "$DEPLOYED"*)
    echo "Isolated Worker is serving the commit under test."
    exit 0
    ;;
esac
case "$DEPLOYED" in
  "$EXPECTED"*)
    echo "Isolated Worker is serving the commit under test."
    exit 0
    ;;
esac

echo "Isolated Worker is not serving the commit under test."
echo "Refuse smoke against a stale or other SHA."
exit 1
