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
}

export type CheckType =
  | "command-injection"
  | "file-system"
  | "hardcoded-secret"
  | "code-injection";

export interface CheckContext {
  filePath: string;
  code: string;
  lines: string[];
  ast: File;
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
