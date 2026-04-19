require("dotenv").config()
const jwt = require("jsonwebtoken")
const userModel = require("../models/user.model")

const authMiddleWare = async (req ,res ,next)=>{
    try {
        // Extract token from Header or Cookie
        const token = req.headers.authorization?.split(" ")[1] || req.cookies?.token;
         
        if(!token){
            return res.status(401).json({
                message : 'token not found '
            })
        }
        let verifyToken = jwt.verify(token ,process.env.JWT_SECRET)
        
        let user = await userModel.findById(verifyToken.id)
        if(!user){
            return res.status(401).json({
                message : "invalid token "
            })
        }
        req.user = user;
        next()
    } catch (error) {
  return res.status(401).json({
    success: false,
    message: "Unauthorized"
  });
}
}
module.exports = authMiddleWare