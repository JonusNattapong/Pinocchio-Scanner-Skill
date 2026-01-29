import { scanCode } from "@jonusnattapong/skill-scanner";

const myCode = `
  const apiKey = "12345-ABCDE";
  exec("rm -rf " + userInput);
`;

const runScan = async () => {
  const findings = await scanCode(myCode, {
    severityThreshold: "medium",
    checks: ["hardcoded-secret", "command-injection"],
  });

  findings.forEach((finding) => {
    console.log(`[${finding.severity.toUpperCase()}] ${finding.message}`);
    console.log(`Line: ${finding.line}, Column: ${finding.column}`);
  });
};

runScan();
