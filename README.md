# 🔒 Skill Scanner (Enterprise Edition)

**Skill Scanner** is a comprehensive security tool for validating AI agent skills against potential security risks. It is designed to mitigate the risks associated with "shadow AI" and the use of unverified skills in workplace environments.

![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![TypeScript](https://img.shields.io/badge/typescript-%5E5.3-blue)

## 🛡️ Core Analysis Engines

The tool employs a multi-layered defense strategy to ensure agent skills are safe for adoption:

### 1. Advanced Static & Behavioral Analysis

- **AST-based Detection**: Uses `@babel/parser` to identify dangerous code patterns (Command/Code Injection).
- **NodeSecure Integration**: Deep analysis using `@nodesecure/js-x-ray` to detect obfuscated code and sensitive API probing.
- **Path Traversal & Secrets**: Regex and AST-based scanning for hardcoded credentials and unsafe file access.

### 2. LLM-assisted Semantic Analysis

- **Intent Analysis**: Leverages Large Language Models (Gemini 1.5 Flash) to understand the semantic intent of code and documentation.
- **Shadow AI Mitigation**: Detects hidden backdoors or suspicious instructions that bypass traditional static checks.

### 3. Cisco AI Defense Inspection Workflows

- **Compliance Scanning**: Validates skills against Cisco's security frameworks and enterprise standards.
- **Agent Skill Validation**: Specialized scanning for `SKILL.md` files to detect dangerous binary requirements (e.g., `nc`, `nmap`) and unsafe shell patterns.

### 4. VirusTotal Malware Intelligence

- **Threat Database Check**: Automatically hashes code and files to check against VirusTotal's database of known malware and malicious indicators.

---

## 🚀 Getting Started

### Installation

```bash
npm install
npm run build
```

### Environment Setup (Optional for Advanced Features)

Create a `.env` file to enable LLM and Malware analysis:

```env
GEMINI_API_KEY=your_key_here
VIRUSTOTAL_API_KEY=your_key_here
```

### CLI Usage

```bash
# Scan a directory of skills
node dist/cli.js ./examples/skills

# Scan a single skill file
node dist/cli.js ./examples/malicious-skill.ts

# Filter by severity
node dist/cli.js ./src --severity high

# Export JSON for Security Audits
node dist/cli.js ./src --json > report.json
```

---

## 🔍 Detected Vulnerabilities

| Category | Description | Severity |
|----------|-------------|----------|
| **Command Injection** | Unsafe execution of shell commands via user input. | High / Critical |
| **Code Injection** | Use of `eval()`, `new Function()`, or `vm` modules. | High / Critical |
| **Hardcoded Secrets** | API keys, AWS credentials, Tokens, and Private Keys. | Medium / Critical |
| **File System** | Path traversal patterns and dynamic file access. | Medium / High |
| **Agent Skill Risk** | Dangerous binaries (`nc`, `curl`) or suspicious instructions in `SKILL.md`. | High |
| **Malicious Intent** | Detected via LLM Semantic Analysis. | High / Critical |

## 📚 Documentation & Inspiration

- [GitHub Documentation on Agent Skills](https://docs.github.com/en/copilot/using-github-copilot/utilizing-github-copilot-agent-skills)
- [Cisco AI Security Framework](https://www.cisco.com/c/en/us/products/security/ai-defense.html)
- [NodeSecure js-x-ray](https://github.com/NodeSecure/js-x-ray)

---

Developed by the **Skill-Scanner Team** for Secure AI Adoption.
