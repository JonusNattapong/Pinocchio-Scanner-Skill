/**
 * Python Security Scanner
 * Pattern-based detection for common Python vulnerabilities
 */

import type { SecurityCheck, CheckContext } from "../types.js";

interface Pattern {
  regex: RegExp;
  message: string;
  severity: "low" | "medium" | "high" | "critical";
  remediation: string;
}

const PYTHON_DANGEROUS_PATTERNS: Pattern[] = [
  // Command Injection
  {
    regex: /os\.system\s*\(/gi,
    message: "Dangerous use of os.system() - susceptible to command injection",
    severity: "critical",
    remediation:
      "Use subprocess.run() with shell=False and a list of arguments instead",
  },
  {
    regex: /subprocess\.(call|run|Popen)\s*\([^)]*shell\s*=\s*True/gi,
    message: "subprocess with shell=True is vulnerable to command injection",
    severity: "critical",
    remediation: "Set shell=False and pass arguments as a list",
  },
  {
    regex: /os\.popen\s*\(/gi,
    message: "os.popen() is deprecated and vulnerable to injection",
    severity: "high",
    remediation: "Use subprocess.run() with shell=False",
  },

  // Code Injection
  {
    regex: /\beval\s*\(/gi,
    message: "Use of eval() can execute arbitrary code",
    severity: "critical",
    remediation:
      "Avoid eval(). Use ast.literal_eval() for safe literal parsing",
  },
  {
    regex: /\bexec\s*\(/gi,
    message: "Use of exec() can execute arbitrary code",
    severity: "critical",
    remediation: "Avoid exec(). Consider safer alternatives like importlib",
  },
  {
    regex: /compile\s*\([^)]+,\s*[^)]+,\s*['"]exec['"]\)/gi,
    message: "compile() with 'exec' mode can execute arbitrary code",
    severity: "high",
    remediation: "Avoid dynamic code compilation from untrusted sources",
  },

  // Deserialization
  {
    regex: /pickle\.(load|loads)\s*\(/gi,
    message: "pickle deserialization can execute arbitrary code",
    severity: "critical",
    remediation: "Never unpickle data from untrusted sources. Use JSON instead",
  },
  {
    regex: /yaml\.load\s*\([^)]*\)/gi,
    message: "yaml.load() without Loader is unsafe",
    severity: "high",
    remediation: "Use yaml.safe_load() instead",
  },

  // SQL Injection
  {
    regex: /execute\s*\(\s*f['"]/gi,
    message: "Potential SQL injection via f-string in execute()",
    severity: "critical",
    remediation: "Use parameterized queries with ? or %s placeholders",
  },
  {
    regex: /execute\s*\([^)]*%\s*\(/gi,
    message: "Potential SQL injection via % formatting",
    severity: "critical",
    remediation: "Use parameterized queries with ? or %s placeholders",
  },

  // Hardcoded Secrets
  {
    regex: /(api[_-]?key|secret|password|token|auth)\s*=\s*['"][^'"]{8,}['"]/gi,
    message: "Potential hardcoded secret detected",
    severity: "high",
    remediation: "Use environment variables or a secrets manager",
  },

  // Dangerous Imports
  {
    regex: /from\s+ctypes\s+import|import\s+ctypes/gi,
    message: "ctypes usage may indicate low-level system access",
    severity: "medium",
    remediation: "Review ctypes usage for potential security implications",
  },
];

export const pythonCheck: SecurityCheck = {
  name: "python-security",

  check(context: CheckContext): void {
    if (!context.filePath.endsWith(".py")) {
      return;
    }

    for (const pattern of PYTHON_DANGEROUS_PATTERNS) {
      const matches = context.code.matchAll(pattern.regex);

      for (const match of matches) {
        const beforeMatch = context.code.substring(0, match.index);
        const line = (beforeMatch.match(/\n/g) || []).length + 1;

        context.addFinding({
          type: "python-security",
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
