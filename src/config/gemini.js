const { GoogleGenAI } = require("@google/genai");



const gemini = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY,  // Latest, fastest, smartest for chats
});

module.exports = gemini;