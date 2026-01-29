export { scanCode, scanFile, scanDirectory } from "./scanner.js";
export type {
  ScanOptions,
  SecurityFinding,
  CheckType,
  CheckContext,
  SecurityCheck,
  ScanResult,
} from "./types.js";

// Also export individual checks for advanced usage
export { commandInjectionCheck } from "./checks/command-injection.js";
export { codeInjectionCheck } from "./checks/code-injection.js";
export { fileSystemCheck } from "./checks/file-system.js";
export { hardcodedSecretsCheck } from "./checks/hardcoded-secrets.js";

// Export utilities
export { parseCode, getNodePosition, extractNodeCode } from "./parser.js";
export { getSeverity, shouldReport } from "./utils/severity.js";
export {
  DANGEROUS_PATTERNS,
  SAFE_PATTERNS,
  isLikelySafeValue,
  containsShellMetacharacters,
} from "./utils/patterns.js";
