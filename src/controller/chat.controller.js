const chatModel = require("../models/chat.model")

const newChatController = async (req,res)=>{
    try {
        const userId = req.user._id;
        const chatData ={
            userId :userId,
            messages : [],
            name : "New Chat",
            userName : req.user.name
        }
        const createdChat = await chatModel.create(chatData)
        res.status(200).json({
            success : true,
            message : "Chat created successfully !!",
            createdChat
        })
          
    } catch (error) {
        console.log("error in chat controller create chats--->" , error)
        return res.status(400).json({
            message : "error in chat created"
        })
        
    }
}

// api controller to get chats 

const getChats = async (req,res)=>{
    try {
        const userId = req.user._id;
        const chats = await chatModel
  .find({ userId: userId })
  .sort({ updatedAt: -1 })

        return res.status(200).json({
            success : true,
            message : "Chat get api called !!",
            chats : chats
        })
          
    } catch (error) {
        console.log("error in chat controller get chats --->" , error)
        return res.status(400).json({
            message : "error in chat get"
        })
        
    }
}

// api for deleting selected chat
const deleteChats = async (req,res)=>{
    try {
        const userId = req.user._id;
        const {chatId} = req.body 

        const chats = await chatModel.deleteOne({
  _id: chatId,
  userId: userId
})
        return res.status(200).json({
            success : true,
            message : "Chat deleted  successfully !!",
            chats : chats
        })
          
    } catch (error) {
        console.log("error in chat controller deleting --->" , error)
        return res.status(400).json({
            message : "error in chat delete"
        })
        
    }
}

module.exports = {
    newChatController,
    deleteChats,
    getChats,
}