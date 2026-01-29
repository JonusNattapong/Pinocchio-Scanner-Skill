import { describe, it, expect } from "vitest";
import { scanCode, scanFile, scanDirectory } from "../src/index";
import type { SecurityFinding } from "../src/types";

describe("Skill Scanner", () => {
  describe("scanCode", () => {
    it("should return empty array for safe code", async () => {
      const safeCode = `
        export function greet(name: string) {
          return \`Hello, \${name}!\`;
        }
      `;

      const findings = await scanCode(safeCode);
      expect(findings).toHaveLength(0);
    });

    it("should detect command injection via exec", async () => {
      const vulnerableCode = `
        import { exec } from 'child_process';
        export function runCommand(userInput: string) {
          exec(\`ls \${userInput}\`);
        }
      `;

      const findings = await scanCode(vulnerableCode);
      expect(findings.length).toBeGreaterThan(0);
      expect(findings.some((f) => f.type === "command-injection")).toBe(true);
    });

    it("should detect code injection via eval", async () => {
      const vulnerableCode = `
        export function processUserCode(userCode: string) {
          return eval(userCode);
        }
      `;

      const findings = await scanCode(vulnerableCode);
      expect(findings.some((f) => f.type === "code-injection")).toBe(true);
    });

    it("should detect new Function() usage", async () => {
      const vulnerableCode = `
        export function createDynamicFunction(code: string) {
          return new Function('return ' + code)();
        }
      `;

      const findings = await scanCode(vulnerableCode);
      expect(findings.some((f) => f.type === "code-injection")).toBe(true);
    });

    it("should detect hardcoded API keys", async () => {
      const vulnerableCode = `
        const apiKey = "test_api_key_fake_value_12345678901234";
        export function getApiKey() {
          return apiKey;
        }
      `;

      const findings = await scanCode(vulnerableCode);
      expect(findings.some((f) => f.type === "hardcoded-secret")).toBe(true);
    });

    it("should detect hardcoded passwords", async () => {
      const vulnerableCode = `
        const config = {
          password: "supersecret123"
        };
        export default config;
      `;

      const findings = await scanCode(vulnerableCode);
      expect(findings.some((f) => f.type === "hardcoded-secret")).toBe(true);
    });

    it("should detect unsafe file read with dynamic path", async () => {
      const vulnerableCode = `
        import * as fs from 'fs';
        export function readUserFile(filename: string) {
          return fs.readFileSync(filename);
        }
      `;

      const findings = await scanCode(vulnerableCode);
      expect(findings.some((f) => f.type === "file-system")).toBe(true);
    });

    it("should detect path traversal in file operations", async () => {
      const vulnerableCode = `
        import * as fs from 'fs';
        export function readConfig() {
          return fs.readFileSync("../../etc/passwd");
        }
      `;

      const findings = await scanCode(vulnerableCode);
      expect(findings.some((f) => f.type === "file-system")).toBe(true);
    });

    it("should respect severity threshold", async () => {
      const vulnerableCode = `
        const apiKey = "test_api_key_fake_value_12345678901234";
        eval("console.log('test')");
      `;

      // Should return all findings when no threshold
      const allFindings = await scanCode(vulnerableCode);
      expect(allFindings.length).toBeGreaterThan(0);

      // Should filter by severity
      const highOnly = await scanCode(vulnerableCode, {
        severityThreshold: "high",
      });
      expect(
        highOnly.every(
          (f) => f.severity === "high" || f.severity === "critical",
        ),
      ).toBe(true);
    });

    it("should filter by check type", async () => {
      const vulnerableCode = `
        const apiKey = "test_api_key_fake_value_12345678901234";
        eval("console.log('test')");
      `;

      const secretOnly = await scanCode(vulnerableCode, {
        checks: ["hardcoded-secret"],
      });
      expect(secretOnly.every((f) => f.type === "hardcoded-secret")).toBe(true);
      expect(secretOnly.length).toBeGreaterThan(0);
    });

    it("should detect dynamic require", async () => {
      const vulnerableCode = `
        export function loadModule(moduleName: string) {
          return require(moduleName);
        }
      `;

      const findings = await scanCode(vulnerableCode);
      expect(findings.some((f) => f.type === "file-system")).toBe(true);
    });

    it("should detect AWS keys", async () => {
      const vulnerableCode = `
        const awsAccessKey = "AKIAIOSFODNN7EXAMPLE";
        export { awsAccessKey };
      `;

      const findings = await scanCode(vulnerableCode);
      expect(
        findings.some(
          (f) => f.type === "hardcoded-secret" && f.severity === "critical",
        ),
      ).toBe(true);
    });

    it("should detect GitHub tokens", async () => {
      const vulnerableCode = `
        const GITHUB_TOKEN = "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
        export { GITHUB_TOKEN };
      `;

      const findings = await scanCode(vulnerableCode);
      expect(
        findings.some(
          (f) =>
            f.type === "hardcoded-secret" &&
            f.message.toLowerCase().includes("github"),
        ),
      ).toBe(true);
    });

    it("should detect private keys", async () => {
      const vulnerableCode = `
        const privateKey = \`-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
-----END RSA PRIVATE KEY-----\`;
        export { privateKey };
      `;

      const findings = await scanCode(vulnerableCode);
      expect(
        findings.some(
          (f) =>
            f.type === "hardcoded-secret" &&
            f.message.toLowerCase().includes("private key"),
        ),
      ).toBe(true);
    });

    it("should handle multiple vulnerabilities in one file", async () => {
      const vulnerableCode = `
        import { exec } from 'child_process';
        import * as fs from 'fs';

        const API_KEY = "test_api_key_fake_value_1234567890";

        export function dangerousFunction(userInput: string) {
          // Command injection
          exec(\`echo \${userInput}\`);

          // Code injection
          eval(userInput);

          // File system vulnerability
          fs.readFileSync(userInput);

          return API_KEY;
        }
      `;

      const findings = await scanCode(vulnerableCode);

      expect(findings.some((f) => f.type === "command-injection")).toBe(true);
      expect(findings.some((f) => f.type === "code-injection")).toBe(true);
      expect(findings.some((f) => f.type === "file-system")).toBe(true);
      expect(findings.some((f) => f.type === "hardcoded-secret")).toBe(true);
    });

    it("should include proper metadata in findings", async () => {
      const vulnerableCode = `
        const secret = "hardcoded_secret_value";
        export { secret };
      `;

      const findings = await scanCode(vulnerableCode);
      expect(findings.length).toBeGreaterThan(0);

      for (const finding of findings) {
        expect(finding).toHaveProperty("type");
        expect(finding).toHaveProperty("severity");
        expect(finding).toHaveProperty("line");
        expect(finding).toHaveProperty("column");
        expect(finding).toHaveProperty("message");
        expect(finding).toHaveProperty("code");
        expect(finding).toHaveProperty("remediation");
        expect(typeof finding.line).toBe("number");
        expect(typeof finding.column).toBe("number");
        expect(finding.line).toBeGreaterThan(0);
      }
    });
  });
});
