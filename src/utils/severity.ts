import type { CheckType } from "../types.js";

export function getSeverity(
  checkType: CheckType,
  context: string,
): "low" | "medium" | "high" | "critical" {
  switch (checkType) {
    case "command-injection":
      return context.includes("user") || context.includes("input")
        ? "critical"
        : "high";

    case "code-injection":
      return context.includes("eval") || context.includes("Function")
        ? "critical"
        : "high";

    case "file-system":
      return context.includes("write") || context.includes("append")
        ? "high"
        : "medium";

    case "hardcoded-secret":
      if (context.includes("private") || context.includes("key")) {
        return "critical";
      }
      if (context.includes("password") || context.includes("token")) {
        return "high";
      }
      return "medium";

    default:
      return "medium";
  }
}

export function shouldReport(
  severity: "low" | "medium" | "high" | "critical",
  threshold?: "low" | "medium" | "high" | "critical",
): boolean {
  if (!threshold) return true;

  const levels = { low: 0, medium: 1, high: 2, critical: 3 };
  return levels[severity] >= levels[threshold];
}
