const express = require("express")
const { registerController, loginController, getPublishedImages ,logoutController } = require("../controller/user.controller")
const authMiddleWare = require("../middleware/auth.middleware");

const router = express.Router();

router.post('/register' , registerController)
router.post('/login' , loginController)
router.post("/logout" , authMiddleWare, logoutController);
router.get('/published-images' ,getPublishedImages)

router.get("/data", authMiddleWare, async (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});
module.exports = router;