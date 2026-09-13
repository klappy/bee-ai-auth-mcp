#!/bin/sh
# Scoped runtime: compiled broker start → pending/connect-URL shape → clear.
# Never prints URLs, tokens, broker ids, or helper/CLI stdout.
# Usage: probe-broker-handshake.sh <image-ref>
# Exit 0 = required subtests passed
# Exit 1 = shape/defect
# Exit 2 = docker/image unavailable (named skip)
# Exit 3 = start initiation boundary (no approval attempted; stop)
set -eu

IMAGE="${1:-}"
SANITIZE="$(CDPATH= cd -- "$(dirname "$0")" && pwd)/sanitize-broker-probe.mjs"
if [ -z "$IMAGE" ]; then
  echo "Usage: probe-broker-handshake.sh <image-ref>"
  exit 1
fi
if [ ! -f "$SANITIZE" ]; then
  echo "Missing sanitizer."
  exit 1
fi

if docker info >/dev/null 2>&1; then
  DOCKER="docker"
elif sudo -n docker info >/dev/null 2>&1; then
  DOCKER="sudo -n docker"
else
  echo "Docker is not usable on this seat."
  exit 2
fi

if ! $DOCKER image inspect "$IMAGE" >/dev/null 2>&1; then
  echo "Image is not present."
  exit 2
fi

hex32() {
  openssl rand -hex 16
}

sanitize_file() {
  node "$SANITIZE" < "$1"
}

run_broker() {
  cmd="$1"
  id="$2"
  out="$3"
  set +e
  $DOCKER run --rm --user 65532:65532 --network "$4" \
    --entrypoint /opt/bee-broker/broker "$IMAGE" "$cmd" "$id" > "$out" 2>/dev/null
  ec=$?
  set -e
  echo "$ec"
}

TMPDIR_PROBE="$(mktemp -d)"
trap 'rm -rf "$TMPDIR_PROBE"' EXIT
START_OUT="$TMPDIR_PROBE/start.json"
MISS_OUT="$TMPDIR_PROBE/miss.json"
CLEAR_OUT="$TMPDIR_PROBE/clear.json"

START_ID="$(hex32)"
MISS_ID="$(hex32)"

echo "subtest=missing-resume"
MISS_EC="$(run_broker resume "$MISS_ID" "$MISS_OUT" none)"
MISS_S="$(sanitize_file "$MISS_OUT")"
echo "exit=${MISS_EC} ${MISS_S}"
case "$MISS_S" in
  *'"status":"expired"'*)
    case "$MISS_S" in
      *'"hasToken":true'*)
        echo "missing-resume returned a token."
        exit 1
        ;;
    esac
    ;;
  *)
    echo "missing-resume did not emit expired."
    exit 1
    ;;
esac

echo "subtest=start"
START_EC="$(run_broker start "$START_ID" "$START_OUT" bridge)"
START_S="$(sanitize_file "$START_OUT")"
echo "exit=${START_EC} ${START_S}"
case "$START_S" in
  *'"status":"pending"'*)
    if [ "$START_EC" != "0" ]; then
      echo "start pending but process failed."
      exit 1
    fi
    case "$START_S" in
      *'"connectUrlShape":true'*) ;;
      *)
        echo "start pending without a Bee connect-URL shape."
        exit 1
        ;;
    esac
    case "$START_S" in
      *'"hasToken":true'*)
        echo "start returned a token."
        exit 1
        ;;
    esac
    ;;
  *'"status":"error"'*|*'"status":"unparseable"'*)
    echo "start initiation boundary: compiled CLI did not produce a pending handshake under existing test authority."
    echo "No approval was attempted. No hosted-readiness claim."
    exit 3
    ;;
  *)
    echo "start emitted an unexpected sanitized status."
    exit 1
    ;;
esac

echo "subtest=clear"
CLEAR_EC="$(run_broker clear "$START_ID" "$CLEAR_OUT" none)"
CLEAR_S="$(sanitize_file "$CLEAR_OUT")"
echo "exit=${CLEAR_EC} ${CLEAR_S}"
case "$CLEAR_S" in
  *'"status":"cleared"'*) ;;
  *)
    echo "clear did not emit cleared."
    exit 1
    ;;
esac
if [ "$CLEAR_EC" != "0" ]; then
  echo "clear process failed."
  exit 1
fi

echo "handshake probe passed (sanitized only)."
exit 0
