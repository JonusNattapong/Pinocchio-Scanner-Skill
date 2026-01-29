import type { SecurityFinding, ScanResult } from "../types.js";

export interface RiskAssessment {
  score: number; // 0-100
  grade: string; // A, B, C, D, F
  level: "safe" | "low" | "medium" | "high" | "critical";
  breakdown: {
    category: string;
    weight: number;
    count: number;
    contribution: number;
  }[];
  recommendation: string;
}

const SEVERITY_WEIGHTS = {
  critical: 25,
  high: 15,
  medium: 5,
  low: 2,
};

const CATEGORY_WEIGHTS: Record<string, number> = {
  "command-injection": 1.5,
  "code-injection": 1.5,
  "hardcoded-secret": 1.2,
  "semantic-analysis": 1.3,
  "file-system": 1.0,
  "dependency-audit": 1.1,
  "cisco-defense": 1.2,
  "malware-scan": 2.0,
};

export function calculateRiskScore(result: ScanResult): RiskAssessment {
  const { findings, summary } = result;

  // Calculate base penalty from findings
  let totalPenalty = 0;
  const categoryBreakdown: Map<string, { count: number; penalty: number }> =
    new Map();

  for (const finding of findings) {
    const severityWeight = SEVERITY_WEIGHTS[finding.severity] || 5;
    const categoryWeight = CATEGORY_WEIGHTS[finding.type] || 1.0;
    const penalty = severityWeight * categoryWeight;

    totalPenalty += penalty;

    const existing = categoryBreakdown.get(finding.type) || {
      count: 0,
      penalty: 0,
    };
    categoryBreakdown.set(finding.type, {
      count: existing.count + 1,
      penalty: existing.penalty + penalty,
    });
  }

  // Calculate score (100 = perfect, 0 = worst)
  // Use logarithmic scaling to avoid negative scores for high penalty values
  const rawScore = Math.max(0, 100 - totalPenalty);
  const score = Math.round(Math.max(0, Math.min(100, rawScore)));

  // Determine grade
  let grade: string;
  let level: RiskAssessment["level"];
  let recommendation: string;

  if (score >= 90) {
    grade = "A";
    level = "safe";
    recommendation =
      "This skill appears safe for deployment. Continue monitoring for new vulnerabilities.";
  } else if (score >= 75) {
    grade = "B";
    level = "low";
    recommendation =
      "Minor issues detected. Review findings and apply recommended fixes before production use.";
  } else if (score >= 50) {
    grade = "C";
    level = "medium";
    recommendation =
      "Significant vulnerabilities found. Do not deploy until all high/critical issues are resolved.";
  } else if (score >= 25) {
    grade = "D";
    level = "high";
    recommendation =
      "Severe security risks detected. This skill requires immediate security review and remediation.";
  } else {
    grade = "F";
    level = "critical";
    recommendation =
      "CRITICAL: This skill is potentially malicious or extremely vulnerable. Do NOT deploy under any circumstances.";
  }

  // Build breakdown
  const breakdown: RiskAssessment["breakdown"] = [];
  for (const [category, data] of categoryBreakdown) {
    breakdown.push({
      category,
      weight: CATEGORY_WEIGHTS[category] || 1.0,
      count: data.count,
      contribution: Math.round(data.penalty),
    });
  }

  // Sort by contribution (highest first)
  breakdown.sort((a, b) => b.contribution - a.contribution);

  return {
    score,
    grade,
    level,
    breakdown,
    recommendation,
  };
}

export function formatRiskScore(assessment: RiskAssessment): string {
  const gradeColors: Record<string, string> = {
    A: "\x1b[32m", // Green
    B: "\x1b[36m", // Cyan
    C: "\x1b[33m", // Yellow
    D: "\x1b[31m", // Red
    F: "\x1b[41m\x1b[37m", // White on Red BG
  };

  const color = gradeColors[assessment.grade] || "";
  const reset = "\x1b[0m";

  let output = `
${reset}╔════════════════════════════════════════════════════════════╗
║                    RISK ASSESSMENT                         ║
╠════════════════════════════════════════════════════════════╣
║  ${color}SCORE: ${assessment.score}/100   GRADE: ${assessment.grade}   LEVEL: ${assessment.level.toUpperCase()}${reset}
╠════════════════════════════════════════════════════════════╣
`;

  if (assessment.breakdown.length > 0) {
    output += `║  TOP RISK CATEGORIES:                                      ║\n`;
    for (const item of assessment.breakdown.slice(0, 5)) {
      const line =
        `    • ${item.category}: ${item.count} issue(s) (-${item.contribution} pts)`.padEnd(
          58,
        );
      output += `║${line}║\n`;
    }
  }

  output += `╠════════════════════════════════════════════════════════════╣
║  ${assessment.recommendation.substring(0, 58).padEnd(58)}
╚════════════════════════════════════════════════════════════╝`;

  return output;
}
