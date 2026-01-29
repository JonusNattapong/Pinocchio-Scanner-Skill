import type { Node, CallExpression } from "@babel/types";
import traverse, { type NodePath } from "../utils/traverse.js";
import type { SecurityCheck, CheckContext } from "../types.js";
import { DANGEROUS_PATTERNS } from "../utils/patterns.js";
import { getSeverity } from "../utils/severity.js";
import { getNodePosition, extractNodeCode } from "../parser.js";

function reportFinding(
  node: Node,
  context: string,
  contextObj: CheckContext,
  isCritical: boolean,
): void {
  const pos = getNodePosition(node);
  const code = extractNodeCode(node, contextObj.lines);

  contextObj.addFinding({
    type: "file-system",
    severity: isCritical ? "high" : "medium",
    line: pos.line,
    column: pos.column,
    message: `File system security issue: ${context}`,
    code,
    remediation:
      "Validate all file paths against an allowlist of allowed locations.",
  });
}

function analyzeFsCall(
  node: Node & { arguments?: any[] },
  funcName: string,
  isWrite: boolean,
  context: CheckContext,
): void {
  const { lines, addFinding } = context;
  const args = node.arguments;

  if (!args || args.length === 0) return;

  const firstArg = args[0];
  let isDynamic = false;
  let hasPathTraversal = false;

  // Check for template literal with expressions
  if (firstArg.type === "TemplateLiteral" && firstArg.expressions.length > 0) {
    isDynamic = true;

    // Check for path traversal patterns in the template
    for (const quasi of firstArg.quasis) {
      if (DANGEROUS_PATTERNS.fileSystem.pathTraversal.test(quasi.value.raw)) {
        hasPathTraversal = true;
        break;
      }
    }
  }

  // Check for variable/expression (not string literal)
  if (
    firstArg.type !== "StringLiteral" &&
    firstArg.type !== "TemplateLiteral"
  ) {
    isDynamic = true;
  }

  // Check string literal for path traversal
  if (firstArg.type === "StringLiteral") {
    if (DANGEROUS_PATTERNS.fileSystem.pathTraversal.test(firstArg.value)) {
      hasPathTraversal = true;
    }
  }

  if (isDynamic || hasPathTraversal) {
    const pos = getNodePosition(node);
    const code = extractNodeCode(node, lines);

    const contextDesc = isWrite
      ? hasPathTraversal
        ? "file write with path traversal"
        : "file write with dynamic path"
      : hasPathTraversal
        ? "file read with path traversal"
        : "file read with dynamic path";

    addFinding({
      type: "file-system",
      severity: getSeverity("file-system", isWrite ? "write" : "read"),
      line: pos.line,
      column: pos.column,
      message: `Unsafe file system operation: ${funcName} ${hasPathTraversal ? "with path traversal" : "with dynamic path"}`,
      code,
      remediation: hasPathTraversal
        ? "Validate and sanitize file paths. Use path.resolve() with allowlist of allowed directories."
        : "Validate file paths against an allowlist. Avoid passing user input directly to file operations.",
    });
  }
}

function scanPathTraversal(context: CheckContext): void {
  const { code, addFinding } = context;

  // Find strings with path traversal patterns
  const stringRegex = /['"`]([^'"`]*\.\.[/\\][^'"`]*)['"`]/g;
  let match;

  while ((match = stringRegex.exec(code)) !== null) {
    // Skip if it's in a comment
    const codeBefore = code.slice(0, match.index);
    const lastNewline = codeBefore.lastIndexOf("\n");
    const lineStart = lastNewline === -1 ? 0 : lastNewline + 1;
    const lineContent = code.slice(lineStart, match.index);

    if (lineContent.includes("//") || lineContent.includes("*")) {
      continue;
    }

    const lines = code.slice(0, match.index).split("\n");
    const line = lines.length;
    const column = lines[lines.length - 1].length;

    addFinding({
      type: "file-system",
      severity: "medium",
      line,
      column,
      message: "Path traversal pattern detected in string literal",
      code: match[0],
      remediation:
        "Validate file paths. Avoid hardcoding relative paths that traverse directories.",
    });
  }
}

export const fileSystemCheck: SecurityCheck = {
  name: "file-system",

  check(context: CheckContext): void {
    const { ast, addFinding } = context;

    if (!ast) {
      // Regex scan for path traversal patterns in strings found in the raw code
      scanPathTraversal(context);
      return;
    }

    traverse(ast!, {
      // Check for fs.readFile, fs.writeFile, etc.
      CallExpression(path: NodePath<CallExpression>) {
        const callee = path.node.callee;
        let funcName: string | null = null;
        let isFsCall = false;

        // Direct fs.method() call
        if (
          callee.type === "MemberExpression" &&
          callee.object.type === "Identifier" &&
          callee.object.name === "fs" &&
          callee.property.type === "Identifier"
        ) {
          funcName = callee.property.name;
          isFsCall = true;
        }

        // require('fs').readFile() pattern
        if (
          callee.type === "MemberExpression" &&
          callee.object.type === "CallExpression" &&
          callee.object.callee.type === "Identifier" &&
          callee.object.callee.name === "require" &&
          callee.property.type === "Identifier"
        ) {
          const requireArg = callee.object.arguments[0];
          if (
            requireArg?.type === "StringLiteral" &&
            requireArg.value === "fs"
          ) {
            funcName = callee.property.name;
            isFsCall = true;
          }
        }

        // Check for fs/promises patterns
        if (
          callee.type === "MemberExpression" &&
          callee.object.type === "Identifier" &&
          (callee.object.name === "fsp" || callee.object.name === "fsPromises")
        ) {
          if (callee.property.type === "Identifier") {
            funcName = callee.property.name;
            isFsCall = true;
          }
        }

        if (!isFsCall || !funcName) return;

        // Check if it's a read or write function
        const isRead =
          DANGEROUS_PATTERNS.fileSystem.readFunctions.includes(funcName);
        const isWrite =
          DANGEROUS_PATTERNS.fileSystem.writeFunctions.includes(funcName);

        if (!isRead && !isWrite) return;

        analyzeFsCall(path.node, funcName, isWrite, context);
      },
    });

    // Second pass for require/import analysis
    traverse(ast!, {
      // Check for require() with dynamic path or import()
      CallExpression(path: NodePath<CallExpression>) {
        const callee = path.node.callee;

        // Check for dynamic import() - babel parses this as CallExpression with Import callee
        if (callee.type === "Import") {
          const arg = path.node.arguments[0];
          if (arg && arg.type !== "StringLiteral") {
            reportFinding(path.node, "dynamic import", context, true);
          }
          return;
        }

        // Check for require()
        if (callee.type === "Identifier" && callee.name === "require") {
          const arg = path.node.arguments[0];

          // Dynamic require (not a string literal)
          if (arg && arg.type !== "StringLiteral") {
            reportFinding(path.node, "dynamic require", context, true);
          }

          // Check for path traversal in require
          if (arg?.type === "StringLiteral") {
            const pathValue = arg.value;
            if (DANGEROUS_PATTERNS.fileSystem.pathTraversal.test(pathValue)) {
              reportFinding(
                path.node,
                "require with path traversal",
                context,
                true,
              );
            }
          }

          // Check for template literal with expressions in require
          if (arg?.type === "TemplateLiteral" && arg.expressions.length > 0) {
            reportFinding(
              path.node,
              "dynamic require with template literal",
              context,
              true,
            );
          }
        }
      },
    });

    // Regex scan for path traversal patterns in strings
    scanPathTraversal(context);
  },
};
