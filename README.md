# 🔒 Skill-Scanner: The AI Skill Safety Guard

[![NPM Version](https://img.shields.io/npm/v/skill-scanner.svg?style=flat-square)](https://www.npmjs.com/package/skill-scanner)
[![Build Status](https://img.shields.io/github/actions/workflow/status/JonusNattapong/Skill-Scanner/skill-scan.yml?branch=main&style=flat-square)](https://github.com/JonusNattapong/Skill-Scanner/actions)
[![License](https://img.shields.io/github/license/JonusNattapong/Skill-Scanner.svg?style=flat-square)](LICENSE)
[![OWASP LLM Compliant](https://img.shields.io/badge/OWASP%20LLM-Compliant-magenta?style=flat-square)](https://owasp.org/www-project-top-10-for-large-language-model-applications/)

**Skill-Scanner** is an advanced security orchestration tool designed to secure the next generation of AI agents. It performs multi-dimensional analysis on AI Agent Skills (MCP, Shell-based, or Code-based) across multiple languages including **TypeScript/JavaScript, Python, Go, and Rust**. It detects hidden threats, malicious intent, and supply chain vulnerabilities before they reach your production environment.

---

## 🌟 Why Skill-Scanner?

In the era of "Shadow AI," developers frequently adopt community-made "skills" or "actions" for their agents. These skills often have high-privilege access to file systems, system shells, and API tokens. Skill-Scanner ensures that every skill follows your organization's security posture.

### 🛡️ Core Defense Pillars

* **🧠 Cognitive Analysis**: Beyond strings; we use advanced LLMs (Gemini, Llama 3, GPT-4) to understand the *reasoning* and *intent* behind the code.
* **🛠️ Auto-Remediation**: Generates copy-paste secure code replacements for detected vulnerabilities using your preferred AI provider.
* **📦 Supply Chain Auditing**: Detecting typosquatted package names and known malicious dependencies in `package.json`.
* **� Behavioral Guardrails**: Identifying dangerous binary requirements (e.g., `nc`, `nmap`) in documentation and code.
* **📊 Executive Visibility**: High-level Risk Scoring (A-F) for non-technical stakeholders plus SARIF for engineers.

---

## � Installation & Quick Start

### ⚡ Use Instantly (npx)

The fastest way to scan a local directory or file:

```bash
npx skill-scanner ./path-to-skill
```

### 📦 Install Globally

```bash
# Via NPM
npm install -g skill-scanner

# Via Universal Install Script (Linux/macOS)
curl -sSL https://raw.githubusercontent.com/JonusNattapong/Skill-Scanner/main/scripts/install.sh | bash
```

### 🐳 Docker Deployment

```bash
docker build -t skill-scanner .
docker run -v $(pwd):/src -e GEMINI_API_KEY="your_key" skill-scanner /src --report
```

---

## �️ Configuration & CLI Flags

| Flag | Description | Default |
| :--- | :--- | :--- |
| `<path>` | Path to the directory or file to scan. | (Required) |
| `--report` | Auto-exports a timestamped JSON audit report. | `false` |
| `--sarif` | Generates SARIF for GitHub Security integration. | `false` |
| `--severity` | Minimum severity level (`low`, `medium`, `high`, `critical`). | `low` |
| `--checks` | Filter specific engines (e.g., `semantic-analysis,nodesecure`). | All |
| `--ignore` | Comma-separated glob patterns to exclude from scan. | `node_modules,dist,.git` |
| `--fix` | Enable auto-remediation suggestions (experimental). | `false` |
| `--provider` | AI Provider selection (`gemini`, `opencode`, `molt`, `openrouter`, `openai`). | `gemini` |
| `--model` | Specify AI Model name (e.g., `meta-llama/llama-3.1-8b-instruct:free`). | (Provider Default) |
| `--web-search` | Enable AI web search capability (if supported). | `false` |

### 🤖 Multi-Provider AI Setup

Skill-Scanner supports a wide range of AI backends for semantic analysis and remediation.

| Provider | Requirement | Default Model |
|:---|:---|:---|
| **Gemini** | `GEMINI_API_KEY` | `gemini-1.5-flash` |
| **OpenRouter** | `OPENROUTER_API_KEY` | `meta-llama/llama-3.1-8b-instruct:free` |
| **OpenAI** | `OPENAI_API_KEY` | `gpt-4o-mini` |
| **Opencode** | `OPENCODE_API_BASE` | local |
| **Molt** | `MOLT_API_BASE` | local |

**Example using OpenRouter:**

```bash
skill-scanner ./my-skill --provider openrouter --model "google/gemini-2.0-flash-exp:free" --fix
```

---

## 💻 Library Usage (Programmatic API)

You can integrate Skill-Scanner directly into your Node.js/TypeScript applications:

```bash
npm install @jonusnattapong/skill-scanner
```

```typescript
import { scanCode } from '@jonusnattapong/skill-scanner';

const code = "exec('rm -rf ' + path);";
const findings = await scanCode(code, {
  severityThreshold: 'high'
});

console.log(findings);
```

### 🔑 Environment Variables

Enable advanced AI and malware detection by functionality:

* **General**: `VERBOSE=true`
* **Gemini**: `GEMINI_API_KEY`
* **OpenRouter**: `OPENROUTER_API_KEY`
* **OpenAI Official**: `OPENAI_API_KEY`
* **Malware Scanning**: `VIRUSTOTAL_API_KEY`
* **Custom Backends**: `OPENCODE_API_BASE`, `MOLT_API_BASE`

> **Note**: Skill-Scanner includes a smart **Retry Logic** with exponential backoff for AI requests, making it resilient to rate limits (HTTP 429) when using free LLM tiers.

---

## 🤖 CI/CD Integration

### GitHub Actions

Skill-Scanner is natively compatible with GitHub's security features. Add this to your workflow:

```yaml
- name: AI Skill Security Scan
  uses: JonusNattapong/Skill-Scanner@main
  with:
    path: './skills'
    gemini_api_key: ${{ secrets.GEMINI_API_KEY }}
    severity: 'high'
```

*This action automatically uploads findings to the **GitHub Security tab (SARIF)**.*

---

## 🧩 Capability Mapping

Skill-Scanner findings are mapped directly to the **OWASP Top 10 for LLM Applications**:

| Engine | OWASP Category | Target |
|:---|:---|:---|
| **Semantic Analysis** | LLM01 - Prompt Injection | Documentation & Logic |
| **Python Security** | LLM06 - Excessive Agency | Python Source Code |
| **Go Security** | LLM06 - Excessive Agency | Go Source Code |
| **Rust Security** | LLM06 - Excessive Agency | Rust Source Code |
| **Dependency Audit** | LLM03 - Supply Chain | Package Ecosystem |
| **Logic Scanners** | LLM06 - Excessive Agency | System Access & Shells |
| **Secrets Engine** | LLM02 - Data Disclosure | Environment & Tokens |

---

## 🤝 Contributing & Security

We welcome community contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md).

**Found a security bug?** Please do not open a public issue. Report it via the instructions in [SECURITY.md](SECURITY.md).

---

Developed with ❤️ by **JonusNattapong** and the Secure AI Community.
*Empowering agents, ensuring trust.*
