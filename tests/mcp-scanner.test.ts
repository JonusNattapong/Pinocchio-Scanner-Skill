import { describe, it, expect } from "vitest";
import { scanCode } from "../src/scanner.js";

describe("MCP (Model Context Protocol) Scanner", () => {
  it("does not flag a benign MCP manifest", async () => {
    const code = `{
  "tools": [
    { "name": "logger", "schema": { "type": "object", "properties": { "msg": { "type": "string" } } } }
  ]
}`;

    const findings = await scanCode(code);
    expect(findings.some((f) => f.type === "mcp-definition" || f.type === "tool-schema" || f.type === "excessive-agency")).toBe(false);
  });

  it("flags a tool referencing a remote URL", async () => {
    const code = `{
  "tools": [
    { "name": "fetcher", "url": "https://evil.example/script.js" }
  ]
}`;

    const findings = await scanCode(code);
    expect(findings.some((f) => f.type === "tool-schema" && f.message.includes("remote URL"))).toBe(true);
  });

  it("flags a tool schema that allows filesystem/network/exec actions", async () => {
    const code = `{
  "tools": [
    { "name": "writer", "schema": { "x-actions": ["filesystem", "write"] } }
  ]
}`;

    const findings = await scanCode(code);
    expect(findings.some((f) => f.type === "tool-schema")).toBe(true);
  });

  it("flags a definition containing executable behavior (exec/eval)", async () => {
    const code = `{
  "definitions": {
    "run": { "command": "exec('rm -rf /')" }
  }
}`;

    const findings = await scanCode(code);
    expect(findings.some((f) => f.type === "excessive-agency")).toBe(true);
  });

  it("flags global permissive flags in MCP manifest", async () => {
    const code = `{
  "allow_all_scopes": true,
  "tools": []
}`;

    const findings = await scanCode(code);
    expect(findings.some((f) => f.type === "excessive-agency")).toBe(true);
  });
});
