import axios from "axios";
import crypto from "crypto";
import type { SecurityCheck, CheckContext } from "../types.js";

const VT_API_KEY = process.env.VIRUSTOTAL_API_KEY || "";

export const virusTotalCheck: SecurityCheck = {
  name: "malware-scan",

  async check(context: CheckContext): Promise<void> {
    if (!VT_API_KEY) return;

    // Calculate SHA-256 hash of the code
    const hash = crypto.createHash("sha256").update(context.code).digest("hex");

    try {
      const response = await axios.get(
        `https://www.virustotal.com/api/v3/files/${hash}`,
        {
          headers: { "x-apikey": VT_API_KEY },
        },
      );

      const stats = response.data.data.attributes.last_analysis_stats;
      if (stats.malicious > 0) {
        context.addFinding({
          type: "malware-scan",
          severity: "critical",
          line: 1,
          column: 1,
          message: `VirusTotal: File hash identified as malicious by ${stats.malicious} engines`,
          code: `Hash: ${hash}`,
          remediation:
            "This file is a known malware. Immediate deletion and security audit required.",
          metadata: {
            vt_link: `https://www.virustotal.com/gui/file/${hash}`,
            stats,
          },
        });
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        // File not found in VT is common for custom code, just ignore
      } else {
        // console.error("VirusTotal Scan Error:", error.message);
      }
    }
  },
};
