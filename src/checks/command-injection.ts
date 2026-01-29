import type {
  Node,
  ImportDeclaration,
  VariableDeclarator,
  CallExpression,
} from "@babel/types";
import traverse, { type NodePath } from "../utils/traverse.js";
import type { SecurityCheck, CheckContext } from "../types.js";
import {
  DANGEROUS_PATTERNS,
  containsShellMetacharacters,
} from "../utils/patterns.js";
import { getSeverity } from "../utils/severity.js";
import { getNodePosition, extractNodeCode } from "../parser.js";

function analyzeCall(
  node: Node & { arguments?: any[] },
  funcName: string,
  lines: string[],
  addFinding: CheckContext["addFinding"],
  isBashTool = false,
): void {
  const args = node.arguments;

  if (!args || args.length === 0) return;

  const firstArg = args[0];
  let isDynamic = false;
  let context = funcName;

  // Check if the first argument is a template literal with expressions
  if (firstArg.type === "TemplateLiteral" && firstArg.expressions.length > 0) {
    isDynamic = true;
    context = `${funcName} with template literal`;

    // Check if the template contains shell metacharacters
    const quasis = firstArg.quasis;
    for (const quasi of quasis) {
      if (containsShellMetacharacters(quasi.value.raw)) {
        context += " with shell metacharacters";
        break;
      }
    }
  }

  // Check if the first argument is a variable or expression (not a string literal)
  if (
    firstArg.type !== "StringLiteral" &&
    firstArg.type !== "TemplateLiteral"
  ) {
    isDynamic = true;
    context = `${funcName} with dynamic input`;
  }

  // Check if string literal contains shell metacharacters (partial dynamic)
  if (firstArg.type === "StringLiteral") {
    if (containsShellMetacharacters(firstArg.value)) {
      isDynamic = true;
      context = `${funcName} with shell metacharacters`;
    }
  }

  if (isDynamic) {
    const pos = getNodePosition(node);
    const code = extractNodeCode(node, lines);

    addFinding({
      type: "command-injection",
      severity: getSeverity("command-injection", context),
      line: pos.line,
      column: pos.column,
      message: isBashTool
        ? `Potential command injection in bash tool call: ${funcName}`
        : `Potential command injection via ${funcName}`,
      code,
      remediation:
        "Use parameterized commands or sanitize input. Avoid passing user input directly to shell commands.",
    });
  }
}

function checkCallExpression(
  node: Node,
  lines: string[],
  addFinding: CheckContext["addFinding"],
): void {
  if (node.type !== "CallExpression") return;

  const callee = node.callee;
  let funcName: string | null = null;

  if (callee.type === "Identifier") {
    funcName = callee.name;
  } else if (
    callee.type === "MemberExpression" &&
    callee.property.type === "Identifier"
  ) {
    funcName = callee.property.name;
  }

  if (!funcName) return;

  // Check if this is a dangerous function
  if (DANGEROUS_PATTERNS.commandInjection.execFunctions.includes(funcName)) {
    analyzeCall(node as any, funcName, lines, addFinding);
  }

  // Check for bash tool calls (agent-specific)
  if (
    DANGEROUS_PATTERNS.commandInjection.bashToolPatterns.some((p) =>
      funcName?.toLowerCase().includes(p.toLowerCase()),
    )
  ) {
    analyzeCall(node as any, funcName, lines, addFinding, true);
  }
}

function scanTemplateLiterals(context: CheckContext): void {
  const { code, addFinding } = context;

  // Find template literals that might be shell commands
  const templateRegex = /`([^`]*\$\{[^}]+\}[^`]*)`/g;
  let match;

  while ((match = templateRegex.exec(code)) !== null) {
    const templateContent = match[1];

    if (containsShellMetacharacters(templateContent)) {
      const lines = code.slice(0, match.index).split("\n");
      const line = lines.length;
      const column = lines[lines.length - 1].length;

      // Check if this looks like a shell command
      const shellIndicators = [
        "exec",
        "spawn",
        "bash",
        "sh",
        "cmd",
        "powershell",
        "system.run",
      ];
      const precedingCode = code.slice(
        Math.max(0, match.index - 100),
        match.index,
      );

      if (
        shellIndicators.some((ind) =>
          precedingCode.toLowerCase().includes(ind.toLowerCase()),
        )
      ) {
        addFinding({
          type: "command-injection",
          severity: "high",
          line,
          column,
          message:
            "Template literal with shell metacharacters detected in command context",
          code: match[0],
          remediation:
            "Sanitize template literal expressions before using in shell commands.",
        });
      }
    }
  }
}

export const commandInjectionCheck: SecurityCheck = {
  name: "command-injection",

  check(context: CheckContext): void {
    const { ast, lines, addFinding } = context;

    traverse(ast, {
      // Check for child_process imports and calls
      ImportDeclaration(path: NodePath<ImportDeclaration>) {
        const source = path.node.source.value;
        if (source === "child_process") {
          // Track variable names for child_process imports
          const specifiers = path.node.specifiers;
          for (const spec of specifiers) {
            if (
              spec.type === "ImportSpecifier" &&
              spec.imported.type === "Identifier" &&
              DANGEROUS_PATTERNS.commandInjection.execFunctions.includes(
                spec.imported.name,
              )
            ) {
              // We'll check for calls to this identifier later
            }
          }
        }
      },

      // Check for require('child_process')
      VariableDeclarator(path: NodePath<VariableDeclarator>) {
        const init = path.node.init;
        if (
          init?.type === "CallExpression" &&
          init.callee.type === "Identifier" &&
          init.callee.name === "require" &&
          init.arguments[0]?.type === "StringLiteral" &&
          init.arguments[0].value === "child_process"
        ) {
          // Track this variable for later use
        }

        // Check for exec/spawn calls with dynamic arguments
        if (init?.type === "CallExpression") {
          checkCallExpression(init, lines, addFinding);
        }
      },

      // Check all call expressions
      CallExpression(path: NodePath<CallExpression>) {
        checkCallExpression(path.node, lines, addFinding);
      },
    });

    // Also do a regex scan for template literals with shell metacharacters
    scanTemplateLiterals(context);
  },
};
