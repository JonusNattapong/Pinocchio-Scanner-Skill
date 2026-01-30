#!/usr/bin/env node
import "dotenv/config";

import { resolve, relative, join } from "path";
import { mkdir, writeFile, stat } from "fs/promises";
import { scanFile, scanDirectory } from "./scanner.js";
import { generateSARIF } from "./utils/sarif.js";
import { calculateRiskScore, formatRiskScore } from "./utils/risk-score.js";
import { mapToOWASP, OWASP_LLM_TOP_10 } from "./utils/owasp.js";
import type {
  SecurityFinding,
  ScanResult,
  ScanOptions,
  CheckType,
} from "./types.js";
import { existsSync } from "fs";

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

  // Add OWASP mapping
  const owaspIds = mapToOWASP(finding.type, finding.message);
  if (owaspIds.length > 0) {
    const owaspStr = owaspIds.map((id) => `${id}`).join(", ");
    lines.push(
      colorize(`│`, colors.dim) +
        colorize(` 🏷️  OWASP: ${owaspStr}`, colors.magenta),
    );
  }

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
    // Present remediation as a copyable multi-line code suggestion
    lines.push(colorize(`│`, colors.dim));
    lines.push(
      colorize(`│`, colors.dim) +
        colorize(` 💡 Secure Suggestion (copy-paste):`, colors.green),
    );
    lines.push(colorize(`│`, colors.dim));

    const remediationLines = finding.remediation.split("\n");
    remediationLines.forEach((rLine) => {
      // Print remediation lines without ANSI color codes so they can be copied cleanly
      lines.push(`│   ${rLine}`);
    });
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

  // Add Risk Score
  const riskAssessment = calculateRiskScore(result);
  lines.push(formatRiskScore(riskAssessment));

  return lines.join("\n");
}

function printHelp(): void {
  console.log(`
${colorize("pinocchio-scan", colors.bold + colors.cyan)} - Security Scanner for Agent Skill Files

${colorize("USAGE:", colors.bold)}
  pinocchio-scan <path> [options]

${colorize("ARGUMENTS:", colors.bold)}
  <path>              Path to file or directory to scan

${colorize("OPTIONS:", colors.bold)}
  -h, --help          Show this help message
  -v, --verbose       Show verbose output including errors
  --report            Auto-export a timestamped JSON report to reports/
  --sarif             Auto-export a SARIF report for GitHub Security
  --tui               Launch interactive TUI mode
  --severity <level>  Minimum severity to report (low, medium, high, critical)
  --checks <types>    Comma-separated list of checks to run:
                      command-injection, file-system, hardcoded-secret, code-injection,
                      semantic-analysis, malware-scan, cisco-defense, dependency-audit
  --ignore <patterns> Comma-separated glob patterns to ignore
  --fix               Enable auto-remediation suggestions (experimental)
  --provider <name>   AI Provider (openrouter*, gemini, opencode, molt, openai)
  --web-search        Enable AI web search capability (if supported)

${colorize("EXAMPLES:", colors.bold)}
  pinocchio-scan ./src
  pinocchio-scan ./skills --severity high
  pinocchio-scan ./agent --checks command-injection,hardcoded-secret
  pinocchio-scan ./project --json > report.json

${colorize("DETECTED VULNERABILITIES:", colors.bold)}
  • ${colorize("Command Injection", colors.red)}    - Unsafe shell command execution
  • ${colorize("Code Injection", colors.red)}       - Dynamic code execution (eval, Function)
  • ${colorize("Hardcoded Secrets", colors.yellow)}   - API keys, passwords, tokens in code
  • ${colorize("File System", colors.yellow)}         - Unsafe file operations, path traversal
  • ${colorize("Semantic Analysis", colors.magenta)}   - LLM-assisted intent analysis
  • ${colorize("Malware Scan", colors.bgRed)}        - VirusTotal malware database check
  • ${colorize("Cisco AI Defense", colors.cyan)}     - Cisco security framework inspection
  • ${colorize("Prompt Injection", colors.magenta)}   - Detection of jailbreak patterns (AI Scan)
  • ${colorize("Dependency Audit", colors.yellow)}    - Scan for vulnerable packages in package.json
`);
}

function parseArgs(args: string[]): {
  path?: string;
  options: ScanOptions;
  json: boolean;
  sarif: boolean;
  report: boolean;
  help: boolean;
  fix: boolean;
  tui: boolean;
} {
  const result: {
    path?: string;
    options: ScanOptions;
    json: boolean;
    sarif: boolean;
    report: boolean;
    help: boolean;
    fix: boolean;
    tui: boolean;
  } = {
    options: {},
    json: false,
    sarif: false,
    report: false,
    help: false,
    fix: false,
    tui: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "-h" || arg === "--help") {
      result.help = true;
    } else if (arg === "-v" || arg === "--verbose") {
      result.options.verbose = true;
    } else if (arg === "--json") {
      result.json = true;
    } else if (arg === "--tui") {
      result.tui = true;
    } else if (arg === "--sarif") {
      result.sarif = true;
    } else if (arg === "--report") {
      result.report = true;
    } else if (arg === "--fix") {
      result.fix = true;
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
    } else if (arg === "--provider" && args[i + 1]) {
      result.options.aiProvider = args[++i];
    } else if (arg === "--model" && args[i + 1]) {
      result.options.aiModel = args[++i];
    } else if (arg === "--web-search") {
      result.options.webSearch = true;
    } else if (!arg.startsWith("-") && !result.path) {
      result.path = arg;
    }
  }

  return result;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const {
    path: targetPath,
    options: rawOptions,
    json,
    sarif,
    report,
    help,
    fix,
    tui,
  } = parseArgs(args);

  if (help || (!targetPath && !tui)) {
    printHelp();
    process.exit(help ? 0 : 1);
  }

  if (tui) {
    const { startTui } = await import("./tui/index.js");
    startTui({
      initialPath: targetPath,
      initialOptions: rawOptions,
      json,
      report,
      sarif,
    });
    return;
  }

  const options: ScanOptions = { ...rawOptions, fix };

  const absolutePath = resolve(process.cwd(), targetPath ?? ".");

  try {
    // Check if it's a file or directory
    const stats = await stat(absolutePath);

    if (!json) {
      console.log("");
      console.log(colorize("🔒 pinocchio-scan", colors.bold + colors.cyan));
      console.log(colorize(`   Scanning: ${absolutePath}`, colors.dim));
      if (fix) {
        console.log(
          colorize(
            `   Auto-remediation: ${colorize("ENABLED", colors.green + colors.bold)} (Experimental)`,
            colors.dim,
          ),
        );
      }
      if (options.aiProvider) {
        console.log(
          colorize(
            `   AI Provider: ${colorize(options.aiProvider, colors.magenta + colors.bold)}`,
            colors.dim,
          ),
        );
      }
      if (options.webSearch) {
        console.log(
          colorize(
            `   Web Search: ${colorize("ENABLED", colors.blue + colors.bold)}`,
            colors.dim,
          ),
        );
      }
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

      // Auto-export report if requested
      if (report) {
        const reportDir = resolve(process.cwd(), "reports");
        if (!existsSync(reportDir)) {
          await mkdir(reportDir, { recursive: true });
        }
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const reportPath = join(reportDir, `scan-report-${timestamp}.json`);
        await writeFile(reportPath, JSON.stringify(result, null, 2));
        if (!json) {
          console.log(
            `\n📄 Report auto-exported to: ${colorize(reportPath, colors.cyan)}`,
          );
        }
      }

      // Auto-export SARIF if requested
      if (sarif) {
        const reportDir = resolve(process.cwd(), "reports");
        if (!existsSync(reportDir)) {
          await mkdir(reportDir, { recursive: true });
        }
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const sarifPath = join(reportDir, `scan-results-${timestamp}.sarif`);
        const sarifData = generateSARIF(result);
        await writeFile(sarifPath, JSON.stringify(sarifData, null, 2));
        if (!json) {
          console.log(
            `\n🛡️  SARIF report exported to: ${colorize(sarifPath, colors.cyan)} (Ready for GitHub upload)`,
          );
        }
      }

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
