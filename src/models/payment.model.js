const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "userModel",
      required: true,
      index: true,
    },

    planId: { 
      type: String, 
      required: true 
    },
    
    amount: { 
      type: Number, 
      required: true 
    },
    
    credits: { 
      type: Number, 
      required: true 
    },
    
    isPaid: { 
      type: Boolean, 
      default: false,
      index: true,
    },

    // Stripe integration fields
    stripeSessionId: {
      type: String,
      unique: true,
      sparse: true,
      default: null,
    },

    paidAt: {
      type: Date,
      default: null,
    },

    failureReason: {
      type: String,
      default: null,
    },

    // Payment status tracking
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
      index: true,
    },
  },
  { timestamps: true }
);

// Index for efficient queries
paymentSchema.index({ userId: 1, isPaid: 1 });
paymentSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Payment", paymentSchema);