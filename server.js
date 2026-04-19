require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDb = require("./src/config/db");
const cookieParser = require("cookie-parser");
const router = require("./src/routes/user.routes");
const ChatRouter = require("./src/routes/chat.routes");
const messageRouter = require("./src/routes/message.routes");
const PaymentRouter = require("./src/routes/payment.routes");
const { stripeWebhook } = require("./src/controller/webhook.controller.js"); 

const app = express();  // ← Create app FIRST

connectDb();

// Stripe webhook — MUST be before express.json()
app.post('/api/stripe', express.raw({ type: 'application/json' }), stripeWebhook);

// Middlewares (after webhook!)
app.use(cors({
  origin:[
    "http://localhost:5173", 
  ],
  credentials : true,
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.get('/', (req, res) => res.send('server is live'));
app.use('/api/user', router);
app.use('/api/chat', ChatRouter);
app.use('/api/message', messageRouter);
app.use('/api/payment', PaymentRouter);

const port = process.env.port || 4500;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});