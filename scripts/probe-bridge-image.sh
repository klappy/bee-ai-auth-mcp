#!/bin/sh
# Probe a built bee-bridge image. Fail-closed. Never logs tokens.
# Usage: probe-bridge-image.sh <image-ref>
# Exit 2 = docker/image unavailable (named skip, not a pass).
set -eu

IMAGE="${1:-}"
if [ -z "$IMAGE" ]; then
  echo "Usage: probe-bridge-image.sh <image-ref>"
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
  echo "Image '$IMAGE' is not present."
  exit 2
fi

USER_SPEC="$($DOCKER image inspect "$IMAGE" --format '{{.Config.User}}')"
if [ "$USER_SPEC" != "65532:65532" ]; then
  echo "Expected USER 65532:65532, got '${USER_SPEC}'."
  exit 1
fi

run() {
  entry="$1"
  shift
  $DOCKER run --rm --user 65532:65532 --entrypoint "$entry" "$IMAGE" "$@"
}

if run /bin/sh -c "echo toolbox" >/dev/null 2>&1; then
  echo "Image still has /bin/sh — generic toolbox residual."
  exit 1
fi
if run /usr/bin/apt-get --version >/dev/null 2>&1; then
  echo "Image still has apt-get."
  exit 1
fi
if run /usr/local/bin/bun --version >/dev/null 2>&1; then
  echo "Image still has bun in the final stage."
  exit 1
fi

BEE_VER="$(run /usr/local/bin/bee version 2>/dev/null || true)"
case "$BEE_VER" in
  *@beeai/cli*) ;;
  *)
    echo "bee version did not identify @beeai/cli: '${BEE_VER}'."
    exit 1
    ;;
esac

AID="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
BID="bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
PROXY_OUT="$(run /opt/bee-broker/broker proxy "$AID" 2>/dev/null || true)"
case "$PROXY_OUT" in
  *forbidden*) ;;
  *)
    echo "broker proxy was not forbidden: '${PROXY_OUT}'."
    exit 1
    ;;
esac

CLEAR_A="$(run /opt/bee-broker/broker clear "$AID" 2>/dev/null || true)"
CLEAR_B="$(run /opt/bee-broker/broker clear "$BID" 2>/dev/null || true)"
case "$CLEAR_A" in
  *cleared*) ;;
  *)
    echo "clear A failed as uid 65532: '${CLEAR_A}'."
    exit 1
    ;;
esac
case "$CLEAR_B" in
  *cleared*) ;;
  *)
    echo "clear B failed as uid 65532: '${CLEAR_B}'."
    exit 1
    ;;
esac

echo "Image probe passed for ${IMAGE}."
echo "User=${USER_SPEC}; bee=${BEE_VER}; proxy forbidden; clear A and B as 65532."
exit 0
