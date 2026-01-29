/**
 * OWASP Top 10 for LLM Applications (2025)
 * Maps internal check types to OWASP categories
 */

export interface OWASPInfo {
  id: string;
  name: string;
  description: string;
  link: string;
}

export const OWASP_LLM_TOP_10: Record<string, OWASPInfo> = {
  LLM01: {
    id: "LLM01",
    name: "Prompt Injection",
    description:
      "Manipulating LLMs via crafted inputs to override instructions or safety measures.",
    link: "https://owasp.org/www-project-top-10-for-large-language-model-applications/",
  },
  LLM02: {
    id: "LLM02",
    name: "Sensitive Information Disclosure",
    description:
      "LLMs revealing sensitive data like PII, credentials, or proprietary information.",
    link: "https://owasp.org/www-project-top-10-for-large-language-model-applications/",
  },
  LLM03: {
    id: "LLM03",
    name: "Supply Chain Vulnerabilities",
    description:
      "Risks from third-party datasets, pre-trained models, and plugins.",
    link: "https://owasp.org/www-project-top-10-for-large-language-model-applications/",
  },
  LLM04: {
    id: "LLM04",
    name: "Data and Model Poisoning",
    description:
      "Tampering with training data to compromise security or behavior.",
    link: "https://owasp.org/www-project-top-10-for-large-language-model-applications/",
  },
  LLM05: {
    id: "LLM05",
    name: "Improper Output Handling",
    description:
      "Insufficient validation of LLM outputs leading to downstream exploits like XSS or command injection.",
    link: "https://owasp.org/www-project-top-10-for-large-language-model-applications/",
  },
  LLM06: {
    id: "LLM06",
    name: "Excessive Agency",
    description:
      "LLMs taking actions without sufficient human oversight or having too many permissions.",
    link: "https://owasp.org/www-project-top-10-for-large-language-model-applications/",
  },
  LLM07: {
    id: "LLM07",
    name: "System Prompt Leakage",
    description:
      "Disclosure of the LLM's internal system instructions or configuration.",
    link: "https://owasp.org/www-project-top-10-for-large-language-model-applications/",
  },
  LLM08: {
    id: "LLM08",
    name: "Vector and Embedding Weaknesses",
    description:
      "Vulnerabilities in how LLMs generate, store, or retrieve vectors and embeddings.",
    link: "https://owasp.org/www-project-top-10-for-large-language-model-applications/",
  },
  LLM09: {
    id: "LLM09",
    name: "Misinformation",
    description:
      "LLMs producing false or misleading information (hallucinations).",
    link: "https://owasp.org/www-project-top-10-for-large-language-model-applications/",
  },
  LLM10: {
    id: "LLM10",
    name: "Unbounded Consumption",
    description:
      "LLMs being manipulated to process excessive resources, leading to denial-of-service.",
    link: "https://owasp.org/www-project-top-10-for-large-language-model-applications/",
  },
};

/**
 * Maps our internal check types to OWASP LLM Top 10 categories
 */
export function mapToOWASP(checkType: string, message: string): string[] {
  const mappings: string[] = [];

  // Direct mappings based on check type
  switch (checkType) {
    case "command-injection":
    case "code-injection":
      mappings.push("LLM05"); // Improper Output Handling
      mappings.push("LLM06"); // Excessive Agency
      break;
    case "hardcoded-secret":
      mappings.push("LLM02"); // Sensitive Information Disclosure
      break;
    case "dependency-audit":
      mappings.push("LLM03"); // Supply Chain
      break;
    case "semantic-analysis":
      // Context-based mapping for AI analysis
      if (
        message.toLowerCase().includes("prompt injection") ||
        message.toLowerCase().includes("jailbreak") ||
        message.toLowerCase().includes("ignore previous")
      ) {
        mappings.push("LLM01"); // Prompt Injection
      }
      if (
        message.toLowerCase().includes("exfiltration") ||
        message.toLowerCase().includes("credential") ||
        message.toLowerCase().includes("secret")
      ) {
        mappings.push("LLM02"); // Sensitive Info Disclosure
      }
      if (
        message.toLowerCase().includes("backdoor") ||
        message.toLowerCase().includes("persistence") ||
        message.toLowerCase().includes("shell")
      ) {
        mappings.push("LLM06"); // Excessive Agency
      }
      break;
    case "cisco-defense":
      mappings.push("LLM06"); // Excessive Agency
      break;
    case "file-system":
      mappings.push("LLM06"); // Excessive Agency
      break;
  }

  return mappings.length > 0 ? mappings : ["LLM06"]; // Default to Excessive Agency
}
