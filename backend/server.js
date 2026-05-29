// ============================================================
//  MuseFlow AI — Express + Socket.IO Entry Point
// ============================================================
import express from "express";
import http from "http";
import crypto from "crypto";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import { Server } from "socket.io";

import connectDB from "./config/db.js";
import { errorHandler, notFound } from "./middleware/error.js";
import { initSockets } from "./sockets/index.js";

// ── Routes ────────────────────────────────────────────────
import authRoutes         from "./routes/auth.js";
import userRoutes         from "./routes/user.js";
import projectRoutes      from "./routes/project.js";
import taskRoutes         from "./routes/task.js";
import paymentRoutes      from "./routes/payment.js";
import contributionRoutes from "./routes/contribution.js";
import messageRoutes      from "./routes/message.js";
import notificationRoutes from "./routes/notification.js";
import reviewRoutes       from "./routes/review.js";
import analyticsRoutes    from "./routes/analytics.js";
import adminRoutes        from "./routes/admin.js";
import aiRoutes           from "./routes/ai.js";

dotenv.config();
connectDB();

const app    = express();
const server = http.createServer(app);

// ── CORS origins ─────────────────────────────────────────
const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://localhost:5174",
  "https://crewsync-ai.netlify.app",
].filter(Boolean);

function corsOrigin(origin, callback) {
  // allow server-to-server (no Origin header) and known origins
  if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
  callback(new Error(`CORS: origin ${origin} not allowed`));
}

// ── Socket.IO ────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    methods: ["GET", "POST"],
    credentials: true,
  },
});
initSockets(io);
app.set("io", io);

// ── Global Middleware ─────────────────────────────────────
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(cors({ origin: corsOrigin, credentials: true }));

// ── Razorpay Webhook — MUST be before express.json() to get raw body ──
app.post("/api/webhooks/razorpay",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      const sig  = req.headers["x-razorpay-signature"];
      const body = req.body.toString();
      const expectedSig = crypto
        .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest("hex");

      if (sig !== expectedSig) {
        return res.status(400).json({ error: "Invalid webhook signature" });
      }

      const event = JSON.parse(body);
      // payment.captured = async payment success (e.g. UPI, net banking)
      if (event.event === "payment.captured") {
        const p = event.payload.payment.entity;
        const { projectId, clientId } = p.notes || {};
        if (projectId) {
          const { default: Payment } = await import("./models/Payment.js");
          const { default: Project } = await import("./models/Project.js");
          const alreadyRecorded = await Payment.exists({ transactionId: `RZP-${p.id}` });
          if (!alreadyRecorded) {
            const amountINR = p.amount / 100;
            await Payment.create({
              project:       projectId,
              payer:         clientId,
              amount:        amountINR,
              currency:      "INR",
              type:          "milestone",
              status:        "in_escrow",
              paymentMethod: "razorpay",
              transactionId: `RZP-${p.id}`,
              notes:         `Webhook capture · Order: ${p.order_id}`,
            });
            await Project.findByIdAndUpdate(projectId, { $inc: { escrowBalance: amountINR } });
          }
        }
      }
      res.json({ received: true });
    } catch (err) {
      console.error("Webhook error:", err.message);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  }
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ── Rate Limiting ─────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again later." },
});
app.use("/api", limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: "Too many auth attempts." },
});

// ── API Routes ────────────────────────────────────────────
app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "CrewSync AI API", version: "2.0.0" }));

app.use("/api/auth",          authLimiter, authRoutes);
app.use("/api/users",         userRoutes);
app.use("/api/projects",      projectRoutes);
app.use("/api/tasks",         taskRoutes);
app.use("/api/payments",      paymentRoutes);
app.use("/api/contributions", contributionRoutes);
app.use("/api/messages",      messageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reviews",       reviewRoutes);
app.use("/api/analytics",     analyticsRoutes);
app.use("/api/admin",         adminRoutes);
app.use("/api/ai",            aiRoutes);

// ── Error Handlers ────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Boot ──────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`🚀 MuseFlow AI server running on port ${PORT} [${process.env.NODE_ENV || "development"}]`)
);

export default app;
