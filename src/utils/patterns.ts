export const DANGEROUS_PATTERNS = {
  commandInjection: {
    execFunctions: ['exec', 'execSync', 'spawn', 'execFile'],
    shellMetacharacters: /[;|&$`\\]|\$\(|\$\{|\`\` |\*|<|>/,
    bashToolPatterns: ['bash', 'system.run', 'shell'],
  },
  fileSystem: {
    readFunctions: ['readFile', 'readFileSync', 'readJson', 'readJsonSync'],
    writeFunctions: ['writeFile', 'writeFileSync', 'appendFile', 'appendFileSync'],
    pathTraversal: /\.\.[/\\]|\.\.\\\\/,
  },
  codeInjection: {
    dangerousFunctions: ['eval', 'setTimeout', 'setInterval', 'Function'],
    vmFunctions: ['runInContext', 'runInNewContext', 'runInThisContext', 'compileFunction'],
  },
  secrets: {
    apiKeyPatterns: [
      /api[_-]?key\s*[:=]\s*['"][a-zA-Z0-9_\-]{16,}['"]/i,
      /api[_-]?secret\s*[:=]\s*['"][a-zA-Z0-9_\-]{16,}['"]/i,
    ],
    passwordPatterns: [
      /password\s*[:=]\s*['"][^'"]{4,}['"]/i,
      /passwd\s*[:=]\s*['"][^'"]{4,}['"]/i,
    ],
    tokenPatterns: [
      /token\s*[:=]\s*['"][a-zA-Z0-9_\-]{16,}['"]/i,
      /auth[_-]?token\s*[:=]\s*['"][a-zA-Z0-9_\-]{16,}['"]/i,
    ],
    privateKeyPatterns: [
      /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/,
      /-----BEGIN\s+(EC\s+)?PRIVATE\s+KEY-----/,
      /-----BEGIN\s+(OPENSSH\s+)?PRIVATE\s+KEY-----/,
    ],
    awsPatterns: [
      /AKIA[0-9A-Z]{16}/,
      /['"][0-9a-zA-Z/+]{40}['"]\s*.*\s*(aws|amazon)/i,
    ],
    githubPatterns: [
      /gh[pousr]_[a-zA-Z0-9_]{36,}/,
      /github[_-]?token\s*[:=]\s*['"][a-f0-9]{40}['"]/i,
    ],
    genericSecrets: [
      /secret\s*[:=]\s*['"][a-zA-Z0-9_\-]{8,}['"]/i,
    ],
  },
};

export const SAFE_PATTERNS = {
  testFiles: /\.(test|spec)\.(ts|js)$/,
  mockValues: /^(test|mock|example|dummy|sample|fake|placeholder|xxx|12345)$/i,
  envAccess: /process\.env\.|import\.meta\.env\./,
};

export function isLikelySafeValue(value: string): boolean {
  return SAFE_PATTERNS.mockValues.test(value);
}

export function containsShellMetacharacters(str: string): boolean {
  return DANGEROUS_PATTERNS.commandInjection.shellMetacharacters.test(str);
}
