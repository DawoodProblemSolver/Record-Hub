import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("Please set GEMINI_API_KEY in your environment or .env.local");
  process.exit(1);
}
const genAI = new GoogleGenerativeAI(apiKey);

async function testGemini38() {
  try {
    console.log("Testing model: gemini-3.8-flash...");
    const model = genAI.getGenerativeModel({ model: "gemini-3.8-flash" });
    const result = await model.generateContent("Hello! What is 2 + 2? Reply with just the number.");
    const response = await result.response;
    console.log("✓ SUCCESS with gemini-3.8-flash! Response:", response.text().trim());
  } catch (err) {
    console.error("Failed:", err);
  }
}

testGemini38();
