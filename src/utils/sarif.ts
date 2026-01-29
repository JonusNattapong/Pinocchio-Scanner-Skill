import { relative } from "node:path";
import type { ScanResult, SecurityFinding } from "../types.js";

/**
 * Generates a SARIF (Static Analysis Results Interchange Format) report from ScanResult.
 * This can be uploaded to GitHub Security tab.
 */
export function generateSARIF(result: ScanResult) {
  return {
    $schema:
      "https://schemastore.azurewebsites.net/schemas/json/sarif-2.1.0-rtm.5.json",
    version: "2.1.0",
    runs: [
      {
        tool: {
          driver: {
            name: "Skill-Scanner",
            version: "1.0.0",
            informationUri: "https://github.com/JonusNattapong/Skill-Scanner",
            rules: generateRules(result.findings),
          },
        },
        results: result.findings.map(mapFindingToResult),
      },
    ],
  };
}

function generateRules(findings: SecurityFinding[]) {
  const uniqueTypes = [...new Set(findings.map((f) => f.type))];
  return uniqueTypes.map((type) => ({
    id: type,
    name: type,
    shortDescription: {
      text: `Security vulnerability: ${type}`,
    },
    fullDescription: {
      text: `Detection for ${type} vulnerabilities in AI agent skills.`,
    },
    defaultConfiguration: {
      level: "warning",
    },
    helpUri:
      "https://github.com/JonusNattapong/Skill-Scanner#detected-vulnerabilities",
  }));
}

function mapFindingToResult(finding: SecurityFinding) {
  return {
    ruleId: finding.type,
    level: mapSeverityToLevel(finding.severity),
    message: {
      text: finding.message,
    },
    locations: [
      {
        physicalLocation: {
          artifactLocation: {
            // Use relative path from the current working directory (repo root in CI)
            uri: relative(process.cwd(), finding.filePath).replace(/\\/g, "/"),
          },
          region: {
            startLine: Math.max(1, finding.line),
            startColumn: Math.max(1, finding.column),
          },
        },
      },
    ],
  };
}

function mapSeverityToLevel(severity: string) {
  switch (severity) {
    case "critical":
    case "high":
      return "error";
    case "medium":
      return "warning";
    case "low":
    default:
      return "note";
  }
}
