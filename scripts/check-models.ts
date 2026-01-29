import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

async function listModels() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    console.log("Checking gemini-1.5-flash...");
    const result = await model.generateContent("test");
    console.log("Success!");
  } catch (e: any) {
    console.error("Error:", e.message);
  }
}

listModels();
