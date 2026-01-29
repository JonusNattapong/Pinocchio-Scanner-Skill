import type { Node, CallExpression, NewExpression } from "@babel/types";
import traverse, { type NodePath } from "../utils/traverse.js";
import type { SecurityCheck, CheckContext } from "../types.js";
import { DANGEROUS_PATTERNS } from "../utils/patterns.js";
import { getSeverity } from "../utils/severity.js";
import { getNodePosition, extractNodeCode } from "../parser.js";

function reportFinding(
  node: Node,
  context: string,
  contextObj: CheckContext,
  extraInfo = "",
): void {
  const pos = getNodePosition(node);
  const code = extractNodeCode(node, contextObj.lines);

  contextObj.addFinding({
    type: "code-injection",
    severity: getSeverity("code-injection", context + extraInfo),
    line: pos.line,
    column: pos.column,
    message: `Code injection risk: ${context}${extraInfo ? ` ${extraInfo}` : ""}`,
    code,
    remediation:
      "Avoid dynamic code execution. Use safer alternatives like JSON.parse for data, or properly sandbox any necessary dynamic code.",
  });
}

export const codeInjectionCheck: SecurityCheck = {
  name: "code-injection",

  check(context: CheckContext): void {
    const { ast } = context;

    if (!ast) return;

    traverse(ast, {
      // Check for eval() calls
      CallExpression(path: NodePath<CallExpression>) {
        const callee = path.node.callee;

        // Direct eval() call
        if (callee.type === "Identifier" && callee.name === "eval") {
          reportFinding(path.node, "eval", context);
        }

        // Check for vm.runInContext, vm.runInNewContext, etc.
        if (
          callee.type === "MemberExpression" &&
          callee.property.type === "Identifier"
        ) {
          const methodName = callee.property.name;

          if (
            DANGEROUS_PATTERNS.codeInjection.vmFunctions.includes(methodName)
          ) {
            reportFinding(path.node, `vm.${methodName}`, context);
          }
        }

        // Check for setTimeout/setInterval with string argument
        if (
          callee.type === "Identifier" &&
          (callee.name === "setTimeout" || callee.name === "setInterval")
        ) {
          const firstArg = path.node.arguments[0];
          if (firstArg?.type === "StringLiteral") {
            reportFinding(path.node, `${callee.name} with string`, context);
          }
        }
      },

      // Check for new Function()
      NewExpression(path: NodePath<NewExpression>) {
        const callee = path.node.callee;
        if (callee.type === "Identifier" && callee.name === "Function") {
          // Check if any arguments are dynamic
          const hasDynamicArgs = path.node.arguments.some(
            (arg) => arg.type !== "StringLiteral",
          );

          if (hasDynamicArgs || path.node.arguments.length > 0) {
            reportFinding(
              path.node,
              "new Function()",
              context,
              hasDynamicArgs ? "with dynamic arguments" : "",
            );
          }
        }
      },
    });
  },
};
