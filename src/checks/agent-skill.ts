import type { SecurityCheck, CheckContext } from "../types.js";

const DANGEROUS_BINS = [
  "nc",
  "netcat",
  "nmap",
  "tcpdump",
  "wireshark",
  "curl",
  "wget",
  "fetch",
  "ssh",
  "scp",
  "ftp",
  "telnet",
  "python",
  "python3",
  "perl",
  "ruby",
  "lua",
  "bash",
  "sh",
  "zsh",
  "powershell",
  "pwsh",
  "cmd",
  "base64",
  "openssl",
  "gpg",
];

const SUSPICIOUS_KEYWORDS = [
  "exfiltrate",
  "leak",
  "steal",
  "hidden",
  "backdoor",
  "bypass",
  "disable firewall",
  "stop antivirus",
  "upload data to",
  "send code to",
];

export const agentSkillCheck: SecurityCheck = {
  name: "cisco-defense", // Mapping to Cisco Defense for now or create agent-skill type

  check(context: CheckContext): void {
    const { code, filePath, addFinding } = context;
    const isSkillFile = filePath.endsWith("SKILL.md");

    if (!isSkillFile) return;

    // Check for dangerous binaries in metadata/frontmatter
    for (const bin of DANGEROUS_BINS) {
      // Look for bins: ["nc", ...] or "requires": ["nc"]
      const binPattern = new RegExp(`["']${bin}["']`, "i");
      if (binPattern.test(code)) {
        addFinding({
          type: "cisco-defense",
          severity: "high",
          line: 1, // Frontmatter is usually at top
          column: 1,
          message: `Skill requires a highly sensitive binary: ${bin}`,
          code: `Required binary: ${bin}`,
          remediation: `Verify if the skill absolutely requires ${bin}. Dangerous binaries can be used for data exfiltration or lateral movement.`,
        });
      }
    }

    // Check for suspicious keywords in description/content
    for (const keyword of SUSPICIOUS_KEYWORDS) {
      if (code.toLowerCase().includes(keyword.toLowerCase())) {
        const lines = code.split("\n");
        const lineIdx = lines.findIndex((l) =>
          l.toLowerCase().includes(keyword.toLowerCase()),
        );

        addFinding({
          type: "cisco-defense",
          severity: "critical",
          line: lineIdx + 1,
          column: 1,
          message: `Suspicious keyword detected: "${keyword}"`,
          code: lines[lineIdx]?.trim() || "",
          remediation:
            "This skill contains terminology often associated with malicious intent. Perform a manual review and semantic analysis.",
        });
      }
    }

    // Check for shell blocks with suspicious commands
    const shellBlockRegex =
      /```(?:bash|sh|zsh|powershell|pwsh|cmd)\s*([\s\S]*?)```/g;
    let match;
    while ((match = shellBlockRegex.exec(code)) !== null) {
      const blockContent = match[1];
      if (
        blockContent.includes("curl") ||
        blockContent.includes("wget") ||
        blockContent.includes("| bash")
      ) {
        addFinding({
          type: "cisco-defense",
          severity: "high",
          line: code.slice(0, match.index).split("\n").length,
          column: 1,
          message:
            "Skill contains potentially dangerous shell commands (external downloads or piping to bash)",
          code: blockContent.split("\n")[0] + " ...",
          remediation:
            "Avoid skills that download and execute scripts directly from the internet.",
        });
      }
    }
  },
};
