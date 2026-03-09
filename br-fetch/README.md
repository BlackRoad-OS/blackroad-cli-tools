# br-fetch

**Status: 🟢 GREEN LIGHT - Production Ready**

BlackRoad OS HTTP client — a production-quality `curl` wrapper with agent-aware
networking, PS-SHA∞ request signing, structured observability, and intelligent
retry logic.

## Features

| Feature | Description |
|---------|-------------|
| 🔐 **Auto-authentication** | Loads BlackRoad credentials from `~/.blackroad/credentials` |
| ✍️  **PS-SHA∞ signing** | HMAC-SHA256 request signing via `--sign` flag |
| 🤖 **Agent identity** | Attaches `X-BR-Agent` header via `--agent` flag |
| 📊 **Observability** | Structured log lines to stderr (and optional log file) |
| 🔄 **Retry logic** | Exponential back-off on network errors and HTTP 5xx |
| 🎨 **Colour output** | Context-aware colour (disabled when not a TTY) |

## Requirements

- Bash 4.0+
- `curl` (any recent version)
- `openssl` (optional; enables cryptographic signing — falls back to base64 in dev mode)

## Installation

```bash
# Clone the repo
git clone https://github.com/BlackRoad-OS/blackroad-cli-tools.git
cd blackroad-cli-tools/br-fetch

# Make executable and add to PATH
chmod +x br-fetch.sh
sudo ln -sf "$(pwd)/br-fetch.sh" /usr/local/bin/br-fetch
```

## Usage

```
br-fetch [OPTIONS] <URL>

OPTIONS
  -X, --method METHOD      HTTP method (default: GET)
  -H, --header HEADER      Add request header (repeatable)
  -d, --data DATA          Request body
  -o, --output FILE        Write response body to FILE (default: stdout)
  -A, --agent AGENT_ID     Execute as BlackRoad agent identity
      --sign               Sign request with PS-SHA∞ identity
      --verify             Verify PS-SHA∞ signature on response
  -r, --retries N          Max retry attempts (default: 3)
      --retry-delay N      Initial retry delay in seconds (default: 1)
  -t, --timeout N          Request timeout in seconds (default: 30)
  -v, --verbose            Enable verbose output
  -q, --quiet              Suppress informational output
      --json               Set Content-Type: application/json
      --no-color           Disable colour output
      --version            Print version and exit
  -h, --help               Show this help
```

## Examples

```bash
# Basic GET
br-fetch https://api.blackroad.io/agents

# POST JSON as a named agent
br-fetch --agent lucidia --json \
    -d '{"task":"summarise","priority":"high"}' \
    https://api.blackroad.io/tasks

# Signed request with retry
br-fetch --sign --retries 5 https://secure.blackroad.io/data

# Quiet request (no log lines) to a file
br-fetch --quiet --output response.json https://api.blackroad.io/status

# Custom header + verbose
br-fetch -H "Authorization: Bearer $TOKEN" -v https://api.blackroad.io/agents
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `BR_CREDENTIALS_FILE` | Path to credentials file (default: `~/.blackroad/credentials`) |
| `BR_AGENT_ID` | Default agent identity used when `--agent` is not set |
| `BR_SIGNING_KEY` | HMAC key for PS-SHA∞ signing (default: dev key) |
| `BR_FETCH_LOG` | Append structured log lines to this file |
| `BR_FETCH_DEBUG` | Set to `1` for debug-level log output |

## Credentials File Format

```ini
# ~/.blackroad/credentials
BR_SIGNING_KEY=your-production-hmac-key
BR_AGENT_ID=default-agent
```

## PS-SHA∞ Request Signing

When `--sign` is used, `br-fetch` attaches an `X-BR-Signature` header:

```
X-BR-Signature: br-sha256=<hex-encoded HMAC-SHA256>
```

The signature is computed over `<URL>:<body>` using the key in `BR_SIGNING_KEY`.
In production, replace the default dev key with a secret managed by your HSM or
secrets manager.

## Exit Codes

| Code | Meaning |
|------|---------|
| `0`  | Request succeeded (HTTP < 500) |
| `1`  | Request failed (network error or HTTP 5xx after all retries) |

## Testing

```bash
# Install bats (https://github.com/bats-core/bats-core)
sudo apt-get install bats   # Debian/Ubuntu
brew install bats-core       # macOS

# Run the test suite
bats br-fetch/tests/test_br_fetch.bats
```

## Building (Future)

`br-fetch` is currently a pure-bash implementation.  A compiled Go or Rust
binary (`br-fetch-go`) is planned for v0.2 for sub-millisecond startup and
native TLS pinning support.

---

**Copyright © 2026 BlackRoad OS, Inc. All Rights Reserved.**

Based on `curl` ([curl License / MIT-like](https://curl.se/docs/copyright.html)).

