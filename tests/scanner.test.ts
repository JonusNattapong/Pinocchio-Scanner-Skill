import { describe, it, expect } from "vitest";
import { scanCode } from "../src/scanner.js";

describe("Command Injection Detection", () => {
  it("should detect exec with template literal", async () => {
    const code = `
      import { exec } from 'child_process';
      const cmd = exec(\`ls \${userInput}\`);
    `;
    const findings = await scanCode(code);
    expect(findings.some((f) => f.type === "command-injection")).toBe(true);
  });

  it("should detect spawn with variable argument", async () => {
    const code = `
      import { spawn } from 'child_process';
      spawn(command, args);
    `;
    const findings = await scanCode(code);
    expect(findings.some((f) => f.type === "command-injection")).toBe(true);
  });

  it("should detect execSync with shell metacharacters", async () => {
    const code = `
      const { execSync } = require('child_process');
      execSync('ls | grep something');
    `;
    const findings = await scanCode(code);
    expect(findings.some((f) => f.type === "command-injection")).toBe(true);
  });

  it("should detect bash tool patterns", async () => {
    const code = `
      await bash(\`rm -rf \${path}\`);
    `;
    const findings = await scanCode(code);
    expect(findings.some((f) => f.type === "command-injection")).toBe(true);
  });

  it("should not flag static commands", async () => {
    const code = `
      import { execSync } from 'child_process';
      execSync('npm install');
    `;
    const findings = await scanCode(code);
    expect(findings.filter((f) => f.type === "command-injection")).toHaveLength(
      0,
    );
  });
});

describe("Code Injection Detection", () => {
  it("should detect eval usage", async () => {
    const code = `
      const result = eval(userCode);
    `;
    const findings = await scanCode(code);
    expect(findings.some((f) => f.type === "code-injection")).toBe(true);
  });

  it("should detect new Function with dynamic args", async () => {
    const code = `
      const fn = new Function('a', 'b', body);
    `;
    const findings = await scanCode(code);
    expect(findings.some((f) => f.type === "code-injection")).toBe(true);
  });

  it("should detect setTimeout with string", async () => {
    const code = `
      setTimeout('alert("xss")', 1000);
    `;
    const findings = await scanCode(code);
    expect(findings.some((f) => f.type === "code-injection")).toBe(true);
  });

  it("should detect vm functions", async () => {
    const code = `
      vm.runInContext(script, context);
    `;
    const findings = await scanCode(code);
    expect(findings.some((f) => f.type === "code-injection")).toBe(true);
  });
});

describe("Hardcoded Secrets Detection", () => {
  it("should detect API keys", async () => {
    const code = `
      const apiKey = "api_key_test_value_1234";
    `;
    const findings = await scanCode(code);
    expect(findings.some((f) => f.type === "hardcoded-secret")).toBe(true);
  });

  it("should detect AWS access keys", async () => {
    const code = `
      const awsKey = "AKIAIOSFODNN7EXAMPLE";
    `;
    const findings = await scanCode(code);
    expect(
      findings.some(
        (f) => f.type === "hardcoded-secret" && f.severity === "critical",
      ),
    ).toBe(true);
  });

  it("should detect GitHub tokens", async () => {
    const code = `
      const token = "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
    `;
    const findings = await scanCode(code);
    expect(findings.some((f) => f.type === "hardcoded-secret")).toBe(true);
  });

  it("should detect private keys", async () => {
    const code = `
      const key = "-----BEGIN RSA PRIVATE KEY-----";
    `;
    const findings = await scanCode(code);
    expect(
      findings.some(
        (f) => f.type === "hardcoded-secret" && f.severity === "critical",
      ),
    ).toBe(true);
  });

  it("should skip mock/test values", async () => {
    const code = `
      const apiKey = "test";
      const secret = "mock";
    `;
    const findings = await scanCode(code);
    expect(findings.filter((f) => f.type === "hardcoded-secret")).toHaveLength(
      0,
    );
  });

  it("should skip environment variable access", async () => {
    const code = `
      const apiKey = process.env.API_KEY;
    `;
    const findings = await scanCode(code);
    expect(findings.filter((f) => f.type === "hardcoded-secret")).toHaveLength(
      0,
    );
  });
});

describe("File System Security Detection", () => {
  it("should detect fs.readFile with dynamic path", async () => {
    const code = `
      import fs from 'fs';
      fs.readFile(userPath, 'utf-8', callback);
    `;
    const findings = await scanCode(code);
    expect(findings.some((f) => f.type === "file-system")).toBe(true);
  });

  it("should detect path traversal in strings", async () => {
    const code = `
      const path = '../../../etc/passwd';
    `;
    const findings = await scanCode(code);
    expect(findings.some((f) => f.type === "file-system")).toBe(true);
  });

  it("should detect dynamic require", async () => {
    const code = `
      const module = require(moduleName);
    `;
    const findings = await scanCode(code);
    expect(findings.some((f) => f.type === "file-system")).toBe(true);
  });

  it("should detect dynamic import", async () => {
    const code = `
      const mod = await import(modulePath);
    `;
    const findings = await scanCode(code);
    expect(findings.some((f) => f.type === "file-system")).toBe(true);
  });

  it("should detect writeFile with template literal path", async () => {
    const code = `
      import { writeFile } from 'fs/promises';
      await fs.writeFile(\`./output/\${filename}\`, data);
    `;
    const findings = await scanCode(code);
    expect(findings.some((f) => f.type === "file-system")).toBe(true);
  });
});

describe("Severity Filtering", () => {
  it("should filter by severity threshold", async () => {
    const code = `
      const secret = "mysecretvalue123456";
      eval(userCode);
    `;

    const allFindings = await scanCode(code);
    const highOnly = await scanCode(code, { severityThreshold: "high" });
    const criticalOnly = await scanCode(code, {
      severityThreshold: "critical",
    });

    expect(allFindings.length).toBeGreaterThanOrEqual(highOnly.length);
    expect(highOnly.length).toBeGreaterThanOrEqual(criticalOnly.length);
  });
});

describe("Check Type Selection", () => {
  it("should only run specified checks", async () => {
    const code = `
      const apiKey = "api_key_test_value_1234";
      eval(userCode);
      fs.readFile(userPath);
    `;

    const secretsOnly = await scanCode(code, { checks: ["hardcoded-secret"] });
    expect(secretsOnly.every((f) => f.type === "hardcoded-secret")).toBe(true);

    const codeInjectionOnly = await scanCode(code, {
      checks: ["code-injection"],
    });
    expect(codeInjectionOnly.every((f) => f.type === "code-injection")).toBe(
      true,
    );
  });
});
