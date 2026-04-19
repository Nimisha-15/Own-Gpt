const axios = require("axios")
const chatModel = require("../models/chat.model")
const userModel = require("../models/user.model")
const imagekit = require("../config/imagekit")
const gemini = require("../config/gemini")

const textMessageController = async (req, res) => {
  try {
    const { chatId, prompt } = req.body;
    const userId = req.user._id;

    // Validate chat
    const chat = await chatModel.findOne({ _id: chatId, userId });
    if (!chat) {
      return res.status(404).json({ success: false, message: "Chat not found" });
    }

    // Check credits (add deduction for text, e.g., -1)
    if (req.user.credits < 1) {
      return res.status(403).json({ message: "Insufficient credits" });
    }

    // Push user message to DB
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
         }  // Update timestamp
      }
    );

    // Generate AI response with Gemini
    const result = await gemini.generateContent(prompt);
    const aiResponse = await result.response.text();
    console.log(aiResponse);

    // Push assistant message to DB
    const reply = {
      role: "assistant",
      content: aiResponse,
      timestamp: Date.now(),
      isImage: false
    };
    await chatModel.findOneAndUpdate(
      { _id: chatId, userId },
      { 
        $push: { messages: reply },
        $set: { updatedAt: new Date() }
      }
    );

    // Deduct credits
    await userModel.updateOne({ _id: userId }, { $inc: { credits: -1 } });

    res.json({ 
      success: true, 
      reply 
    });
  } catch (error) {
    console.error("TEXT ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

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

    // Encode prompt
    const encodedPrompt = encodeURIComponent(prompt);

    // Construct ImageKit AI Generation URL
    const generatedImageURL = `${process.env.IMAGEKIT_URL_ENDPOINT}/ik-genimg-prompt-${encodedPrompt}/mygpt/${Date.now()}.png?tr=w-800,h-800`;
    
    // Trigger generation by fetching from ImageKit
    const aiImageResponse = await axios.get(generatedImageURL, {
      responseType: "arraybuffer"
    });

    // Convert to base64
    const base64Image = `data:image/png;base64,${Buffer.from(aiImageResponse.data, "binary").toString('base64')}`;

    // Upload to ImageKit media library
    const uploadResponse = await imagekit.upload({
      file: base64Image,
      fileName: `${Date.now()}.png`,
      folder: "MyGpt"
    });

    const reply = {
      role: "assistant",
      content: uploadResponse.url,
      timestamp: Date.now(),
      isImage: true,
      isPublished
    };

    // Push reply to DB
    await chatModel.findOneAndUpdate(
      { _id: chatId, userId },
      { 
        $push: { messages: reply },
        $set: { updatedAt: new Date() }
      }
    );

    // Deduct credits
    await userModel.updateOne({ _id: userId }, { $inc: { credits: -2 } });

    res.status(200).json({
      success: true,
      reply
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