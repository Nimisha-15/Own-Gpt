const express = require("express");
const {
  purchasePlan,
  verifyPayment,
  getPlans,
  getPaymentHistory,
} = require("../controller/payment.controller");
const authMiddleware = require("../middleware/auth.middleware");

const paymentRouter = express.Router();

// Public routes
paymentRouter.get("/plans", getPlans);

// Protected routes (require authentication)
paymentRouter.post("/purchase", authMiddleware, purchasePlan);
paymentRouter.post("/verify", authMiddleware, verifyPayment);
paymentRouter.get("/history", authMiddleware, getPaymentHistory);

module.exports = paymentRouter;