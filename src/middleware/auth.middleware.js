require("dotenv").config()
const jwt = require("jsonwebtoken")
const userModel = require("../models/user.model")

const authMiddleWare = async (req ,res ,next)=>{
    try {
        let token = req.cookies.token ;
         
        if(!token){
            return res.status(404).json({
                message : 'token not found '
            })
        }
        let verifyToken = jwt.verify(token ,process.env.JWT_SECRET)
        
        let user = await userModel.findById(verifyToken.id)
        if(!user){
            return res.status(404).json({
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