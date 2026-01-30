import { readFile } from "fs/promises";
import { readdir } from "fs/promises";
import { join, extname } from "path";
import type {
  ScanOptions,
  SecurityFinding,
  CheckContext,
  SecurityCheck,
  CheckType,
  ScanResult,
} from "./types.js";
import { parseCode } from "./parser.js";
import { commandInjectionCheck } from "./checks/command-injection.js";
import { codeInjectionCheck } from "./checks/code-injection.js";
import { fileSystemCheck } from "./checks/file-system.js";
import { hardcodedSecretsCheck } from "./checks/hardcoded-secrets.js";
import { shouldReport } from "./utils/severity.js";
import { generateRemediation } from "./remediation.js";

import { semanticAnalysisCheck } from "./checks/semantic-analysis.js";
import { virusTotalCheck } from "./checks/virus-total.js";
import { nodesecureCheck } from "./checks/nodesecure.js";
import { agentSkillCheck } from "./checks/agent-skill.js";
import { dependencyAuditCheck } from "./checks/dependency-audit.js";
import { mcpScannerCheck } from "./checks/mcp-scanner.js";

// Multi-language support
import { pythonCheck } from "./checks/python-security.js";
import { goCheck } from "./checks/go-security.js";
import { rustCheck } from "./checks/rust-security.js";

const ALL_CHECKS: SecurityCheck[] = [
  commandInjectionCheck,
  codeInjectionCheck,
  fileSystemCheck,
  hardcodedSecretsCheck,
  semanticAnalysisCheck,
  mcpScannerCheck,
  virusTotalCheck,
  nodesecureCheck,
  agentSkillCheck,
  dependencyAuditCheck,
  // Multi-language checks
  pythonCheck,
  goCheck,
  rustCheck,
];

const DEFAULT_IGNORE_PATTERNS = [
  "node_modules",
  "dist",
  "build",
  ".git",
  "*.test.ts",
  "*.test.js",
  "*.spec.ts",
  "*.spec.js",
];

export async function scanCode(
  code: string,
  options: ScanOptions = {},
  filePath = "<inline>",
): Promise<SecurityFinding[]> {
  const findings: SecurityFinding[] = [];

  let parsed;
  try {
    parsed = parseCode(code);
  } catch (err) {
    // If parsing fails (e.g. Markdown file), we still want to run non-AST checks
    parsed = {
      lines: code.split("\n"),
      ast: undefined,
    };
  }

  const context: CheckContext = {
    filePath,
    code,
    lines: parsed.lines,
    ast: parsed.ast,
    addFinding: (finding) => {
      if (shouldReport(finding.severity, options.severityThreshold)) {
        findings.push({
          ...finding,
          filePath,
        });
      }
    },
  };

  const checkTypes = options.checks || ALL_CHECKS.map((c) => c.name);
  for (const check of ALL_CHECKS) {
    if (checkTypes.includes(check.name)) {
      try {
        // Supports both sync and async checks
        await Promise.resolve(check.check(context, options));
      } catch (err) {
        // Log error but continue with other checks
        if (options.verbose) {
          console.error(`Error in check ${check.name}:`, err);
        }
      }
    }
  }

  // If the fix option is enabled, generate remediations for the findings.
  if (options.fix) {
    for (const finding of findings) {
      finding.remediation = await generateRemediation(finding, options);
    }
  }

  return findings;
}

export async function scanFile(
  filePath: string,
  options: ScanOptions = {},
): Promise<SecurityFinding[]> {
  try {
    const code = await readFile(filePath, "utf-8");
    return await scanCode(code, options, filePath);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error(`File not found: ${filePath}`);
    }
    throw err;
  }
}

export async function scanDirectory(
  dirPath: string,
  options: ScanOptions = {},
): Promise<ScanResult> {
  const findings: SecurityFinding[] = [];
  const ignorePatterns = options.ignorePatterns || DEFAULT_IGNORE_PATTERNS;
  let totalFiles = 0;
  const filesWithIssues = new Set<string>();

  async function scanRecursive(currentPath: string): Promise<void> {
    const entries = await readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(currentPath, entry.name);

      // Check if should ignore
      if (shouldIgnore(entry.name, ignorePatterns)) {
        continue;
      }

      if (entry.isDirectory()) {
        await scanRecursive(fullPath);
      } else if (entry.isFile() && isScanableFile(entry.name)) {
        totalFiles++;
        try {
          const fileFindings = await scanFile(fullPath, options);
          if (fileFindings.length > 0) {
            filesWithIssues.add(fullPath);
            findings.push(...fileFindings);
          }
        } catch (err) {
          // Log error but continue scanning other files
          if (options.verbose) {
            console.error(`Error scanning ${fullPath}:`, err);
          }
        }
      }
    }
  }

  await scanRecursive(dirPath);

  // Calculate summary
  const summary = {
    totalFiles,
    filesWithIssues: filesWithIssues.size,
    criticalCount: findings.filter((f) => f.severity === "critical").length,
    highCount: findings.filter((f) => f.severity === "high").length,
    mediumCount: findings.filter((f) => f.severity === "medium").length,
    lowCount: findings.filter((f) => f.severity === "low").length,
  };

  return {
    findings,
    summary,
    scannedAt: new Date(),
  };
}

function shouldIgnore(name: string, patterns: string[]): boolean {
  for (const pattern of patterns) {
    // Simple glob-like matching
    if (pattern.includes("*")) {
      const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
      if (regex.test(name)) return true;
    } else {
      if (name === pattern || name.includes(pattern)) return true;
    }
  }
  return false;
}

function isScanableFile(fileName: string): boolean {
  const ext = extname(fileName);
  return [
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".mjs",
    ".cjs",
    ".md",
    ".py", // Python
    ".go", // Go
    ".rs", // Rust
  ].includes(ext);
}

// Re-export types
export type { ScanOptions, SecurityFinding, CheckType, ScanResult };
