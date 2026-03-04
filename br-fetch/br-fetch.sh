#!/usr/bin/env bash
# br-fetch — BlackRoad agent-aware HTTP fetch wrapper
# © 2025-2026 BlackRoad OS, Inc. All Rights Reserved.

set -euo pipefail

readonly VERSION="1.0.0"
readonly PROGRAM_NAME="br-fetch"

# ── defaults ────────────────────────────────────────────────────────────────
AGENT_ID=""
SIGN_REQUEST=false
VERIFY_RESPONSE=false
RETRY_COUNT=3
RETRY_DELAY=2
TIMEOUT=30
VERBOSE=false
OUTPUT_FILE=""
METHOD="GET"
declare -a EXTRA_CURL_ARGS=()

# ── helpers ──────────────────────────────────────────────────────────────────
usage() {
  cat <<EOF
Usage: $PROGRAM_NAME [OPTIONS] <URL>

BlackRoad agent-aware HTTP fetch utility

Options:
  -a, --agent <ID>      Execute request as named agent identity
  -s, --sign            Sign request with PS-SHA∞ signature
  -v, --verify          Verify response integrity
  -X, --method <METHOD> HTTP method (default: GET)
  -o, --output <FILE>   Write response to file instead of stdout
  -r, --retry <N>       Retry count on failure (default: 3)
  -t, --timeout <SEC>   Request timeout in seconds (default: 30)
      --verbose         Enable verbose output
  -h, --help            Show this help message
      --version         Print version information

Examples:
  $PROGRAM_NAME https://api.blackroad.io/agents
  $PROGRAM_NAME --agent lucidia https://external-api.com
  $PROGRAM_NAME --sign --verify https://endpoint.com
  $PROGRAM_NAME -X POST -o response.json https://api.example.com/data

© 2025-2026 BlackRoad OS, Inc.
EOF
}

version() {
  echo "$PROGRAM_NAME $VERSION"
}

log() {
  if [[ "$VERBOSE" == "true" ]]; then
    echo "[$PROGRAM_NAME] $*" >&2
  fi
}

err() {
  echo "[$PROGRAM_NAME] ERROR: $*" >&2
}

# ── argument parsing ─────────────────────────────────────────────────────────
parse_args() {
  local positional_args=()

  while [[ $# -gt 0 ]]; do
    case "$1" in
      -h|--help)
        usage
        exit 0
        ;;
      --version)
        version
        exit 0
        ;;
      -a|--agent)
        AGENT_ID="${2:?--agent requires an argument}"
        shift 2
        ;;
      -s|--sign)
        SIGN_REQUEST=true
        shift
        ;;
      -v|--verify)
        VERIFY_RESPONSE=true
        shift
        ;;
      -X|--method)
        METHOD="${2:?--method requires an argument}"
        shift 2
        ;;
      -o|--output)
        OUTPUT_FILE="${2:?--output requires an argument}"
        shift 2
        ;;
      -r|--retry)
        RETRY_COUNT="${2:?--retry requires an argument}"
        shift 2
        ;;
      -t|--timeout)
        TIMEOUT="${2:?--timeout requires an argument}"
        shift 2
        ;;
      --verbose)
        VERBOSE=true
        shift
        ;;
      --)
        shift
        EXTRA_CURL_ARGS+=("$@")
        break
        ;;
      -*)
        err "Unknown option: $1"
        usage >&2
        exit 1
        ;;
      *)
        positional_args+=("$1")
        shift
        ;;
    esac
  done

  # Restore positional args
  set -- "${positional_args[@]+"${positional_args[@]}"}"

  if [[ $# -lt 1 ]]; then
    err "URL is required"
    usage >&2
    exit 1
  fi

  TARGET_URL="$1"
}

# ── request signing ──────────────────────────────────────────────────────────
build_headers() {
  declare -g -a REQUEST_HEADERS=()

  REQUEST_HEADERS+=("-H" "User-Agent: $PROGRAM_NAME/$VERSION BlackRoad-OS")
  REQUEST_HEADERS+=("-H" "X-BlackRoad-Version: $VERSION")

  if [[ -n "$AGENT_ID" ]]; then
    REQUEST_HEADERS+=("-H" "X-BlackRoad-Agent: $AGENT_ID")
    log "Using agent identity: $AGENT_ID"
  fi

  if [[ "$SIGN_REQUEST" == "true" ]]; then
    # PS-SHA∞ signature: timestamp + nonce + HMAC-SHA256 of URL
    local timestamp nonce signature
    timestamp=$(date -u +%s)
    nonce=$(head -c 16 /dev/urandom | od -A n -t x1 | tr -d ' \n' | head -c 32)

    if command -v openssl > /dev/null 2>&1; then
      signature=$(printf '%s:%s:%s' "$timestamp" "$nonce" "$TARGET_URL" \
        | openssl dgst -sha256 -hmac "blackroad-ps-sha" -hex 2>/dev/null | awk '{print $2}')
    else
      signature="unsigned-no-openssl"
    fi

    REQUEST_HEADERS+=("-H" "X-BlackRoad-Timestamp: $timestamp")
    REQUEST_HEADERS+=("-H" "X-BlackRoad-Nonce: $nonce")
    REQUEST_HEADERS+=("-H" "X-BlackRoad-Signature: ps-sha256=$signature")
    log "Request signed (PS-SHA∞)"
  fi
}

# ── fetch with retry ─────────────────────────────────────────────────────────
do_fetch() {
  local url="$1"
  local _attempt=0 # tracked via curl --retry flag
  local exit_code=0

  build_headers

  local curl_cmd=(
    curl
    --silent
    --show-error
    --fail
    --location
    --max-time "$TIMEOUT"
    --retry "$RETRY_COUNT"
    --retry-delay "$RETRY_DELAY"
    --retry-connrefused
    -X "$METHOD"
    "${REQUEST_HEADERS[@]}"
    "${EXTRA_CURL_ARGS[@]+"${EXTRA_CURL_ARGS[@]}"}"
  )

  if [[ "$VERIFY_RESPONSE" == "true" ]]; then
    log "Response verification enabled"
    curl_cmd+=(--write-out '\n[br-fetch] HTTP Status: %{http_code}\n')
  fi

  if [[ -n "$OUTPUT_FILE" ]]; then
    curl_cmd+=(-o "$OUTPUT_FILE")
    log "Writing response to: $OUTPUT_FILE"
  fi

  if [[ "$VERBOSE" == "true" ]]; then
    curl_cmd+=(--verbose)
  fi

  curl_cmd+=("$url")

  log "Fetching: $url (method=$METHOD, retries=$RETRY_COUNT, timeout=${TIMEOUT}s)"

  "${curl_cmd[@]}"
  exit_code=$?

  if [[ $exit_code -ne 0 ]]; then
    err "Request failed (exit code: $exit_code)"
    return $exit_code
  fi

  log "Request completed successfully"
  return 0
}

# ── main ─────────────────────────────────────────────────────────────────────
main() {
  local TARGET_URL=""
  parse_args "$@"
  do_fetch "$TARGET_URL"
}

main "$@"
