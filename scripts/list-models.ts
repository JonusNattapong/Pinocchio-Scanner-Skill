import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

async function main() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
    console.log(genAI);
  } catch (err) {
    console.error(err);
  }
}

main();