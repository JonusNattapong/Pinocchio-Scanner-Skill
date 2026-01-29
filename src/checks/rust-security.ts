/**
 * Rust Security Scanner
 * Pattern-based detection for common Rust vulnerabilities
 */

import type { SecurityCheck, CheckContext } from "../types.js";

interface Pattern {
  regex: RegExp;
  message: string;
  severity: "low" | "medium" | "high" | "critical";
  remediation: string;
}

const RUST_DANGEROUS_PATTERNS: Pattern[] = [
  // Command Injection
  {
    regex: /Command::new\s*\([^)]*\)\.arg\s*\([^)]*format!/gi,
    message: "Command with format! macro - potential command injection",
    severity: "critical",
    remediation:
      "Avoid format! in command arguments. Use separate .arg() calls",
  },
  {
    regex: /std::process::Command/gi,
    message: "Process command execution detected - review for injection",
    severity: "medium",
    remediation: "Ensure command arguments are properly sanitized",
  },
  {
    regex: /\.args?\s*\(\s*&?format!/gi,
    message: "Dynamic command argument via format! - potential injection",
    severity: "high",
    remediation: "Sanitize user input before passing to commands",
  },

  // Unsafe Code
  {
    regex: /unsafe\s*\{/gi,
    message: "unsafe block detected - bypasses Rust's safety guarantees",
    severity: "high",
    remediation: "Minimize unsafe usage. Document why it's necessary and safe",
  },
  {
    regex: /#\[no_mangle\]/gi,
    message: "no_mangle attribute may indicate FFI boundary",
    severity: "medium",
    remediation: "Ensure proper input validation at FFI boundaries",
  },

  // Memory Issues
  {
    regex: /std::mem::transmute/gi,
    message: "transmute can cause undefined behavior",
    severity: "high",
    remediation: "Avoid transmute. Use safe conversions like From/Into traits",
  },
  {
    regex: /std::mem::forget/gi,
    message: "mem::forget may cause resource leaks",
    severity: "medium",
    remediation:
      "Use ManuallyDrop if intentional, otherwise ensure proper cleanup",
  },

  // Path Traversal
  {
    regex: /std::fs::(read|write|File::open)\s*\([^)]*format!/gi,
    message: "File operation with dynamic path - potential path traversal",
    severity: "high",
    remediation:
      "Use Path::canonicalize() and validate against allowed directories",
  },

  // SQL (via diesel/sqlx)
  {
    regex: /sql_query\s*\(\s*format!/gi,
    message: "SQL query with format! - potential SQL injection",
    severity: "critical",
    remediation: "Use parameterized queries with bind() or query_as!()",
  },

  // Hardcoded Secrets
  {
    regex: /(api_key|secret|password|token|auth)\s*[:=]\s*["'][^"']{8,}["']/gi,
    message: "Potential hardcoded secret detected",
    severity: "high",
    remediation: "Use std::env::var() or a secrets manager",
  },

  // Crypto Issues
  {
    regex: /use\s+md5|use\s+sha1[^_]/gi,
    message: "Weak hash algorithm (MD5/SHA1) detected",
    severity: "medium",
    remediation: "Use sha2 or blake3 crate for cryptographic hashing",
  },

  // Panic in production
  {
    regex: /\.unwrap\(\)|\.expect\s*\(/gi,
    message: "unwrap()/expect() may cause panic in production",
    severity: "low",
    remediation: "Use proper error handling with ? operator or match",
  },
];

export const rustCheck: SecurityCheck = {
  name: "rust-security",

  check(context: CheckContext): void {
    if (!context.filePath.endsWith(".rs")) {
      return;
    }

    for (const pattern of RUST_DANGEROUS_PATTERNS) {
      const matches = context.code.matchAll(pattern.regex);

      for (const match of matches) {
        const beforeMatch = context.code.substring(0, match.index);
        const line = (beforeMatch.match(/\n/g) || []).length + 1;

        context.addFinding({
          type: "rust-security",
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
