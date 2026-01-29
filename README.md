# 🔒 Skill Scanner

A powerful security scanner for agent skill files that detects vulnerabilities including **command injection**, **unsafe file operations**, **hardcoded secrets**, and **code injection risks**.

![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![TypeScript](https://img.shields.io/badge/typescript-%5E5.3-blue)

## 🎯 Features

- **Command Injection Detection** - Identifies unsafe shell command execution patterns
- **Code Injection Detection** - Flags `eval()`, `new Function()`, and VM module usage
- **Hardcoded Secrets Detection** - Finds API keys, passwords, tokens, and private keys
- **File System Security** - Detects path traversal and unsafe file operations
- **Multiple Output Formats** - Human-readable CLI output or JSON for CI/CD integration
- **Configurable Severity Thresholds** - Filter findings by severity level
- **Selective Checks** - Run only specific security checks as needed

## 📦 Installation

```bash
# Install dependencies
npm install

# Build the project
npm run build
```

## 🚀 Usage

### CLI

```bash
# Scan a directory
npx skill-scanner ./src

# Scan a single file
npx skill-scanner ./skills/dangerous-skill.ts

# Output as JSON (great for CI/CD)
npx skill-scanner ./src --json

# Filter by severity (low, medium, high, critical)
npx skill-scanner ./src --severity high

# Run specific checks only
npx skill-scanner ./src --checks command-injection,hardcoded-secret

# Ignore specific patterns
npx skill-scanner ./src --ignore "*.test.ts,dist/*"

# Verbose output
npx skill-scanner ./src -v
```

### Programmatic API

```typescript
import { scanCode, scanFile, scanDirectory } from 'skill-scanner';

// Scan inline code
const findings = await scanCode(`
  const apiKey = "secret_api_key_value_12345";
  exec(\`rm -rf \${userInput}\`);
`);

// Scan a file
const fileFindings = await scanFile('./path/to/skill.ts');

// Scan a directory
const result = await scanDirectory('./skills', {
  severityThreshold: 'high',
  checks: ['command-injection', 'hardcoded-secret'],
  ignorePatterns: ['*.test.ts'],
});

console.log(result.summary);
// {
//   totalFiles: 25,
//   filesWithIssues: 3,
//   criticalCount: 2,
//   highCount: 5,
//   mediumCount: 8,
//   lowCount: 1
// }
```

## 🔍 Detected Vulnerabilities

### Command Injection 🔴

Detects unsafe shell command execution patterns:

```typescript
// ❌ UNSAFE - Dynamic command with user input
exec(`git clone ${userRepo}`);
spawn(command, args);
execSync(`ls | grep ${pattern}`);

// ✅ SAFE - Static commands
execSync('npm install');
```

### Code Injection 🔴

Detects dynamic code execution:

```typescript
// ❌ UNSAFE
eval(userCode);
new Function('a', 'b', dynamicBody);
setTimeout('alert("xss")', 1000);
vm.runInContext(script, context);

// ✅ SAFE
JSON.parse(jsonString);
setTimeout(() => alert("ok"), 1000);
```

### Hardcoded Secrets 🟡

Detects credentials in source code:

```typescript
// ❌ UNSAFE
const apiKey = "secret_api_key_value";
const password = "supersecret123";
const awsKey = "AKIAIOSFODNN7EXAMPLE";
const privateKey = "-----BEGIN RSA PRIVATE KEY-----";

// ✅ SAFE
const apiKey = process.env.API_KEY;
const password = config.get('password');
```

### File System Security 🟡

Detects unsafe file operations:

```typescript
// ❌ UNSAFE
fs.readFile(userPath, 'utf-8');
fs.writeFile(`./uploads/${filename}`, data);
require(dynamicModule);
import(userSpecifiedPath);
const file = '../../../etc/passwd';

// ✅ SAFE
fs.readFile('./config.json', 'utf-8');
fs.writeFile(path.join(ALLOWED_DIR, sanitizedName), data);
```

## 📊 Output Example

```
🔒 Skill Scanner
   Scanning: D:\Projects\my-agent\skills

┌─ CRITICAL [hardcoded-secret]
│ skills/api-client.ts:15:4
│
│ AWS access key detected: "accessKey"
│
│   15 │ const accessKey = "AKIAIOSFODNN7EXAMPLE";
│
│ 💡 Use AWS credential files or environment variables. Never hardcode AWS credentials.
└────────────────────────────────────────────────────────────

┌─ HIGH [command-injection]
│ skills/shell-tool.ts:28:2
│
│ Potential command injection via exec
│
│   28 │ exec(`${command} ${args.join(' ')}`);
│
│ 💡 Use parameterized commands or sanitize input. Avoid passing user input directly to shell commands.
└────────────────────────────────────────────────────────────

══════════════════════════════════════════════════════════════
  SCAN SUMMARY
══════════════════════════════════════════════════════════════

  📁 Files scanned: 42
  📄 Files with issues: 5
  🔍 Total findings: 12

  By severity:
    ● CRITICAL: 2
    ● HIGH: 5
    ● MEDIUM: 4
    ● LOW: 1

  ⏱️  Scan completed at: 2026-01-30T04:20:00.000Z
══════════════════════════════════════════════════════════════
```

## 🔧 Configuration

### Scan Options

| Option | Type | Description |
|--------|------|-------------|
| `checks` | `CheckType[]` | Specific checks to run |
| `ignorePatterns` | `string[]` | Glob patterns to ignore |
| `severityThreshold` | `'low' \| 'medium' \| 'high' \| 'critical'` | Minimum severity to report |
| `verbose` | `boolean` | Show verbose output |

### Check Types

- `command-injection` - Shell command injection
- `code-injection` - Dynamic code execution
- `hardcoded-secret` - Credentials in code
- `file-system` - Unsafe file operations

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:run
```

## 🏗️ Development

```bash
# Build in watch mode
npm run dev

# Type check
npm run lint

# Clean build artifacts
npm run clean
```

## 📁 Project Structure

```
skill-scanner/
├── src/
│   ├── index.ts          # Main exports
│   ├── scanner.ts        # Core scanning logic
│   ├── parser.ts         # Babel-based code parser
│   ├── cli.ts            # Command-line interface
│   ├── types.ts          # TypeScript interfaces
│   ├── checks/
│   │   ├── command-injection.ts
│   │   ├── code-injection.ts
│   │   ├── file-system.ts
│   │   └── hardcoded-secrets.ts
│   └── utils/
│       ├── patterns.ts   # Detection patterns
│       └── severity.ts   # Severity utilities
├── tests/
│   └── scanner.test.ts   # Test suite
├── package.json
├── tsconfig.json
└── README.md
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📚 Documentation

- [Contributing Guide](CONTRIBUTING.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Security Policy](SECURITY.md)
- [Changelog](CHANGELOG.md)

## � License

MIT License - see [LICENSE](LICENSE) file for details.

## 🔗 Related

- [OWASP Command Injection](https://owasp.org/www-community/attacks/Command_Injection)
- [OWASP Code Injection](https://owasp.org/www-community/attacks/Code_Injection)
- [CWE-78: OS Command Injection](https://cwe.mitre.org/data/definitions/78.html)
- [CWE-94: Code Injection](https://cwe.mitre.org/data/definitions/94.html)
