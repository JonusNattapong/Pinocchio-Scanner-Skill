import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { SecurityCheck, CheckContext } from "../types.js";

interface CustomRule {
  id: string;
  name: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  patterns: string[];
  remediation: string;
  owaspId?: string;
}

interface RulesFile {
  rules: CustomRule[];
}

// Default rules location
const RULES_PATH = join(process.cwd(), ".skill-scanner", "rules.json");

function loadCustomRules(): CustomRule[] {
  if (!existsSync(RULES_PATH)) {
    return [];
  }

  try {
    const content = readFileSync(RULES_PATH, "utf-8");
    const parsed: RulesFile = JSON.parse(content);
    return parsed.rules || [];
  } catch (e) {
    console.warn(`Warning: Could not parse custom rules from ${RULES_PATH}`);
    return [];
  }
}

export const customRulesCheck: SecurityCheck = {
  name: "cisco-defense", // Reusing cisco-defense as the custom rules category

  check(context: CheckContext): void {
    const rules = loadCustomRules();

    for (const rule of rules) {
      for (const pattern of rule.patterns) {
        const regex = new RegExp(pattern, "gi");
        const matches = context.code.matchAll(regex);

        for (const match of matches) {
          // Find line number
          const beforeMatch = context.code.substring(0, match.index);
          const line = (beforeMatch.match(/\n/g) || []).length + 1;

          context.addFinding({
            type: "cisco-defense",
            severity: rule.severity,
            line,
            column: 1,
            message: `[Custom Rule: ${rule.id}] ${rule.name}`,
            code: match[0].substring(0, 100),
            remediation: rule.remediation,
            metadata: {
              ruleId: rule.id,
              owaspId: rule.owaspId,
              customRule: true,
            },
          });
        }
      }
    }
  },
};
