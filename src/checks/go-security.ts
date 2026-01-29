/**
 * Go Security Scanner
 * Pattern-based detection for common Go vulnerabilities
 */

import type { SecurityCheck, CheckContext } from "../types.js";

interface Pattern {
  regex: RegExp;
  message: string;
  severity: "low" | "medium" | "high" | "critical";
  remediation: string;
}

const GO_DANGEROUS_PATTERNS: Pattern[] = [
  // Command Injection
  {
    regex: /exec\.Command\s*\(\s*[^,]+\+/gi,
    message:
      "exec.Command with string concatenation - potential command injection",
    severity: "critical",
    remediation:
      "Avoid string concatenation. Pass arguments as separate parameters",
  },
  {
    regex: /exec\.Command\s*\(\s*["'](?:sh|bash|cmd)['"]\s*,\s*["']-c['"]/gi,
    message: "Shell execution via exec.Command - vulnerable to injection",
    severity: "critical",
    remediation:
      "Avoid shell invocation. Use exec.Command directly with the binary",
  },
  {
    regex: /os\/exec/gi,
    message: "os/exec package imported - review for command injection",
    severity: "medium",
    remediation: "Ensure all command arguments are properly sanitized",
  },

  // SQL Injection
  {
    regex: /fmt\.Sprintf\s*\([^)]*SELECT|INSERT|UPDATE|DELETE/gi,
    message: "Potential SQL injection via fmt.Sprintf",
    severity: "critical",
    remediation: "Use parameterized queries with database/sql",
  },
  {
    regex: /db\.(Query|Exec)\s*\([^)]*\+/gi,
    message: "SQL query with string concatenation - potential injection",
    severity: "critical",
    remediation: "Use prepared statements with ? placeholders",
  },

  // Path Traversal
  {
    regex: /os\.Open\s*\([^)]*\+/gi,
    message: "File open with dynamic path - potential path traversal",
    severity: "high",
    remediation:
      "Use filepath.Clean() and validate paths against a base directory",
  },
  {
    regex: /ioutil\.ReadFile\s*\([^)]*\+/gi,
    message: "ReadFile with dynamic path - potential path traversal",
    severity: "high",
    remediation: "Use filepath.Clean() and validate paths",
  },

  // Hardcoded Secrets
  {
    regex: /(apiKey|secret|password|token|auth)\s*:?=\s*["'][^"']{8,}["']/gi,
    message: "Potential hardcoded secret detected",
    severity: "high",
    remediation: "Use environment variables via os.Getenv()",
  },

  // Unsafe HTTP
  {
    regex: /http\.Get\s*\([^)]*\+/gi,
    message: "HTTP request with dynamic URL - potential SSRF",
    severity: "high",
    remediation: "Validate and sanitize URLs before making requests",
  },

  // Crypto Issues
  {
    regex: /crypto\/md5|crypto\/sha1/gi,
    message: "Weak hash algorithm (MD5/SHA1) detected",
    severity: "medium",
    remediation: "Use crypto/sha256 or stronger for security purposes",
  },

  // Unsafe Pointer
  {
    regex: /unsafe\.Pointer/gi,
    message: "unsafe.Pointer usage may bypass Go's memory safety",
    severity: "medium",
    remediation:
      "Avoid unsafe package unless absolutely necessary. Review carefully",
  },
];

export const goCheck: SecurityCheck = {
  name: "go-security",

  check(context: CheckContext): void {
    if (!context.filePath.endsWith(".go")) {
      return;
    }

    for (const pattern of GO_DANGEROUS_PATTERNS) {
      const matches = context.code.matchAll(pattern.regex);

      for (const match of matches) {
        const beforeMatch = context.code.substring(0, match.index);
        const line = (beforeMatch.match(/\n/g) || []).length + 1;

        context.addFinding({
          type: "go-security",
          severity: pattern.severity,
          line,
          column: 1,
          message: pattern.message,
          code: match[0],
          remediation: pattern.remediation,
        });
      }
    }
  },
};
