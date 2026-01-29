// Sample vulnerable skill file for testing the scanner
// This file contains intentional security vulnerabilities for demonstration

import { exec, execSync } from "child_process";
import fs from "fs";
import vm from "vm";

// ❌ COMMAND INJECTION - Dynamic command execution
export async function runCommand(userInput: string) {
  // Vulnerable: User input directly in shell command
  exec(`git clone ${userInput}`);

  // Also vulnerable: Template literal with user input
  const result = execSync(`find . -name "${userInput}"`);
}

// ❌ HARDCODED SECRETS
const API_KEY = "my_secret_api_key_do_not_commit_12345678";
const AWS_ACCESS_KEY = "AKIAIOSFODNN7EXAMPLE";
const githubToken = "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
const PRIVATE_KEY = "-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA...";

// ❌ CODE INJECTION
export function dangerousEval(userCode: string) {
  // Vulnerable: eval with user input
  const result = eval(userCode);

  // Also vulnerable: new Function with dynamic body
  const fn = new Function("x", "y", userCode);

  // Vulnerable: VM with untrusted code
  const context = vm.createContext({});
  vm.runInContext(userCode, context);
}

// ❌ FILE SYSTEM VULNERABILITIES
export async function readUserFile(userPath: string) {
  // Vulnerable: Dynamic file path from user
  const content = fs.readFileSync(userPath, "utf-8");

  // Vulnerable: Path traversal possibility
  const config = fs.readFileSync("../../../etc/passwd");
}

// ❌ DYNAMIC REQUIRE/IMPORT
export async function loadModule(moduleName: string) {
  // Vulnerable: Dynamic require
  const mod = require(moduleName);

  // Vulnerable: Dynamic import
  const asyncMod = await import(moduleName);
}

// ✅ SAFE ALTERNATIVES (for comparison)
export function safeExample() {
  // Safe: Using environment variables for secrets
  const apiKey = process.env.API_KEY;

  // Safe: Static command without user input
  execSync("npm install");

  // Safe: Static file path
  fs.readFileSync("./config.json", "utf-8");
}
