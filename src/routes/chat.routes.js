const express = require("express")
const { newChatController, getChats, deleteChats } = require("../controller/chat.controller")
const authMiddleWare = require("../middleware/auth.middleware")

const ChatRouter = express.Router()

ChatRouter.get('/create-chat' , authMiddleWare, newChatController)
ChatRouter.get('/get-chat' , authMiddleWare, getChats)
ChatRouter.post('/delete-chat' , authMiddleWare, deleteChats)

module.exports = ChatRouter