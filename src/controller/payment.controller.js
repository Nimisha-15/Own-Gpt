const paymentModel = require("../models/payment.model")  
const userModel = require("../models/user.model");
const Stripe = require("stripe")
 
const plans = [
  {
    _id: "basic",
    name: "Basic",
    price: 10,
    credits: 100,
    features: ['100 text generations', '50 image generations', 'Standard support', 'Access to basic models']
  },
  {
    _id: "pro",
    name: "Pro",
    price: 20,
    credits: 500,
    features: ['500 text generations', '200 image generations', 'Priority support', 'Access to pro models', 'Faster response time']
  },
  {
    _id: "premium",
    name: "Premium",
    price: 30,
    credits: 1000,
    features: ['1000 text generations', '500 image generations', '24/7 VIP support', 'Access to premium models', 'Dedicated account manager']
  }
];

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Get all available plans
 */
const getPlans = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: "Plans fetched successfully",
      plans: plans
    });
  } catch (error) {
    console.error("[Payment] Error in getPlans:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch plans"
    });
  }
};

/**
 * Purchase a plan and create Stripe checkout session
 */
const purchasePlan = async (req, res) => {
  try {
    const { planId } = req.body;
    const userId = req.user?._id;

    // Validate input
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }

    if (!planId) {
      return res.status(400).json({
        success: false,
        message: "Plan ID is required"
      });
    }

    // Find selected plan
    const plan = plans.find(p => p._id === planId);
    if (!plan) {
      return res.status(400).json({
        success: false,
        message: "Invalid plan selected"
      });
    }

    // Create transaction record
    const transaction = await paymentModel.create({
      userId: userId,
      planId: plan._id,
      amount: plan.price,
      credits: plan.credits,
      status: "pending",
      isPaid: false
    });

    // Get origin for redirect URLs
    const origin = req.headers.origin || 
                   req.headers.referer?.split('/').slice(0, 3).join('/') || 
                   "http://localhost:5173";

    console.log(`[Payment] Creating session for transaction: ${transaction._id}`);

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: plan.price * 100, // Convert to cents
            product_data: {
              name: plan.name,
              description: `${plan.credits} credits for ${plan.name} plan`
            }
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: `${origin}/loading?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/credits?cancelled=true`,
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes
      metadata: {
        transactionId: transaction._id.toString(),
        appId: 'MyGpt',
        userId: userId.toString(),
        planId: plan._id
      },
      customer_email: req.user?.email, // Pre-fill user email if available
    });

    res.status(200).json({
      success: true,
      message: "Checkout session created",
      url: session.url,
      transactionId: transaction._id,
      sessionId: session.id
    });

  } catch (error) {
    console.error("[Payment] Error in purchasePlan:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to create checkout session",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Verify payment status (optional - mostly handled by webhook)
 */
const verifyPayment = async (req, res) => {
  try {
    const { transactionId } = req.body;
    const userId = req.user?._id;

    if (!transactionId) {
      return res.status(400).json({
        success: false,
        message: "Transaction ID is required"
      });
    }

    // Find transaction
    const transaction = await paymentModel.findById(transactionId);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found"
      });
    }

    // Verify ownership
    if (transaction.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to this transaction"
      });
    }

    res.status(200).json({
      success: true,
      message: "Payment verification successful",
      data: {
        isPaid: transaction.isPaid,
        status: transaction.status,
        credits: transaction.credits,
        paidAt: transaction.paidAt
      }
    });

  } catch (error) {
    console.error("[Payment] Error in verifyPayment:", error.message);
    res.status(500).json({
      success: false,
      message: "Payment verification failed",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get user's payment history
 */
const getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user?._id;

    const transactions = await paymentModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      message: "Payment history retrieved",
      data: transactions
    });

  } catch (error) {
    console.error("[Payment] Error in getPaymentHistory:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment history"
    });
  }
};

module.exports = {
  getPlans,
  purchasePlan,
  verifyPayment,
  getPaymentHistory
};