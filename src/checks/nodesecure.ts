import { AstAnalyser } from "@nodesecure/js-x-ray";
import type { SecurityCheck, CheckContext } from "../types.js";

export const nodesecureCheck: SecurityCheck = {
  name: "code-injection",

  check(context: CheckContext): void {
    const analyser = new AstAnalyser();
    try {
      // js-x-ray handles JS better, so for TS we try to strip types or just rely on the parser
      let codeToAnalyse = context.code;
      if (
        context.filePath.endsWith(".ts") ||
        context.filePath.endsWith(".tsx")
      ) {
        // Very crude type stripping - remove ': string', ': any', etc.
        codeToAnalyse = context.code.replace(/:\s*[a-zA-Z<>\[\]]+/g, "");
      }

      const result = analyser.analyse(codeToAnalyse);

      // js-x-ray findings
      for (const warning of result.warnings) {
        context.addFinding({
          type: "code-injection",
          severity: warning.kind === "obfuscated-code" ? "high" : "medium",
          line: 1,
          column: 1,
          message: `[NodeSecure] ${warning.kind}: ${warning.value || ""}`,
          code: `NodeSecure detection: ${warning.kind}`,
          remediation:
            "Review the usage of sensitive APIs or obfuscated code segments identified by NodeSecure.",
          metadata: {
            kind: warning.kind,
          },
        });
      }
    } catch (err) {
      // If js-x-ray fails to parse (e.g. complex TS), we just skip it
    }
  },
};
