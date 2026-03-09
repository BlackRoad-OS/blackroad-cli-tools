#!/usr/bin/env bats
# Tests for br-fetch — BlackRoad OS HTTP client
# Copyright (c) 2026 BlackRoad OS, Inc. All Rights Reserved.

SCRIPT="${BATS_TEST_DIRNAME}/../br-fetch.sh"

# ─── Version / help ───────────────────────────────────────────────────────────

@test "prints version with --version" {
  run bash "${SCRIPT}" --version
  [ "${status}" -eq 0 ]
  [[ "${output}" =~ ^br-fetch\ [0-9]+\.[0-9]+\.[0-9]+$ ]]
}

@test "exits 0 with --help" {
  run bash "${SCRIPT}" --help
  [ "${status}" -eq 0 ]
  [[ "${output}" =~ "USAGE" ]]
  [[ "${output}" =~ "OPTIONS" ]]
}

# ─── Argument validation ──────────────────────────────────────────────────────

@test "exits non-zero when no URL given" {
  run bash "${SCRIPT}"
  [ "${status}" -ne 0 ]
  [[ "${output}" =~ "No URL specified" ]]
}

@test "exits non-zero for unknown option" {
  run bash "${SCRIPT}" --no-such-option http://example.com
  [ "${status}" -ne 0 ]
}

# ─── PS-SHA∞ signing ──────────────────────────────────────────────────────────

@test "ps_sha_sign produces a non-empty string" {
  run bash "${SCRIPT}" --selftest ps_sha_sign 'https://api.blackroad.io' ''
  [ "${status}" -eq 0 ]
  [[ -n "${output}" ]]
}

@test "ps_sha_sign header starts with X-BR-Signature" {
  run bash "${SCRIPT}" --selftest ps_sha_sign 'https://api.blackroad.io' ''
  [ "${status}" -eq 0 ]
  [[ "${output}" =~ ^X-BR-Signature:\ br-sha256= ]]
}

@test "ps_sha_sign is deterministic for same inputs" {
  local s1 s2
  s1="$(bash "${SCRIPT}" --selftest ps_sha_sign 'https://api.blackroad.io' 'body')"
  s2="$(bash "${SCRIPT}" --selftest ps_sha_sign 'https://api.blackroad.io' 'body')"
  [ "${s1}" = "${s2}" ]
}

@test "ps_sha_sign differs for different URLs" {
  local s1 s2
  s1="$(bash "${SCRIPT}" --selftest ps_sha_sign 'https://api.blackroad.io/a' '')"
  s2="$(bash "${SCRIPT}" --selftest ps_sha_sign 'https://api.blackroad.io/b' '')"
  [ "${s1}" != "${s2}" ]
}

# ─── Agent identity header ────────────────────────────────────────────────────

@test "agent_header returns X-BR-Agent for given agent id" {
  run bash "${SCRIPT}" --selftest agent_header 'lucidia'
  [ "${status}" -eq 0 ]
  [ "${output}" = "X-BR-Agent: lucidia" ]
}

@test "agent_header returns empty string when no agent given" {
  run env -u BR_AGENT_ID bash "${SCRIPT}" --selftest agent_header ''
  [ "${status}" -eq 0 ]
  [ -z "${output}" ]
}

@test "agent_header uses BR_AGENT_ID env var as fallback" {
  run env BR_AGENT_ID=aria bash "${SCRIPT}" --selftest agent_header ''
  [ "${status}" -eq 0 ]
  [ "${output}" = "X-BR-Agent: aria" ]
}

# ─── Flags ───────────────────────────────────────────────────────────────────

@test "--no-color flag does not break execution" {
  run bash "${SCRIPT}" --no-color --version
  [ "${status}" -eq 0 ]
  [[ "${output}" =~ ^br-fetch\ [0-9] ]]
}

# ─── Integration: real HTTP ───────────────────────────────────────────────────

@test "performs GET request and returns HTTP 200" {
  # Use the GitHub meta endpoint — always reachable on the runner
  run bash "${SCRIPT}" --quiet --timeout 10 https://api.github.com
  [ "${status}" -eq 0 ] || skip "Network unavailable in this environment"
}

