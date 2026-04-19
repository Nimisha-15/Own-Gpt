const express = require("express");
const authMiddleWare = require("../middleware/auth.middleware");
const { textMessageController, imageMessageController } = require("../controller/message.controller");

const messageRouter = express.Router();

messageRouter.post("/text", authMiddleWare, textMessageController);
messageRouter.post("/image", authMiddleWare, imageMessageController);

module.exports = messageRouter;
