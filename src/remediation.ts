import type { SecurityFinding, ScanOptions } from "./types.js";
import { getAIProvider } from "./utils/ai-provider.js";

/**
 * Generate a remediation suggestion using an AI provider.
 * Returns a copy-pasteable code snippet or an explanatory marker on failure.
 */
export async function generateRemediation(
  finding: SecurityFinding,
  options: ScanOptions = {},
): Promise<string> {
  const provider = getAIProvider(options);
  if (!provider) {
    return "[AI-Generated Fix] AI provider not configured. Set provider via --provider or environment variables.";
  }

  // Prompt engineered to ask for a single copy-pastable secure replacement.
  const prompt = `Analyze the following security finding and return a secure code replacement only.\nRespond with the corrected code snippet only (no explanation, no markdown fences).\n\nVulnerability Type: ${finding.type}\nSeverity: ${finding.severity}\nFile: ${finding.filePath}\nLine: ${finding.line}\nMessage: ${finding.message}\n\nVulnerable Code Snippet:\n${finding.code}\n\nProvide a secure, minimal, and idiomatic replacement. If multiple lines are required, return valid runnable code for the relevant language.`;

  try {
    const text = await provider.generateContent(prompt, { json: false });
    // Remove common markdown fences and trim so it's copy-pastable.
    return text
      .replace(/```(typescript|javascript|python|go|rust)?/g, "")
      .replace(/```/g, "")
      .trim();
  } catch (error) {
    console.error("Error generating remediation:", error);
    return `[AI-Generated Fix] Error generating fix for ${finding.type}.`;
  }
}
