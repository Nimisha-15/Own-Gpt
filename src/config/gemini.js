const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const gemini = genAI.getGenerativeModel({ 
  model: "gemini-3-flash-preview"  // Latest, fastest, smartest for chats
});

module.exports = gemini;