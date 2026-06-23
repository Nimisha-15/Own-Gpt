const axios = require("axios")
const chatModel = require("../models/chat.model")
const userModel = require("../models/user.model")
const imagekit = require("../config/imagekit")
const gemini = require("../config/gemini")

const textMessageController = async (req, res) => {
  try {
    const { chatId, prompt } = req.body;
    const userId = req.user._id;

    const chat = await chatModel.findOne({ _id: chatId, userId });
    if (!chat) {
      return res.status(404).json({ success: false, message: "Chat not found" });
    }

    if (req.user.credits < 1) {
      return res.status(403).json({ message: "Insufficient credits" });
    }

    const userMessage = {
      role: "user",
      content: prompt,
      timestamp: Date.now(),
      isImage: false,
    };

    const result = await gemini.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const aiResponse = result.text;
    const reply = {
      role: "assistant",
      content: aiResponse,
      timestamp: Date.now(),
      isImage: false,
    };

    const updatedChat = await chatModel.findOneAndUpdate(
      { _id: chatId, userId },
      {
        $push: {
          messages: {
            $each: [userMessage, reply],
          },
        },
        $set: {
          updatedAt: new Date(),
          name:
            chat.name === "New Chat"
              ? prompt.slice(0, 40) + (prompt.length > 40 ? "..." : "")
              : chat.name,
        },
      },
      { new: true },
    );

    await userModel.updateOne({ _id: userId }, { $inc: { credits: -1 } });

    res.json({
      success: true,
      chat: updatedChat,
      reply,
    });
  } catch (error) {
    console.error("TEXT ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Image Generation message controller (unchanged, but added updatedAt for consistency)
const imageMessageController = async (req, res) => {
  try {
    const userId = req.user._id;
    if (req.user.credits < 2) {
      return res.status(404).json({ message: "Credits is less than 2" });
    }
    const { prompt, chatId, isPublished } = req.body;

    // Validate chat
    const chat = await chatModel.findOne({ _id: chatId, userId });
    if (!chat) {
      return res.status(404).json({ success: false, message: "Chat not found" });
    }

    // Push user message
    await chatModel.findOneAndUpdate(
      { _id: chatId, userId },
      { 
        $push: { 
          messages: { 
            role: "user", 
            content: prompt, 
            timestamp: Date.now(), 
            isImage: false 
          } 
        },
        $set: { updatedAt: new Date(),
          name: chat.name === "New Chat" ? prompt.slice(0, 40) + (prompt.length > 40 ? "..." : "") : chat.name
         }
      }
    );

    const encodedPrompt = encodeURIComponent(prompt);

    const imageResult = await gemini.models.generateImages({
      model: "imagen-4.0-generate-001",
      prompt,
      config: {
        numberOfImages: 1,
      },
    });

    const aiImageResponse = imageResult.generatedImages?.[0]?.image;

    if (!aiImageResponse?.imageBytes) {
      return res.status(500).json({ success: false, message: "Image generation failed" });
    }

    const base64Image = `data:image/png;base64,${Buffer.from(aiImageResponse.imageBytes, "base64").toString("base64")}`;

    // Upload to ImageKit media library
    const uploadResponse = await imagekit.upload({
      file: base64Image,
      fileName: `${Date.now()}.png`,
      folder: "MyGpt"
    });

//     console.log(
//   "AI response content-type:",
//   aiImageResponse.headers["content-type"]
// );

// console.log(
//   "AI response size:",
//   aiImageResponse.data.length
// );

    const reply = {
      role: "assistant",
      content: uploadResponse.url,
      timestamp: Date.now(),
      isImage: true,
      isPublished
    };

    const updatedChat = await chatModel.findOneAndUpdate(
      { _id: chatId, userId },
      {
        $push: { messages: reply },
        $set: { updatedAt: new Date() },
      },
      { new: true },
    );

    await userModel.updateOne({ _id: userId }, { $inc: { credits: -2 } });

    res.status(200).json({
      success: true,
      chat: updatedChat,
      reply,
    });

  } catch (error) {
    console.log("error in image message controller --->", error);
    res.status(403).json({
      message: "error found in image generation"
    });
  }
};

module.exports = {
  textMessageController,
  imageMessageController,
};