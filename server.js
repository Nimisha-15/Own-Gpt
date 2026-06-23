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

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://sensational-pastelito-de53fe.netlify.app", // 🔥 FIXED: Added your Netlify Production URL
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log("🚫 CORS blocked for origin:", origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
}));

connectDb();

// Stripe webhook — MUST be before express.json()
app.post('/api/stripe', express.raw({ type: 'application/json' }), stripeWebhook);

app.use(express.json());
app.use(cookieParser());

// Routes
app.get('/', (req, res) => res.send('server is live'));
app.get('/api/health', (req, res) => res.json({ status: 'live', version: '2.0-bearer-fixed', timestamp: new Date() }));
app.use('/api/user', router);
app.use('/api/chat', ChatRouter);
app.use('/api/message', messageRouter);
app.use('/api/payment', PaymentRouter);

const port = process.env.PORT || 4500;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});