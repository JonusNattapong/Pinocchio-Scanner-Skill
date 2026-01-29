import type { File } from "@babel/types";

export interface ScanOptions {
  checks?: CheckType[];
  ignorePatterns?: string[];
  severityThreshold?: "low" | "medium" | "high" | "critical";
  verbose?: boolean;
}

export interface SecurityFinding {
  type: CheckType;
  severity: "low" | "medium" | "high" | "critical";
  filePath: string;
  line: number;
  column: number;
  message: string;
  code: string;
  remediation: string;
  context?: string; // Additional context (e.g., LLM reasoning)
  metadata?: Record<string, any>; // For extra data like VirusTotal links or Cisco rule IDs
}

export type CheckType =
  | "command-injection"
  | "file-system"
  | "hardcoded-secret"
  | "code-injection"
  | "semantic-analysis" // LLM-based intent analysis
  | "malware-scan" // VirusTotal integration
  | "cisco-defense" // Cisco Framework compliance
  | "dependency-audit" // CVE/Audit for dependencies
  // Multi-language support
  | "python-security"
  | "go-security"
  | "rust-security";

export interface CheckContext {
  filePath: string;
  code: string;
  lines: string[];
  ast?: File;
  addFinding(finding: Omit<SecurityFinding, "filePath">): void;
}

export interface SecurityCheck {
  name: CheckType;
  check(context: CheckContext): void;
}

export interface ScanResult {
  findings: SecurityFinding[];
  summary: {
    totalFiles: number;
    filesWithIssues: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
  };
  scannedAt: Date;
}
