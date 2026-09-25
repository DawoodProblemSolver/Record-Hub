import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn("Warning: GEMINI_API_KEY is not defined in environment variables.");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || "");

export async function askGemini(prompt: string, systemInstruction?: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API key is not configured.");
  }

  // Use gemini-3.8-flash (latest high-performance production model)
  const model = genAI.getGenerativeModel({
    model: "gemini-3.8-flash",
    systemInstruction: systemInstruction || "You are an AI attendance assistant. Be clear, accurate, and concise.",
  });

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}
