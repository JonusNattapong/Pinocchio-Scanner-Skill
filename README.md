# Skill-Scanner: AI Skill Safety Guard

[![NPM Version](https://img.shields.io/npm/v/%40jonusnattapong%2Fskill-scanner.svg?style=flat-square)](https://www.npmjs.com/package/@jonusnattapong/skill-scanner)
[![Build Status](https://img.shields.io/github/actions/workflow/status/JonusNattapong/Skill-Scanner/skill-scan.yml?branch=main&style=flat-square)](https://github.com/JonusNattapong/Skill-Scanner/actions)
[![License](https://img.shields.io/github/license/JonusNattapong/Skill-Scanner.svg?style=flat-square)](LICENSE)
[![OWASP LLM Top 10](https://img.shields.io/badge/OWASP%20LLM-Top%2010-magenta?style=flat-square)](https://owasp.org/www-project-top-10-for-large-language-model-applications/)

Skill-Scanner is a security scanner for AI agent skill files. It performs static analysis across code and documentation to detect command injection, unsafe file access, hardcoded secrets, prompt injection patterns, and risky MCP definitions before they reach production.

---

## Why Skill-Scanner

Community-made skills often run with high privileges (filesystem, shell, network, tokens). Skill-Scanner helps you validate that skills align with your security posture and highlights high-risk behavior early.

### Core capabilities

- Multi-language scanning for TypeScript/JavaScript, Python, Go, and Rust
- MCP manifest and tool schema risk detection
- LLM-assisted semantic analysis for intent and prompt-injection signals
- Malware and dependency auditing (VirusTotal + NodeSecure + package audit checks)
- Optional AI-powered auto-remediation suggestions
- SARIF export for CI and GitHub Security integration

---

## Installation

### Use instantly with npx

```bash
npx @jonusnattapong/skill-scanner ./path-to-skill
```

### Install globally

```bash
npm install -g @jonusnattapong/skill-scanner
```

### Docker

```bash
docker build -t skill-scanner .
docker run -v $(pwd):/src -e GEMINI_API_KEY="your_key" skill-scanner /src --report
```

---

## CLI usage

```bash
skill-scanner <path> [options]
```

### Options

| Flag | Description | Default |
| :--- | :--- | :--- |
| `<path>` | Path to the directory or file to scan. | (Required) |
| `-h, --help` | Show help. |  |
| `-v, --verbose` | Verbose output (includes errors from checks). | `false` |
| `--json` | Print JSON output to stdout. | `false` |
| `--report` | Auto-export a timestamped JSON report to `reports/`. | `false` |
| `--sarif` | Export SARIF to `reports/` for GitHub Security. | `false` |
| `--severity <level>` | Minimum severity (`low`, `medium`, `high`, `critical`). | `low` |
| `--checks <types>` | Comma-separated list of checks to run. | All |
| `--ignore <patterns>` | Comma-separated glob patterns to ignore. | `node_modules,dist,build,.git,*.test.*,*.spec.*` |
| `--fix` | Enable AI auto-remediation suggestions (experimental). | `false` |
| `--provider <name>` | AI provider (`gemini`, `opencode`, `molt`, `openrouter`, `openai`). | `gemini` |
| `--model <name>` | Override the provider model name. | Provider default |
| `--web-search` | Enable AI web search capability (if supported). | `false` |

### Examples

```bash
skill-scanner ./skills
skill-scanner ./agent --severity high
skill-scanner ./repo --checks command-injection,hardcoded-secret
skill-scanner ./repo --json > report.json
skill-scanner ./skills --fix --provider openrouter --model "meta-llama/llama-3.1-8b-instruct:free"
```

---

## Checks and detections

These checks map to `--checks` values:

- `command-injection` - Unsafe shell command execution
- `code-injection` - `eval`, `Function`, obfuscation, dynamic execution (includes NodeSecure signals)
- `file-system` - Unsafe file operations and path traversal patterns
- `hardcoded-secret` - API keys, tokens, and secrets in code
- `semantic-analysis` - LLM-assisted intent analysis and prompt-injection signals
- `malware-scan` - VirusTotal lookup for suspicious artifacts
- `dependency-audit` - Dependency risk signals for `package.json`
- `cisco-defense` - Risky binaries and suspicious skill text in `SKILL.md`
- `mcp-definition` - MCP manifest risks and global permissive flags
- `tool-schema` - Overly permissive tool schemas in MCP manifests
- `excessive-agency` - Execution-like behavior in MCP definitions
- `python-security`, `go-security`, `rust-security` - Language-specific heuristics

---

## Outputs

### JSON (stdout)

```bash
skill-scanner ./skills --json
```

### Report export

```bash
skill-scanner ./skills --report
```

### SARIF export

```bash
skill-scanner ./skills --sarif
```

---

## AI providers

Semantic analysis and remediation require an AI provider. Configure via environment variables:

| Provider | Required env vars | Default model |
| :--- | :--- | :--- |
| Gemini | `GEMINI_API_KEY` | `gemini-pro` |
| OpenRouter | `OPENROUTER_API_KEY` | `meta-llama/llama-3.1-8b-instruct:free` |
| OpenAI | `OPENAI_API_KEY` | `gpt-4o-mini` |
| Opencode | `OPENCODE_API_BASE`, optional `OPENCODE_API_KEY` | `opencode-model` |
| Molt | `MOLT_API_BASE`, optional `MOLT_API_KEY` | `molt-model` |

Notes:
- `--web-search` currently augments prompts for providers that support search or grounding.
- If no provider is configured, semantic analysis and auto-remediation are skipped.

---

## Programmatic usage

```bash
npm install @jonusnattapong/skill-scanner
```

```typescript
import { scanCode } from "@jonusnattapong/skill-scanner";

const code = "exec('rm -rf ' + path);";
const findings = await scanCode(code, {
  severityThreshold: "high",
});

console.log(findings);
```

---

## Exit codes

- `0` - Scan completed with no high or critical findings
- `1` - High or critical findings detected
- `2` - Error (invalid path, parsing failure, or runtime error)

---

## CI/CD integration

### GitHub Actions

```yaml
- name: AI Skill Security Scan
  uses: JonusNattapong/Skill-Scanner@main
  with:
    path: "./skills"
    gemini_api_key: ${{ secrets.GEMINI_API_KEY }}
    severity: "high"
```

---

## Security and contributing

Please see `CONTRIBUTING.md` and `CODE_OF_CONDUCT.md`. For security issues, follow `SECURITY.md` and avoid public disclosure.

---

MIT License. Developed by JonusNattapong and the Secure AI Community.
