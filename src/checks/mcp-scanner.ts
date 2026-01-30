import type { SecurityCheck, CheckContext } from "../types.js";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Load local config for trusted hosts / allowlists
let MCP_CONFIG: any = {};
try {
  const cfgPath = join(process.cwd(), ".skill-scanner", "mcp-config.json");
  MCP_CONFIG = JSON.parse(readFileSync(cfgPath, "utf-8"));
} catch {
  MCP_CONFIG = {};
}

// Very small MCP (Model Context Protocol) definition scanner
// Looks for MCP-like JSON/YAML blobs and validates for risky fields:
// - Definitions exposing external URLs or eval-like behaviors
// - Tool schemas that allow arbitrary file/network access
// - Excessive agency: actions that can modify/execute host resources

import YAML from "yaml";
import { parse as yamlParseCst } from "yaml";

function tryParseJSON(text: string) {
  // Try JSON
  try {
    return JSON.parse(text);
  } catch {
    // Try YAML as a fallback
    try {
      return YAML.parse(text);
    } catch {
      return null;
    }
  }
}

function findJsonBlobs(code: string): { text: string; index: number }[] {
  const blobs: { text: string; index: number }[] = [];
  const jsonBlock = /```json\s*([\s\S]*?)```/g;
  let m;
  while ((m = jsonBlock.exec(code)) !== null) {
    blobs.push({ text: m[1], index: m.index });
  }
  // Also attempt to pick up inline JSON objects
  const inlineJson = /\{\s*"[\s\S]*?\}\s*/g;
  while ((m = inlineJson.exec(code)) !== null) {
    blobs.push({ text: m[0], index: m.index });
    inlineJson.lastIndex = m.index + m[0].length;
  }
  return blobs;
}

function isUrl(str: string): boolean {
  return /https?:\/\//i.test(str);
}

function getPositionFromGlobalIndex(code: string, index: number) {
  const before = code.slice(0, index);
  const lines = before.split("\n");
  const line = lines.length;
  const column = lines[lines.length - 1].length + 1;
  return { line, column };
}

function findKeyPositions(text: string, key: string) {
  const positions: number[] = [];
  // JSON-style "key": value
  const jsonRegex = new RegExp(`\"${key}\"\s*:\s*([^,\n\r]+)`, "g");
  let m: RegExpExecArray | null;
  while ((m = jsonRegex.exec(text)) !== null) {
    positions.push(m.index);
  }

  // YAML-style key: value (start of line)
  const yamlRegex = new RegExp(`(^|\n)\s*${key}\s*:\s*([^\n\r]+)`, "g");
  while ((m = yamlRegex.exec(text)) !== null) {
    // m.index is start of match; adjust for leading newline
    positions.push(m.index + (m[1] ? m[1].length : 0));
  }

  return positions;
}

function suggestSanitizations(kind: string, details: any) {
  const suggestions: string[] = [];
  if (kind === "global-flag") {
    suggestions.push(`Remove the global permissive flag '${details.flag}' or set it to false and enumerate explicit scopes.`);
  }
  if (kind === "tool-url") {
    suggestions.push(`Replace remote URL '${details.url}' with a vetted local implementation or a trusted host and verify integrity (checksum/signature).`);
  }
  if (kind === "tool-schema") {
    suggestions.push(`Restrict schema actions: remove 'filesystem'/'execute' capabilities from the tool schema or require explicit scoped permissions.`);
  }
  if (kind === "definition-exec") {
    suggestions.push(`Remove executable code from definition '${details.name}' or move it to a sandboxed, reviewed runtime.`);
  }
  return suggestions;
}

export const mcpScannerCheck: SecurityCheck = {
  name: "mcp-definition",

  async check(context: CheckContext, options?: any): Promise<void> {
    const { code, addFinding } = context;

    const blobs = findJsonBlobs(code);

    // If the entire content is a JSON/YAML MCP manifest (common in tests), try parsing whole body first
    if (code.trim().startsWith("{") || code.trim().startsWith("[")) {
      const whole = tryParseJSON(code.trim());
      if (whole) {
        // prepend so we analyze top-level manifest first
        blobs.unshift({ text: code.trim(), index: 0 });
      }
    }
    for (const blob of blobs) {
      const parsed = tryParseJSON(blob.text);
      if (!parsed) continue;

      // approximate base line from blob index
      const baseLine = Math.max(
        1,
        code.slice(0, blob.index).split("\n").length + 1,
      );

      // helper to compute precise location for a substring inside this blob
      function precisePosFor(needle: string) {
        const idx = blob.text.indexOf(needle);
        if (idx >= 0) {
          return getPositionFromGlobalIndex(code, blob.index + idx);
        }
        return { line: baseLine, column: 1 };
      }

      // Detect tools section
      if (parsed.tools && Array.isArray(parsed.tools)) {
        parsed.tools.forEach((tool: any, idx: number) => {
          if (tool.schema) {
            // If schema declares file/network scopes
            const schemaStr = JSON.stringify(tool.schema);
            if (
              /write|delete|execute|filesystem|fs|network|http:\/\//i.test(
                schemaStr,
              )
            ) {
              const pos = precisePosFor("schema");
              addFinding({
                type: "tool-schema",
                severity: "high",
                line: pos.line,
                column: pos.column,
                message: `Tool schema allows privileged actions for tool: ${tool.name || idx}`,
                code: schemaStr.substring(0, 200),
                remediation:
                  "Review tool schema and restrict capabilities. Avoid allowing direct filesystem/network/exec access in tool schemas.",
                metadata: { tool: tool.name || `tool[${idx}]`, suggestions: suggestSanitizations("tool-schema", { tool: tool.name || idx }) },
              });
            }
          }

          // Tool entrypoint as URL / remote code
          if (tool.url && typeof tool.url === "string" && isUrl(tool.url)) {
            const pos = precisePosFor(tool.url);
            addFinding({
              type: "tool-schema",
              severity: "medium",
              line: pos.line,
              column: pos.column,
              message: `Tool references remote URL: ${tool.url}`,
              code: `url: ${tool.url}`,
              remediation:
                "Avoid loading tool behavior from untrusted remote URLs. Prefer local vetted implementations.",
              metadata: { tool: tool.name || `tool[${idx}]`, suggestions: suggestSanitizations("tool-url", { url: tool.url }) },
            });
          }
        });
      }

      // Detect top-level definitions with exec-like behavior
      if (parsed.definitions && typeof parsed.definitions === "object") {
        for (const [k, v] of Object.entries(parsed.definitions)) {
          // If definition contains code, eval, command, or url -> risky
          const str = JSON.stringify(v);
          if (
            /eval\(|new Function|spawn\(|exec\(|system\(|cmd\.|powershell/i.test(
              str,
            )
          ) {
            const pos = precisePosFor(k);
            addFinding({
              type: "excessive-agency",
              severity: "critical",
              line: pos.line,
              column: pos.column,
              message: `Definition ${k} contains executable behavior or code that may grant excessive agency`,
              code: str.substring(0, 200),
              remediation:
                "Remove executable semantics from MCP definitions or gate them behind strict sandboxing and manual review.",
              metadata: { definition: k, suggestions: suggestSanitizations("definition-exec", { name: k }) },
            });
          }

          // If definition references external resources
          if (isUrl(str)) {
            // try to find the url in the blob
            const urlMatch = blob.text.match(/https?:\/\/[^\s\"\,\]}]*/);
            const pos = urlMatch ? precisePosFor(urlMatch[0]) : { line: baseLine, column: 1 };
            addFinding({
              type: "mcp-definition",
              severity: "high",
              line: pos.line,
              column: pos.column,
              message: `Definition ${k} references external resources (URLs)`,
              code: str.substring(0, 200),
              remediation:
                "Host required resources locally or ensure remote endpoints are trusted and integrity-verified.",
              metadata: { definition: k, suggestions: suggestSanitizations("tool-url", { url: urlMatch?.[0] }) },
            });
          }
        }
      }

      // Detect global excessive agency flags
      const bigFlags = [
        "allow_all_scopes",
        "agent_scope: *",
        "unrestricted",
        "allow_elevation",
      ];
      for (const flag of bigFlags) {
        if (
          blob.text.includes(flag) ||
          (parsed && Object.prototype.hasOwnProperty.call(parsed, flag))
        ) {
          addFinding({
            type: "excessive-agency",
            severity: "critical",
            line: baseLine,
            column: 1,
            message: `MCP manifest contains global permissive flag: ${flag}`,
            code: flag,
            remediation:
              "Remove global permissive flags. Use least privilege and explicit scopes for agent actions.",
          });
        }
      }
    }
  },
};
