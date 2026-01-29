# 🔒 Skill-Scanner: The AI Skill Safety Guard

[![NPM Version](https://img.shields.io/npm/v/skill-scanner.svg?style=flat-square)](https://www.npmjs.com/package/skill-scanner)
[![Build Status](https://img.shields.io/github/actions/workflow/status/JonusNattapong/Skill-Scanner/skill-scan.yml?branch=main&style=flat-square)](https://github.com/JonusNattapong/Skill-Scanner/actions)
[![License](https://img.shields.io/github/license/JonusNattapong/Skill-Scanner.svg?style=flat-square)](LICENSE)
[![OWASP LLM Compliant](https://img.shields.io/badge/OWASP%20LLM-Compliant-magenta?style=flat-square)](https://owasp.org/www-project-top-10-for-large-language-model-applications/)

**Skill-Scanner** is an advanced security orchestration tool designed to secure the next generation of AI agents. It performs multi-dimensional analysis on AI Agent Skills (MCP, Shell-based, or Code-based) to detect hidden threats, malicious intent, and supply chain vulnerabilities before they reach your production environment.

---

## 🌟 Why Skill-Scanner?

In the era of "Shadow AI," developers frequently adopt community-made "skills" or "actions" for their agents. These skills often have high-privilege access to file systems, system shells, and API tokens. Skill-Scanner ensures that every skill follows your organization's security posture.

### 🛡️ Core Defense Pillars

* **🧠 Cognitive Analysis**: Beyond strings; we use Gemini 2.0 to understand the *reasoning* and *intent* behind the code.
* **📦 Supply Chain Auditing**: Detecting typosquattat package names and known malicious dependencies in `package.json`.
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
|:---|:---|:---|
| `<path>` | Path to the directory or file to scan. | (Required) |
| `--report` | Auto-exports a timestamped JSON audit report. | `false` |
| `--sarif` | Generates SARIF for GitHub Security integration. | `false` |
| `--severity` | Minimum severity level (`low`, `medium`, `high`, `critical`). | `low` |
| `--checks` | Filter specific engines (e.g., `semantic-analysis,nodesecure`). | All |
| `--ignore` | Comma-separated glob patterns to exclude from scan. | `node_modules,dist,.git` |

### 🔑 Environment Variables

Enable advanced AI and malware detection by setting these in your environment or a `.env` file:

* `GEMINI_API_KEY`: Required for **Semantic Analysis** and **Prompt Injection Detection**.
* `VIRUSTOTAL_API_KEY`: Required for **Malware Intelligence** scanning.

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
