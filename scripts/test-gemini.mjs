import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("Please set GEMINI_API_KEY in your environment or .env.local");
  process.exit(1);
}
const genAI = new GoogleGenerativeAI(apiKey);

async function testModels() {
  const candidateModels = [
    "gemini-2.0-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-pro",
    "gemini-pro",
    "gemini-2.5-flash",
  ];

  for (const m of candidateModels) {
    try {
      console.log(`Testing model: ${m}...`);
      const model = genAI.getGenerativeModel({ model: m });
      const result = await model.generateContent("Hello, reply with 'OK'");
      const response = await result.response;
      console.log(`✓ Model ${m} SUCCESS! Response:`, response.text().trim());
      return m;
    } catch (err) {
      console.log(`✗ Model ${m} failed:`, err.message || err);
    }
  }
}

testModels();
