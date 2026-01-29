import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import type { SecurityCheck, CheckContext } from "../types.js";

// A list of packages known for "typosquatting" or historical vulnerabilities in AI ecosystems
const DANGEROUS_PACKAGES: Record<string, string> = {
  request:
    "The 'request' package is deprecated. Use 'axios' or 'node-fetch' instead.",
  colors:
    "Historical incidents with self-destructing versions. Use 'picocolors' or 'chalk'.",
  "event-stream": "History of being hijacked to steal cryptocurrency.",
  "node-ipc": "History of malicious code targeting specific locales.",
  "flatmap-stream": "Associated with past supply chain attacks.",
};

export const dependencyAuditCheck: SecurityCheck = {
  name: "dependency-audit",

  check(context: CheckContext): void {
    // We only care about package.json files
    if (!context.filePath.endsWith("package.json")) {
      return;
    }

    try {
      const pkg = JSON.parse(context.code);
      const dependencies = {
        ...(pkg.dependencies || {}),
        ...(pkg.devDependencies || {}),
      };

      for (const [name, version] of Object.entries(dependencies)) {
        // 1. Check for known deprecated/dangerous packages
        if (DANGEROUS_PACKAGES[name]) {
          context.addFinding({
            type: "dependency-audit",
            severity: "high",
            line: 1,
            column: 1,
            message: `Vulnerable/Deprecated dependency detected: "${name}"`,
            code: `"${name}": "${version}"`,
            remediation: DANGEROUS_PACKAGES[name],
          });
        }

        // 2. Check for suspicious package names (Potential Typosquatting)
        if (
          name.includes("googl-") ||
          name.includes("amazn-") ||
          name.includes("gemini-ai-scam")
        ) {
          context.addFinding({
            type: "dependency-audit",
            severity: "critical",
            line: 1,
            column: 1,
            message: `Potential typosquatting or malicious package name detected: "${name}"`,
            code: `"${name}": "${version}"`,
            remediation: "Verify the package name and ownership on npmjs.com.",
          });
        }
      }
    } catch (e) {
      // Ignore parse errors for malformed package.json
    }
  },
};
