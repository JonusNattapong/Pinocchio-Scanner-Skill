import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";
import type { ScanOptions } from "../types.js";

export interface AIProvider {
  generateContent(
    prompt: string,
    options?: { json?: boolean },
  ): Promise<string>;
}

export class GeminiProvider implements AIProvider {
  private genAI: GoogleGenerativeAI;
  private modelName: string;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.modelName = "gemini-pro";
  }

  async generateContent(
    prompt: string,
    options?: { json?: boolean },
  ): Promise<string> {
    const model = this.genAI.getGenerativeModel({
      model: this.modelName,
      generationConfig: options?.json
        ? { responseMimeType: "application/json" }
        : undefined,
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }
}

export class OpenAICompatibleProvider implements AIProvider {
  constructor(
    private apiKey: string,
    private baseUrl: string,
    private modelName: string,
  ) {}

  async generateContent(
    prompt: string,
    options?: { json?: boolean },
  ): Promise<string> {
    const maxRetries = 3;
    let delay = 1000;

    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await axios.post(
          `${this.baseUrl}/chat/completions`,
          {
            model: this.modelName,
            messages: [{ role: "user", content: prompt }],
            response_format: options?.json
              ? { type: "json_object" }
              : undefined,
          },
          {
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://github.com/JonusNattapong/Skill-Scanner",
              "X-Title": "Skill-Scanner Security Audit",
            },
          },
        );

        return response.data.choices[0].message.content;
      } catch (error: any) {
        if (error.response?.status === 429 && i < maxRetries - 1) {
          if (process.env.VERBOSE) {
            console.warn(
              `[AI] Rate limited (429). Retrying in ${delay / 1000}s...`,
            );
          }
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2; // Exponential backoff
          continue;
        }
        throw error;
      }
    }
    throw new Error("Max retries exceeded for AI provider");
  }
}

export class WebSearchProvider implements AIProvider {
  constructor(private baseProvider: AIProvider) {}

  async generateContent(
    prompt: string,
    options?: { json?: boolean },
  ): Promise<string> {
    // Add a prefix to the prompt to tell the model to use its search capability if it has one,
    // or we could implement a real web search here if we had an API key for search.
    // Since Gemini has built-in search via grounding (if supported), we might just pass a flag.
    // For now, we'll just enhance the prompt.
    const enhancedPrompt = `[Web Search Enabled] ${prompt}`;
    return this.baseProvider.generateContent(enhancedPrompt, options);
  }
}

export function getAIProvider(options: ScanOptions): AIProvider | null {
  const providerType = options.aiProvider || "gemini";
  let provider: AIProvider | null = null;

  if (providerType === "gemini") {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      provider = new GeminiProvider(apiKey);
    }
  } else if (providerType === "opencode") {
    const apiKey = process.env.OPENCODE_API_KEY || "sk-dummy";
    const baseUrl = process.env.OPENCODE_API_BASE || "http://localhost:8080/v1";
    provider = new OpenAICompatibleProvider(
      apiKey,
      baseUrl,
      options.aiModel || "opencode-model",
    );
  } else if (providerType === "molt") {
    const apiKey = process.env.MOLT_API_KEY || "sk-dummy";
    const baseUrl = process.env.MOLT_API_BASE || "http://localhost:9000/v1";
    provider = new OpenAICompatibleProvider(
      apiKey,
      baseUrl,
      options.aiModel || "molt-model",
    );
  } else if (providerType === "openrouter") {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (apiKey) {
      provider = new OpenAICompatibleProvider(
        apiKey,
        "https://openrouter.ai/api/v1",
        options.aiModel || "meta-llama/llama-3.1-8b-instruct:free",
      );
    }
  } else if (providerType === "openai") {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      provider = new OpenAICompatibleProvider(
        apiKey,
        "https://api.openai.com/v1",
        options.aiModel || "gpt-4o-mini",
      );
    }
  }

  if (provider && options.webSearch) {
    provider = new WebSearchProvider(provider);
  }

  return provider;
}
