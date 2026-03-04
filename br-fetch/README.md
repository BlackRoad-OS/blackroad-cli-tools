# br-fetch

## Status: 🟢 GREEN LIGHT - Production Ready

**Last Updated:** 2026-03-04
**Maintained By:** BlackRoad OS, Inc.

BlackRoad's agent-aware HTTP fetch wrapper built on top of curl.

## Features

- Auto-authentication with br credentials
- PS-SHA∞ request signing (`--sign`)
- Agent identity execution (`--agent <ID>`)
- Built-in observability with verbose mode
- Intelligent retry logic (configurable retries and delays)
- Configurable timeouts

## Usage

```bash
# Basic fetch
br-fetch https://api.blackroad.io/agents

# As agent
br-fetch --agent lucidia https://external-api.com

# Signed request
br-fetch --sign --verify https://endpoint.com

# POST with output to file
br-fetch -X POST -o response.json https://api.example.com/data

# Custom timeout and retry
br-fetch --timeout 60 --retry 5 https://api.example.com
```

## Options

| Flag | Description |
|------|-------------|
| `-a, --agent <ID>` | Execute as named agent identity |
| `-s, --sign` | Sign request with PS-SHA∞ |
| `-v, --verify` | Verify response integrity |
| `-X, --method` | HTTP method (default: GET) |
| `-o, --output <FILE>` | Write response to file |
| `-r, --retry <N>` | Retry count (default: 3) |
| `-t, --timeout <SEC>` | Timeout in seconds (default: 30) |
| `--verbose` | Enable verbose output |
| `--version` | Print version |
| `-h, --help` | Show help |

## Building

Requires `bash` 4+ and `curl`. No compilation needed — pure shell.

```bash
chmod +x br-fetch.sh
./br-fetch.sh --version
```

## Testing

```bash
# Install bats
sudo apt-get install -y bats   # Ubuntu
brew install bats-core          # macOS

# Run tests
bats tests/test_br_fetch.bats
```

