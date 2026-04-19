// webhook.controller.js

const Stripe = require("stripe");
const paymentModel = require("../models/payment.model");
const userModel = require("../models/user.model");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Handles Stripe webhook events for payment processing
 * CRITICAL: This route MUST use raw body middleware, not JSON parsing
 */
const stripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];

  // Validate webhook signature
  if (!sig) {
    console.error("[Webhook] Missing stripe-signature header");
    return res.status(400).json({ error: "Missing stripe-signature header" });
  }

  let event;

  try {
    // IMPORTANT: req.body must be raw buffer/string, not parsed JSON
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("[Webhook] Signature verification failed:", err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  console.log(`[Webhook] Received event: ${event.type}`);

  try {
    // Handle successful checkout
    if (event.type === "checkout.session.completed") {
      await handleCheckoutCompleted(event.data.object);
    }
    // Handle payment intent failed
    else if (event.type === "charge.failed") {
      await handleChargeFailed(event.data.object);
    }

    // Acknowledge successful processing
    return res.status(200).json({ received: true, success: true });
  } catch (error) {
    console.error("[Webhook] Error processing event:", error);
    // Return 200 to prevent retries, but log the error
    return res.status(200).json({ received: true, error: error.message });
  }
};

/**
 * Handle checkout session completion
 */
const handleCheckoutCompleted = async (session) => {
  const { transactionId, appId } = session.metadata || {};

  // Validate metadata
  if (!transactionId || !appId) {
    console.error("[Webhook] Missing required metadata in session");
    throw new Error("Missing required metadata");
  }

  // Verify app ID
  if (appId !== "MyGpt") {
    console.warn(`[Webhook] Ignoring event from different app: ${appId}`);
    return;
  }

  try {
    // Find transaction with idempotency check
    const transaction = await paymentModel.findById(transactionId);

    if (!transaction) {
      console.error(`[Webhook] Transaction not found: ${transactionId}`);
      throw new Error("Transaction not found");
    }

    // Check if already processed
    if (transaction.isPaid) {
      console.log(`[Webhook] Transaction already paid: ${transactionId}`);
      return;
    }

    // Validate payment amount matches
    const sessionAmount = Math.round(session.amount_total / 100); // Convert cents to dollars
    if (transaction.amount !== sessionAmount) {
      console.error(
        `[Webhook] Amount mismatch for transaction ${transactionId}: expected ${transaction.amount}, got ${sessionAmount}`
      );
      throw new Error("Payment amount mismatch");
    }

    // Update user credits (atomic operation)
    const userUpdateResult = await userModel.findByIdAndUpdate(
      transaction.userId,
      { $inc: { credits: transaction.credits } },
      { new: true, runValidators: false }
    );

    if (!userUpdateResult) {
      console.error(
        `[Webhook] User not found: ${transaction.userId}`
      );
      throw new Error("User not found");
    }

    // Mark transaction as paid
    transaction.isPaid = true;
    transaction.paidAt = new Date();
    transaction.stripeSessionId = session.id;
    await transaction.save();

    console.log(
      `[Webhook] ✓ Successfully processed: Added ${transaction.credits} credits to user ${transaction.userId}`
    );
  } catch (error) {
    console.error(`[Webhook] Error in handleCheckoutCompleted:`, error.message);
    throw error;
  }
};

/**
 * Handle failed charges
 */
const handleChargeFailed = async (charge) => {
  const { metadata } = charge;

  if (!metadata?.transactionId) {
    console.warn("[Webhook] Charge failed but no transaction ID in metadata");
    return;
  }

  try {
    // Mark transaction as failed
    await paymentModel.findByIdAndUpdate(
      metadata.transactionId,
      { failureReason: charge.failure_message || "Payment failed" },
      { new: true }
    );

    console.log(
      `[Webhook] Charge failed for transaction ${metadata.transactionId}: ${charge.failure_message}`
    );
  } catch (error) {
    console.error("[Webhook] Error handling failed charge:", error.message);
  }
};

module.exports = { stripeWebhook };