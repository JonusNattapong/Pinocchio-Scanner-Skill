# 🔒 Skill Scanner (v1.1.0)

## *Enterprise-Grade Security Orchestrator for AI Agent Skills*

**Skill Scanner** is a powerful security tool designed to protect your AI ecosystem by validating Agent Skills against advanced threats, "Shadow AI" patterns, and supply chain attacks.

[![NPM Version](https://img.shields.io/badge/version-1.1.0-blue)](https://github.com/JonusNattapong/Skill-Scanner)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub Action](https://img.shields.io/badge/GitHub_Actions-Safe-green)](https://github.com/JonusNattapong/Skill-Scanner/actions)

---

## 🚀 Quick Start (No Installation Needed)

You can run Skill Scanner instantly on any repository or file using `npx`:

```bash
# Basic scan
npx skill-scanner ./my-skills

# Scan with full Enterprise features (AI + Malware Intelligence)
export GEMINI_API_KEY="your_api_key"
npx skill-scanner ./my-skills --report --sarif
```

---

## 🔥 Enterprise Features

- **🧠 AI Semantic Analysis**: Uses Gemini 2.0 to detect malicious intent, data exfiltration, and **Prompt Injection** (Jailbreak attempts).
- **🛡️ SARIF Support**: Ready for **GitHub Security Tab**. Export standard reports for enterprise audit trails.
- **📊 Risk Scoring (A-F)**: Instant assessment of your skill's risk level with weighted category analysis.
- **📦 Dependency Audit**: Scans `package.json` for deprecated, malicious, or typosquatted packages.
- **🔗 VirusTotal Integration**: Reality-check code hashes against global malware intelligence.
- **🏷️ OWASP LLM Top 10 Mapping**: Every finding is automatically mapped to industry-standard LLM risk categories.

---

## 🛠️ Usage

### Installation

If you prefer to install it globally:

```bash
npm install -g skill-scanner
```

---

## 🌍 Universal Integration

Skill-Scanner is designed to be highly portable and work on any system.

### 🐳 1. Docker (Platform Independent)

Run without Node.js installed by using our container:

```bash
# Build and Run
docker build -t skill-scanner .
docker run -v $(pwd):/src -e GEMINI_API_KEY="your_key" skill-scanner /src
```

### 🔗 2. Reusable GitHub Action (Composite)

Integrate directly into any step of your CI/CD by referencing our marketplace action:

```yaml
- name: Security Scan
  uses: JonusNattapong/Skill-Scanner@main
  with:
    gemini_api_key: ${{ secrets.GEMINI_API_KEY }}
    severity: 'high'
```

*This will automatically upload results to your GitHub Security results (SARIF).*

### 🛠️ 3. One-Liner Install (Linux/macOS)

Direct installation for development environments:

```bash
curl -sSL https://raw.githubusercontent.com/JonusNattapong/Skill-Scanner/main/scripts/install.sh | bash
```

---

## 🏷️ Risk Coverage

| Category | OWASP Mapping | Description |
|----------|---------------|-------------|
| **Prompt Injection** | LLM01 | Detection of jailbreak patterns and instruction overrides. |
| **Data Exfiltration** | LLM02 | DNS tunneling, unauthorized webhooks, and credential theft. |
| **Supply Chain** | LLM03 | Malicious dependencies and typosquatted package names. |
| **Excessive Agency** | LLM06 | Hidden backdoors, reverse shells, and unauthorized persistence. |
| **Command Injection** | LLM05 | Unsafe execution of system commands. |

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---
*Developed by **JonusNattapong** for the Secure AI Future.*
