#!/usr/bin/env node

import { resolve, relative } from "path";
import { scanFile, scanDirectory } from "./scanner.js";
import type {
  SecurityFinding,
  ScanResult,
  ScanOptions,
  CheckType,
} from "./types.js";

// ANSI color codes
const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  bgRed: "\x1b[41m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",
};

function colorize(text: string, ...codes: string[]): string {
  return codes.join("") + text + colors.reset;
}

function getSeverityColor(severity: string): string {
  switch (severity) {
    case "critical":
      return colors.bgRed + colors.white;
    case "high":
      return colors.red;
    case "medium":
      return colors.yellow;
    case "low":
      return colors.blue;
    default:
      return "";
  }
}

function formatFinding(finding: SecurityFinding, basePath: string): string {
  const relativePath = relative(basePath, finding.filePath);
  const severityColor = getSeverityColor(finding.severity);

  const lines: string[] = [
    "",
    colorize(
      `┌─ ${finding.severity.toUpperCase()}`,
      severityColor,
      colors.bold,
    ) + colorize(` [${finding.type}]`, colors.dim),
    colorize(`│`, colors.dim) +
      ` ${colorize(relativePath, colors.cyan)}:${finding.line}:${finding.column}`,
    colorize(`│`, colors.dim),
    colorize(`│`, colors.dim) + ` ${colorize(finding.message, colors.bold)}`,
  ];

  if (finding.code) {
    lines.push(colorize(`│`, colors.dim));
    const codeLines = finding.code.split("\n").slice(0, 3);
    codeLines.forEach((codeLine, idx) => {
      const lineNum = finding.line + idx;
      lines.push(
        colorize(`│`, colors.dim) +
          colorize(` ${lineNum.toString().padStart(4)} │ `, colors.dim) +
          codeLine,
      );
    });
    if (finding.code.split("\n").length > 3) {
      lines.push(
        colorize(`│`, colors.dim) +
          colorize(`        ... (truncated)`, colors.dim),
      );
    }
  }

  if (finding.remediation) {
    lines.push(colorize(`│`, colors.dim));
    lines.push(
      colorize(`│`, colors.dim) +
        colorize(` 💡 ${finding.remediation}`, colors.green),
    );
  }

  lines.push(colorize(`└${"─".repeat(60)}`, colors.dim));

  return lines.join("\n");
}

function formatSummary(result: ScanResult): string {
  const { summary } = result;
  const totalIssues =
    summary.criticalCount +
    summary.highCount +
    summary.mediumCount +
    summary.lowCount;

  const lines: string[] = [
    "",
    colorize("═".repeat(62), colors.dim),
    colorize("  SCAN SUMMARY", colors.bold),
    colorize("═".repeat(62), colors.dim),
    "",
    `  📁 Files scanned: ${colorize(summary.totalFiles.toString(), colors.cyan)}`,
    `  📄 Files with issues: ${colorize(summary.filesWithIssues.toString(), summary.filesWithIssues > 0 ? colors.yellow : colors.green)}`,
    `  🔍 Total findings: ${colorize(totalIssues.toString(), totalIssues > 0 ? colors.yellow : colors.green)}`,
    "",
  ];

  if (totalIssues > 0) {
    lines.push("  By severity:");
    if (summary.criticalCount > 0) {
      lines.push(
        `    ${colorize("● CRITICAL:", colors.bgRed + colors.white)} ${summary.criticalCount}`,
      );
    }
    if (summary.highCount > 0) {
      lines.push(`    ${colorize("● HIGH:", colors.red)} ${summary.highCount}`);
    }
    if (summary.mediumCount > 0) {
      lines.push(
        `    ${colorize("● MEDIUM:", colors.yellow)} ${summary.mediumCount}`,
      );
    }
    if (summary.lowCount > 0) {
      lines.push(`    ${colorize("● LOW:", colors.blue)} ${summary.lowCount}`);
    }
  } else {
    lines.push(
      colorize("  ✅ No security issues found!", colors.green + colors.bold),
    );
  }

  lines.push("");
  lines.push(`  ⏱️  Scan completed at: ${result.scannedAt.toISOString()}`);
  lines.push(colorize("═".repeat(62), colors.dim));

  return lines.join("\n");
}

function printHelp(): void {
  console.log(`
${colorize("Skill Scanner", colors.bold + colors.cyan)} - Security Scanner for Agent Skill Files

${colorize("USAGE:", colors.bold)}
  skill-scanner <path> [options]

${colorize("ARGUMENTS:", colors.bold)}
  <path>              Path to file or directory to scan

${colorize("OPTIONS:", colors.bold)}
  -h, --help          Show this help message
  -v, --verbose       Show verbose output including errors
  --json              Output results as JSON
  --severity <level>  Minimum severity to report (low, medium, high, critical)
  --checks <types>    Comma-separated list of checks to run:
                      command-injection, file-system, hardcoded-secret, code-injection
  --ignore <patterns> Comma-separated glob patterns to ignore

${colorize("EXAMPLES:", colors.bold)}
  skill-scanner ./src
  skill-scanner ./skills --severity high
  skill-scanner ./agent --checks command-injection,hardcoded-secret
  skill-scanner ./project --json > report.json

${colorize("DETECTED VULNERABILITIES:", colors.bold)}
  • ${colorize("Command Injection", colors.red)}    - Unsafe shell command execution
  • ${colorize("Code Injection", colors.red)}       - Dynamic code execution (eval, Function)
  • ${colorize("Hardcoded Secrets", colors.yellow)}   - API keys, passwords, tokens in code
  • ${colorize("File System", colors.yellow)}         - Unsafe file operations, path traversal
`);
}

function parseArgs(args: string[]): {
  path?: string;
  options: ScanOptions;
  json: boolean;
  help: boolean;
} {
  const result: {
    path?: string;
    options: ScanOptions;
    json: boolean;
    help: boolean;
  } = {
    options: {},
    json: false,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "-h" || arg === "--help") {
      result.help = true;
    } else if (arg === "-v" || arg === "--verbose") {
      result.options.verbose = true;
    } else if (arg === "--json") {
      result.json = true;
    } else if (arg === "--severity" && args[i + 1]) {
      const level = args[++i] as "low" | "medium" | "high" | "critical";
      if (["low", "medium", "high", "critical"].includes(level)) {
        result.options.severityThreshold = level;
      }
    } else if (arg === "--checks" && args[i + 1]) {
      const checks = args[++i].split(",") as CheckType[];
      result.options.checks = checks;
    } else if (arg === "--ignore" && args[i + 1]) {
      result.options.ignorePatterns = args[++i].split(",");
    } else if (!arg.startsWith("-")) {
      result.path = arg;
    }
  }

  return result;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const { path: targetPath, options, json, help } = parseArgs(args);

  if (help || !targetPath) {
    printHelp();
    process.exit(help ? 0 : 1);
  }

  const absolutePath = resolve(process.cwd(), targetPath);

  try {
    // Check if it's a file or directory
    const { stat } = await import("fs/promises");
    const stats = await stat(absolutePath);

    if (!json) {
      console.log("");
      console.log(colorize("🔒 Skill Scanner", colors.bold + colors.cyan));
      console.log(colorize(`   Scanning: ${absolutePath}`, colors.dim));
      console.log("");
    }

    if (stats.isFile()) {
      const findings = await scanFile(absolutePath, options);

      if (json) {
        console.log(
          JSON.stringify({ findings, scannedAt: new Date() }, null, 2),
        );
      } else {
        findings.forEach((f) => console.log(formatFinding(f, process.cwd())));
        console.log(`\nFound ${findings.length} issue(s)`);
      }

      process.exit(
        findings.some((f) => f.severity === "critical" || f.severity === "high")
          ? 1
          : 0,
      );
    } else if (stats.isDirectory()) {
      const result = await scanDirectory(absolutePath, options);

      if (json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        result.findings.forEach((f) =>
          console.log(formatFinding(f, process.cwd())),
        );
        console.log(formatSummary(result));
      }

      const hasHighSeverity =
        result.summary.criticalCount > 0 || result.summary.highCount > 0;
      process.exit(hasHighSeverity ? 1 : 0);
    }
  } catch (err) {
    if (json) {
      console.log(JSON.stringify({ error: String(err) }, null, 2));
    } else {
      console.error(
        colorize(
          `Error: ${err instanceof Error ? err.message : String(err)}`,
          colors.red,
        ),
      );
    }
    process.exit(2);
  }
}

main();
