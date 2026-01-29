import { parse } from "@babel/parser";
import type { File, Node } from "@babel/types";

export interface ParsedCode {
  ast: File;
  lines: string[];
}

export function parseCode(code: string): ParsedCode {
  const ast = parse(code, {
    sourceType: "module",
    allowImportExportEverywhere: true,
    allowReturnOutsideFunction: true,
    plugins: [
      "typescript",
      "jsx",
      "decorators-legacy",
      "classProperties",
      "asyncGenerators",
      "dynamicImport",
      "optionalChaining",
      "nullishCoalescingOperator",
      "topLevelAwait",
    ],
  });

  return {
    ast,
    lines: code.split("\n"),
  };
}

export function getNodePosition(node: Node): { line: number; column: number } {
  if (node.loc) {
    return {
      line: node.loc.start.line,
      column: node.loc.start.column,
    };
  }
  return { line: 0, column: 0 };
}

export function extractNodeCode(node: Node, lines: string[]): string {
  if (!node.loc) return "";

  const { start, end } = node.loc;
  if (start.line === end.line) {
    return lines[start.line - 1]?.slice(start.column, end.column) || "";
  }

  const result: string[] = [];
  for (let i = start.line - 1; i < end.line; i++) {
    const line = lines[i];
    if (i === start.line - 1) {
      result.push(line.slice(start.column));
    } else if (i === end.line - 1) {
      result.push(line.slice(0, end.column));
    } else {
      result.push(line);
    }
  }
  return result.join("\n");
}
