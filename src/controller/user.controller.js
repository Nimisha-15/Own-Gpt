const userModel = require("../models/user.model")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")
const chatModel = require("../models/chat.model")
const messageRouter = require("../routes/message.routes")

const registerController = async (req, res) => {
  try {
    console.log("Register body:", req.body); // Debug
    
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password required!"
      });
    }

    // Check existing user
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered!"
      });
    }
        
       const newUser = await userModel.create({
      name,
      email,
      password
    });

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: '30d'
    });
    
    res.cookie("token", token, {
  httpOnly: true,
  secure: false, 
  sameSite: 'lax',
});

    console.log("User registered:", newUser.email); 
    
    return res.status(201).json({
      success: true,
      message: "User registered successfully!",
      user: { id: newUser._id, name: newUser.name, email: newUser.email }
    });

    } catch (error) {
    console.error("🚨 REGISTER ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during registration"
    });
    }
}

// api for login user

const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password required"
      });
    }

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Incorrect email or password"
      });
    }

    const isMatch = await user.comparePass(password); // assuming comparePass is async
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Incorrect email or password"
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    const cookieOptions = {
  httpOnly: true,
  secure: false,
  sameSite: "lax"
};

res.cookie("token", token, cookieOptions);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: { id: user._id, name: user.name, email: user.email }
    });

  } catch (error) {
    console.log("error in login controller ---->", error);
    return res.status(500).json({
      success: false,
      message: "Server error during login"
    });
  }
};


// logout hona
const logoutController = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      sameSite: "none"
    });
    return res.status(200).json({
      success: true,
      message: "Logout successful"
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Logout failed"
    });
  }
};


// api to get published images
const getPublishedImages = async (req, res) => {
  try {
    const publishedImageMessages = await chatModel.aggregate([
      { $unwind: "$messages" },
      {
        $match: {
          "messages.isImage": true,
          "messages.isPublished": true
        }
      },
      {
        $project: {
          _id: 0,
          imageUrl: "$messages.content",
          userName: "$userName",
          timestamp: "$messages.timestamp"
        }
      },
      { $sort: { timestamp: -1 } } // Newest first
    ]);

    res.status(200).json({
      success: true,
      images: publishedImageMessages
    });

  } catch (error) {
    console.log("error in publish images --->" , error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch images"
    });
  }
};

module.exports={
    registerController,
    loginController,
    getPublishedImages,
    logoutController
}