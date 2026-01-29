import type {
  Node,
  VariableDeclarator,
  ObjectProperty,
  AssignmentExpression,
} from "@babel/types";
import traverse, { type NodePath } from "../utils/traverse.js";
import type { SecurityCheck, CheckContext } from "../types.js";
import {
  DANGEROUS_PATTERNS,
  SAFE_PATTERNS,
  isLikelySafeValue,
} from "../utils/patterns.js";
import { getNodePosition, extractNodeCode } from "../parser.js";

function reportFinding(
  node: Node,
  name: string,
  type: string,
  severity: "low" | "medium" | "high" | "critical",
  context: CheckContext,
  customMessage?: string,
): void {
  const pos = getNodePosition(node);
  const code = extractNodeCode(node, context.lines);

  context.addFinding({
    type: "hardcoded-secret",
    severity,
    line: pos.line,
    column: pos.column,
    message: customMessage || `Hardcoded ${type} detected: "${name}"`,
    code,
    remediation:
      "Use environment variables or a secure secrets manager. Never commit secrets to source control.",
  });
}

function checkIdentifierAndValue(
  name: string,
  value: string,
  node: Node,
  context: CheckContext,
): void {
  // Skip test/mock values
  if (isLikelySafeValue(value)) return;

  // Skip environment variable accesses
  const nodePos = getNodePosition(node);
  const sliceStart = Math.max(0, nodePos.column - 50);
  if (
    SAFE_PATTERNS.envAccess.test(context.code.slice(sliceStart, nodePos.column))
  ) {
    return;
  }

  const lowerName = name.toLowerCase();

  // Check for various secret patterns in the identifier name
  const checks = [
    { pattern: /api[_-]?key/, type: "API key", severity: "high" as const },
    {
      pattern: /api[_-]?secret/,
      type: "API secret",
      severity: "high" as const,
    },
    {
      pattern: /^password$|^passwd$/,
      type: "password",
      severity: "high" as const,
    },
    { pattern: /secret/, type: "secret", severity: "medium" as const },
    { pattern: /token/, type: "token", severity: "high" as const },
    { pattern: /auth/, type: "auth credential", severity: "high" as const },
    { pattern: /credential/, type: "credential", severity: "high" as const },
    {
      pattern: /private[_-]?key/,
      type: "private key",
      severity: "critical" as const,
    },
  ];

  for (const check of checks) {
    if (check.pattern.test(lowerName)) {
      reportFinding(node, name, check.type, check.severity, context);
      return;
    }
  }

  // Check if the value looks like a secret (long alphanumeric string)
  if (value.length >= 16 && /^[a-zA-Z0-9_\-/+]+$/.test(value)) {
    // Check AWS key format
    if (/^AKIA[0-9A-Z]{16}$/.test(value)) {
      reportFinding(node, name, "AWS access key", "critical", context);
      return;
    }

    // Check GitHub token format
    if (/^gh[pousr]_[a-zA-Z0-9_]{36,}$/.test(value)) {
      reportFinding(node, name, "GitHub token", "critical", context);
      return;
    }

    // Generic high-entropy string in a suspicious variable
    if (/(key|secret|token|auth)/.test(lowerName)) {
      reportFinding(node, name, "potential credential", "medium", context);
    }
  }
}

function checkIdentifierForSecretPattern(
  name: string,
  node: Node,
  context: CheckContext,
): void {
  const lowerName = name.toLowerCase();

  // Flag if it's a template literal for something that looks like a secret variable
  if (/(api[_-]?key|password|secret|token|auth|credential)/.test(lowerName)) {
    reportFinding(
      node,
      name,
      "potential dynamic secret",
      "low",
      context,
      "Template literal used for secret-like variable - ensure this does not construct secrets from untrusted input",
    );
  }
}

function scanWithRegex(context: CheckContext): void {
  const { code, addFinding } = context;
  const lines = code.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Skip comments
    const codeOnly = line.replace(/\/\/.*$/, "").replace(/\/\*.*\*\//, "");

    // Check for private keys
    for (const pattern of DANGEROUS_PATTERNS.secrets.privateKeyPatterns) {
      const match = codeOnly.match(pattern);
      if (match) {
        const column = line.indexOf(match[0]);

        addFinding({
          type: "hardcoded-secret",
          severity: "critical",
          line: lineNum,
          column,
          message: "Private key detected",
          code: match[0],
          remediation:
            "Remove private keys from source code. Use environment variables or a secrets manager.",
        });
      }
    }

    // Check for AWS keys
    for (const pattern of DANGEROUS_PATTERNS.secrets.awsPatterns) {
      const match = codeOnly.match(pattern);
      if (match && !isLikelySafeValue(match[0])) {
        const column = line.indexOf(match[0]);

        addFinding({
          type: "hardcoded-secret",
          severity: "critical",
          line: lineNum,
          column,
          message: "AWS credential pattern detected",
          code: match[0],
          remediation:
            "Use AWS credential files or environment variables. Never hardcode AWS credentials.",
        });
      }
    }

    // Check for GitHub tokens
    for (const pattern of DANGEROUS_PATTERNS.secrets.githubPatterns) {
      const match = codeOnly.match(pattern);
      if (match && !isLikelySafeValue(match[0])) {
        const column = line.indexOf(match[0]);

        addFinding({
          type: "hardcoded-secret",
          severity: "critical",
          line: lineNum,
          column,
          message: "GitHub token pattern detected",
          code: match[0],
          remediation:
            "Use environment variables or GitHub CLI for authentication. Never hardcode tokens.",
        });
      }
    }
  }
}

export const hardcodedSecretsCheck: SecurityCheck = {
  name: "hardcoded-secret",

  check(context: CheckContext): void {
    const { ast, code } = context;

    if (!ast) {
      // Run regex-based scans for patterns found in raw content (e.g., Markdown)
      scanWithRegex(context);
      return;
    }

    // Check for variable assignments that might be secrets
    traverse(ast!, {
      // Check variable declarations like const apiKey = "..."
      VariableDeclarator(path: NodePath<VariableDeclarator>) {
        const id = path.node.id;
        const init = path.node.init;

        if (id.type === "Identifier" && init?.type === "StringLiteral") {
          checkIdentifierAndValue(id.name, init.value, init, context);
        }

        // Check template literals with expressions (potential dynamic secrets)
        if (id.type === "Identifier" && init?.type === "TemplateLiteral") {
          checkIdentifierForSecretPattern(id.name, init, context);
        }
      },

      // Check object properties like { apiKey: "..." }
      ObjectProperty(path: NodePath<ObjectProperty>) {
        const key = path.node.key;
        const value = path.node.value;

        if (key.type === "Identifier" && value.type === "StringLiteral") {
          checkIdentifierAndValue(key.name, value.value, value, context);
        }

        if (key.type === "StringLiteral" && value.type === "StringLiteral") {
          checkIdentifierAndValue(key.value, value.value, value, context);
        }
      },

      // Check assignment expressions
      AssignmentExpression(path: NodePath<AssignmentExpression>) {
        const left = path.node.left;
        const right = path.node.right;

        if (left.type === "Identifier" && right.type === "StringLiteral") {
          checkIdentifierAndValue(left.name, right.value, right, context);
        }

        // Check member expressions like config.apiKey = "..."
        if (
          left.type === "MemberExpression" &&
          left.property.type === "Identifier" &&
          right.type === "StringLiteral"
        ) {
          checkIdentifierAndValue(
            left.property.name,
            right.value,
            right,
            context,
          );
        }
      },
    });

    // Run regex-based scans for patterns
    scanWithRegex(context);
  },
};
