#!/usr/bin/env bash
# br-fetch — BlackRoad OS HTTP client
# Based on curl (MIT/curl License)
# Copyright (c) 2026 BlackRoad OS, Inc. All Rights Reserved.
#
# Features:
#   - Auto-authentication with BlackRoad credentials
#   - PS-SHA∞ request signing
#   - Agent identity execution
#   - Built-in observability (structured logging)
#   - Intelligent retry logic with exponential back-off

set -euo pipefail

# ─── Constants ────────────────────────────────────────────────────────────────
readonly BR_FETCH_VERSION="0.1.0"
readonly BR_FETCH_NAME="br-fetch"
readonly DEFAULT_RETRIES=3
readonly DEFAULT_RETRY_DELAY=1   # seconds (doubles each attempt)
readonly DEFAULT_TIMEOUT=30      # seconds
readonly LOG_FILE="${BR_FETCH_LOG:-}"    # empty = stderr only

# ─── Colour helpers (disabled when not a TTY) ─────────────────────────────────
if [[ -t 2 ]]; then
  _BOLD=$'\033[1m'
  _RESET=$'\033[0m'
  _RED=$'\033[0;31m'
  _AMBER=$'\033[0;33m'
  _GREEN=$'\033[0;32m'
  _BLUE=$'\033[0;34m'
else
  _BOLD="" _RESET="" _RED="" _AMBER="" _GREEN="" _BLUE=""
fi

# ─── Logging ──────────────────────────────────────────────────────────────────
_log() {
  local level="$1"; shift
  local ts
  ts="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
  local line="${ts} [${level}] ${BR_FETCH_NAME}: $*"
  echo "${line}" >&2
  [[ -n "${LOG_FILE}" ]] && echo "${line}" >> "${LOG_FILE}"
}

log_info()  { _log "INFO " "$@"; }
log_warn()  { _log "WARN " "$@"; }
log_error() { _log "ERROR" "$@"; }
log_debug() { [[ "${BR_FETCH_DEBUG:-0}" == "1" ]] && _log "DEBUG" "$@" || true; }

# ─── Usage / help ─────────────────────────────────────────────────────────────
usage() {
  cat <<EOF
${_BOLD}${BR_FETCH_NAME} ${BR_FETCH_VERSION}${_RESET} — BlackRoad OS HTTP client

${_BOLD}USAGE${_RESET}
  ${BR_FETCH_NAME} [OPTIONS] <URL>

${_BOLD}OPTIONS${_RESET}
  -X, --method METHOD      HTTP method (default: GET)
  -H, --header HEADER      Add request header (repeatable)
  -d, --data DATA          Request body
  -o, --output FILE        Write response body to FILE (default: stdout)
  -A, --agent AGENT_ID     Execute as BlackRoad agent identity
      --sign               Sign request with PS-SHA∞ identity
      --verify             Verify PS-SHA∞ signature on response
  -r, --retries N          Max retry attempts (default: ${DEFAULT_RETRIES})
      --retry-delay N      Initial retry delay in seconds (default: ${DEFAULT_RETRY_DELAY})
  -t, --timeout N          Request timeout in seconds (default: ${DEFAULT_TIMEOUT})
  -v, --verbose            Enable verbose output
  -q, --quiet              Suppress informational output
      --json               Set Content-Type: application/json
      --no-color           Disable colour output
      --version            Print version and exit
  -h, --help               Show this help

${_BOLD}ENVIRONMENT${_RESET}
  BR_CREDENTIALS_FILE      Path to BlackRoad credentials file
  BR_AGENT_ID              Default agent identity
  BR_FETCH_LOG             Append structured logs to this file
  BR_FETCH_DEBUG           Set to 1 for debug output

${_BOLD}EXAMPLES${_RESET}
  # Basic GET
  ${BR_FETCH_NAME} https://api.blackroad.io/agents

  # POST JSON as an agent
  ${BR_FETCH_NAME} --agent lucidia --json -d '{"task":"process"}' \\
      https://api.blackroad.io/tasks

  # Signed request with retry
  ${BR_FETCH_NAME} --sign --retries 5 https://secure.blackroad.io/data

${_BOLD}COPYRIGHT${_RESET}
  © 2026 BlackRoad OS, Inc. All Rights Reserved.
EOF
}

# ─── PS-SHA∞ signing stub ─────────────────────────────────────────────────────
# Generates a deterministic HMAC-SHA256 signature header using the credentials
# file or environment variable BR_SIGNING_KEY.  In a full implementation this
# would use an HSM / PS-SHA∞ quantum-state key derivation; for v0.1 we provide
# a well-defined, testable placeholder.
ps_sha_sign() {
  local url="$1"
  local body="${2:-}"
  local key="${BR_SIGNING_KEY:-blackroad-default-dev-key}"
  local payload="${url}:${body}"
  local sig

  if command -v openssl &>/dev/null; then
    sig=$(printf '%s' "${payload}" | openssl dgst -sha256 -hmac "${key}" -hex 2>/dev/null | awk '{print $NF}')
  else
    # Fallback: base64-encode the payload (not cryptographic — dev only)
    sig=$(printf '%s' "${payload}" | base64 | tr -d '\n')
    log_warn "openssl not found; using non-cryptographic signing (development mode)"
  fi

  echo "X-BR-Signature: br-sha256=${sig}"
}

# ─── Agent identity header ────────────────────────────────────────────────────
agent_header() {
  local agent_id="${1:-${BR_AGENT_ID:-}}"
  [[ -n "${agent_id}" ]] && echo "X-BR-Agent: ${agent_id}" || true
}

# ─── Credential injection ─────────────────────────────────────────────────────
load_credentials() {
  local creds_file="${BR_CREDENTIALS_FILE:-${HOME}/.blackroad/credentials}"
  if [[ -f "${creds_file}" ]]; then
    # Expected format: KEY=value, one per line
    # shellcheck source=/dev/null
    source "${creds_file}"
    log_debug "Loaded credentials from ${creds_file}"
  fi
}

# ─── Core fetch with retry ────────────────────────────────────────────────────
do_fetch() {
  local url="$1"; shift
  local -a curl_args=("$@")
  local retries="${OPT_RETRIES}"
  local delay="${OPT_RETRY_DELAY}"
  local attempt=0
  local http_code exit_code

  while true; do
    attempt=$(( attempt + 1 ))
    log_debug "Attempt ${attempt}/${retries} → ${url}"

    # Capture HTTP status code separately so we can retry on server errors
    http_code=0
    exit_code=0

    http_code=$(curl \
      --silent \
      --show-error \
      --write-out "%{http_code}" \
      --max-time "${OPT_TIMEOUT}" \
      "${curl_args[@]}" \
      "${url}" \
      ) || exit_code=$?

    # curl exit codes 0 = success (but check HTTP status below)
    # HTTP 5xx → retry
    if [[ ${exit_code} -eq 0 ]] && [[ "${http_code}" -lt 500 ]]; then
      log_debug "Response HTTP ${http_code}"
      return 0
    fi

    if [[ ${attempt} -ge ${retries} ]]; then
      if [[ ${exit_code} -ne 0 ]]; then
        log_error "Request failed after ${attempt} attempt(s) (curl exit ${exit_code})"
      else
        log_error "Request failed after ${attempt} attempt(s) (HTTP ${http_code})"
      fi
      return 1
    fi

    log_warn "Attempt ${attempt} failed (HTTP ${http_code:-?}, curl ${exit_code}); retrying in ${delay}s…"
    sleep "${delay}"
    delay=$(( delay * 2 ))   # exponential back-off
  done
}

# ─── Argument parsing ─────────────────────────────────────────────────────────
OPT_METHOD="GET"
OPT_HEADERS=()
OPT_DATA=""
OPT_OUTPUT=""
OPT_AGENT=""
OPT_SIGN=0
OPT_VERIFY=0
OPT_RETRIES="${DEFAULT_RETRIES}"
OPT_RETRY_DELAY="${DEFAULT_RETRY_DELAY}"
OPT_TIMEOUT="${DEFAULT_TIMEOUT}"
OPT_VERBOSE=0
OPT_QUIET=0
OPT_JSON=0
URL=""

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      -X|--method)      OPT_METHOD="${2:?'--method requires a value'}";  shift 2 ;;
      -H|--header)      OPT_HEADERS+=("${2:?'--header requires a value'}"); shift 2 ;;
      -d|--data)        OPT_DATA="${2:?'--data requires a value'}";       shift 2 ;;
      -o|--output)      OPT_OUTPUT="${2:?'--output requires a value'}";   shift 2 ;;
      -A|--agent)       OPT_AGENT="${2:?'--agent requires a value'}";     shift 2 ;;
      --sign)           OPT_SIGN=1;      shift ;;
      --verify)         OPT_VERIFY=1;    shift ;;
      -r|--retries)     OPT_RETRIES="${2:?'--retries requires a value'}"; shift 2 ;;
      --retry-delay)    OPT_RETRY_DELAY="${2:?'--retry-delay requires a value'}"; shift 2 ;;
      -t|--timeout)     OPT_TIMEOUT="${2:?'--timeout requires a value'}"; shift 2 ;;
      -v|--verbose)     OPT_VERBOSE=1;   shift ;;
      -q|--quiet)       OPT_QUIET=1;     shift ;;
      --json)           OPT_JSON=1;      shift ;;
      --no-color)       _BOLD="" _RESET="" _RED="" _AMBER="" _GREEN="" _BLUE=""; shift ;;
      --version)        echo "${BR_FETCH_NAME} ${BR_FETCH_VERSION}"; exit 0 ;;
      -h|--help)        usage; exit 0 ;;
      --) shift; URL="${1:-}"; break ;;
      -*)
        log_error "Unknown option: $1"
        usage >&2
        exit 1
        ;;
      *)
        if [[ -z "${URL}" ]]; then
          URL="$1"
        else
          log_error "Unexpected argument: $1"
          usage >&2
          exit 1
        fi
        shift
        ;;
    esac
  done
}

# ─── Main ─────────────────────────────────────────────────────────────────────
main() {
  parse_args "$@"

  if [[ -z "${URL}" ]]; then
    log_error "No URL specified"
    usage >&2
    exit 1
  fi

  # Load any stored credentials
  load_credentials

  # Build curl argument list
  local -a args=()

  # Method
  args+=( --request "${OPT_METHOD}" )

  # Timeout
  args+=( --max-time "${OPT_TIMEOUT}" )

  # Verbose / silent
  if [[ "${OPT_VERBOSE}" -eq 1 ]]; then
    args+=( --verbose )
  fi

  # Output
  if [[ -n "${OPT_OUTPUT}" ]]; then
    args+=( --output "${OPT_OUTPUT}" )
  fi

  # JSON content-type
  if [[ "${OPT_JSON}" -eq 1 ]]; then
    args+=( --header "Content-Type: application/json" )
    args+=( --header "Accept: application/json" )
  fi

  # User-supplied headers
  for h in "${OPT_HEADERS[@]+"${OPT_HEADERS[@]}"}"; do
    args+=( --header "${h}" )
  done

  # Agent identity header
  local ah
  ah="$(agent_header "${OPT_AGENT}")"
  [[ -n "${ah}" ]] && args+=( --header "${ah}" )

  # PS-SHA∞ signing
  if [[ "${OPT_SIGN}" -eq 1 ]]; then
    local sig_header
    sig_header="$(ps_sha_sign "${URL}" "${OPT_DATA}")"
    args+=( --header "${sig_header}" )
    log_debug "Added signature header: ${sig_header}"
  fi

  # Request body
  if [[ -n "${OPT_DATA}" ]]; then
    args+=( --data "${OPT_DATA}" )
  fi

  # --verify: response signature verification (planned for v0.2)
  if [[ "${OPT_VERIFY}" -eq 1 ]]; then
    log_warn "--verify: response signature verification is not yet implemented (planned v0.2)"
  fi

  # BlackRoad user-agent string
  args+=( --user-agent "${BR_FETCH_NAME}/${BR_FETCH_VERSION} (BlackRoad OS)" )

  [[ "${OPT_QUIET}" -eq 0 ]] && log_info "→ ${OPT_METHOD} ${URL}"

  do_fetch "${URL}" "${args[@]}"
}

# ─── Self-test mode (used by the bats test suite) ────────────────────────────
selftest() {
  local fn="${1:-}"; shift || true
  case "${fn}" in
    ps_sha_sign)   ps_sha_sign "$@" ;;
    agent_header)  agent_header "$@" ;;
    *)
      echo "Unknown selftest function: ${fn}" >&2
      exit 1
      ;;
  esac
}

# ─── Entry point ──────────────────────────────────────────────────────────────
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  if [[ "${1:-}" == "--selftest" ]]; then
    shift
    selftest "$@"
  else
    main "$@"
  fi
fi
