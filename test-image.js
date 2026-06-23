require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function test() {
  try {
    const result = await ai.models.generateContent({
      model: "imagen-4.0-fast-generate-001",
      contents: "A cute baby panda eating bamboo, ultra realistic",
    });

    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error);
  }
}

test();