import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

async function findVaildModel() {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`,
    );
    const data: any = await response.json();
    const models = data.models || [];
    const validModels = models.filter((m: any) =>
      m.supportedGenerationMethods.includes("generateContent"),
    );
    console.log("Valid Models for generateContent:");
    validModels.forEach((m: any) => console.log(`- ${m.name}`));
  } catch (e: any) {
    console.error("Error:", e.message);
  }
}

findVaildModel();
