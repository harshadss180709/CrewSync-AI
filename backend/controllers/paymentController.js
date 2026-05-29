import Payment from "../models/Payment.js";
import Project from "../models/Project.js";
import Contribution from "../models/Contribution.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import { pushNotification } from "./notificationController.js";
import crypto from "crypto";
import Razorpay from "razorpay";

const razorpay = (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET &&
  !process.env.RAZORPAY_KEY_ID.includes("your_key"))
  ? new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET })
  : null;

// ── @POST /api/payments ───────────────────────────────────
export const createPayment = async (req, res, next) => {
  try {
    const { projectId, milestoneId, amount, type, notes, dueDate } = req.body;
    const project = await Project.findById(projectId).populate("freelancers");
    if (!project) return res.status(404).json({ success: false, message: "Project not found." });

    // Auto-compute contribution-based splits
    const contributions = await Contribution.find({ project: projectId });
    const total = contributions.reduce((s, c) => s + c.contributionScore, 0);
    const splits = contributions.map(c => ({
      freelancer:        c.freelancer,
      contributionBased: true,
      percentage:        total > 0 ? parseFloat(((c.contributionScore / total) * 100).toFixed(2)) : 0,
      amount:            total > 0 ? parseFloat(((c.contributionScore / total) * amount).toFixed(2)) : 0,
    }));

    const payment = await Payment.create({
      project:   projectId,
      milestone: milestoneId,
      payer:     req.user._id,
      amount,
      type,
      notes,
      dueDate,
      splits,
      status:    "in_escrow",
      approvalHistory: [{ action: "submitted", performedBy: req.user._id }],
    });

    // Update escrow
    project.escrowBalance += amount;
    await project.save({ validateBeforeSave: false });

    // Notify freelancers
    for (const split of splits) {
      await pushNotification(req.app, {
        recipient: split.freelancer,
        sender:    req.user._id,
        type:      "payment_pending",
        title:     "Payment In Escrow",
        message:   `$${split.amount.toFixed(2)} is held in escrow for "${project.title}".`,
        link:      `/payments/${payment._id}`,
        priority:  "high",
      });
    }

    res.status(201).json({ success: true, message: "Payment created and held in escrow.", payment });
  } catch (err) { next(err); }
};

// ── @GET /api/payments ────────────────────────────────────
export const getPayments = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = {};
    if (req.user.role === "client")     query.payer = req.user._id;
    if (req.user.role === "freelancer") query["splits.freelancer"] = req.user._id;
    // admin sees all payments — no filter applied
    if (status) query.status = status;

    const total    = await Payment.countDocuments(query);
    const payments = await Payment.find(query)
      .populate("project", "title projectType")
      .populate("payer",   "name avatar")
      .populate("splits.freelancer", "name avatar")
      .sort("-createdAt")
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, total, payments });
  } catch (err) { next(err); }
};

// ── @PUT /api/payments/:id/approve ───────────────────────
export const approvePayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id).populate("project");
    if (!payment) return res.status(404).json({ success: false, message: "Payment not found." });
    if (payment.payer.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorised." });
    }

    payment.status = "approved";
    payment.approvalHistory.push({ action: "approved", performedBy: req.user._id, note: req.body.note });
    await payment.save();

    res.json({ success: true, message: "Payment approved.", payment });
  } catch (err) { next(err); }
};

// ── @PUT /api/payments/:id/release ───────────────────────
export const releasePayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id).populate("project");
    if (!payment) return res.status(404).json({ success: false, message: "Payment not found." });

    if (payment.status !== "approved") {
      return res.status(400).json({ success: false, message: "Payment must be approved before release." });
    }

    payment.status     = "released";
    payment.releasedAt = Date.now();
    payment.approvalHistory.push({ action: "released", performedBy: req.user._id });

    for (const split of payment.splits) {
      split.released   = true;
      split.releasedAt = Date.now();

      // Credit freelancer
      await User.findByIdAndUpdate(split.freelancer, { $inc: { totalEarnings: split.amount } });
      await Contribution.findOneAndUpdate(
        { project: payment.project._id, freelancer: split.freelancer },
        { $inc: { actualPayment: split.amount }, paymentReleased: true }
      );

      await pushNotification(req.app, {
        recipient: split.freelancer,
        sender:    req.user._id,
        type:      "payment_received",
        title:     "Payment Released!",
        message:   `$${split.amount.toFixed(2)} has been released to you for "${payment.project.title}".`,
        link:      `/payments/${payment._id}`,
        priority:  "high",
      });
    }

    // Deduct escrow
    payment.project.escrowBalance   -= payment.amount;
    payment.project.totalPaid       += payment.amount;
    await payment.project.save({ validateBeforeSave: false });
    await payment.save();

    res.json({ success: true, message: "Payment released successfully.", payment });
  } catch (err) { next(err); }
};

// ── @GET /api/payments/summary ────────────────────────────
export const getPaymentSummary = async (req, res, next) => {
  try {
    const userId = req.user._id;

    if (req.user.role === "client") {
      const [total, escrow, released] = await Promise.all([
        Payment.aggregate([{ $match: { payer: userId } }, { $group: { _id: null, sum: { $sum: "$amount" } } }]),
        Payment.aggregate([{ $match: { payer: userId, status: "in_escrow" } }, { $group: { _id: null, sum: { $sum: "$amount" } } }]),
        Payment.aggregate([{ $match: { payer: userId, status: "released" } }, { $group: { _id: null, sum: { $sum: "$amount" } } }]),
      ]);
      return res.json({
        success: true,
        summary: {
          totalSent:    total[0]?.sum    || 0,
          inEscrow:     escrow[0]?.sum   || 0,
          totalReleased:released[0]?.sum || 0,
        },
      });
    }

    const contributions = await Contribution.find({ freelancer: userId });
    const totalEarned   = contributions.reduce((s, c) => s + c.actualPayment, 0);
    const pendingAmount = contributions.reduce((s, c) => s + (c.paymentReleased ? 0 : c.estimatedPayment), 0);

    res.json({ success: true, summary: { totalEarned, pendingAmount } });
  } catch (err) { next(err); }
};

// ── @POST /api/payments/fund ─────────────────────────────
// Simulated card payment → funds go straight into escrow
export const fundEscrow = async (req, res, next) => {
  try {
    const { projectId, amount, type = "milestone", notes, cardLast4 } = req.body;

    if (!amount || amount < 1)
      return res.status(400).json({ success: false, message: "Amount must be at least $1." });

    const project = await Project.findById(projectId).populate("freelancers");
    if (!project)
      return res.status(404).json({ success: false, message: "Project not found." });

    if (project.client.toString() !== req.user._id.toString() && req.user.role !== "admin")
      return res.status(403).json({ success: false, message: "Only the client can fund this project." });

    // Auto-compute contribution-based splits
    const contributions = await Contribution.find({ project: projectId });
    const total = contributions.reduce((s, c) => s + c.contributionScore, 0);
    const splits = contributions.map(c => ({
      freelancer:        c.freelancer,
      contributionBased: true,
      percentage:        total > 0 ? parseFloat(((c.contributionScore / total) * 100).toFixed(2)) : 0,
      amount:            total > 0 ? parseFloat(((c.contributionScore / total) * amount).toFixed(2)) : 0,
    }));

    // Generate a realistic-looking transaction reference
    const txRef = `TXN-${crypto.randomBytes(4).toString("hex").toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

    const payment = await Payment.create({
      project:       projectId,
      payer:         req.user._id,
      amount,
      type,
      status:        "in_escrow",
      paymentMethod: "card",
      transactionId: txRef,
      splits,
      notes: notes || `Card payment ····${cardLast4 || "****"} · Ref: ${txRef}`,
    });

    // Update project escrow balance
    await Project.findByIdAndUpdate(projectId, { $inc: { escrowBalance: amount } });

    // Notify all freelancers
    for (const fId of project.freelancers) {
      await pushNotification(req.app, {
        recipient: fId,
        sender:    req.user._id,
        type:      "payment_received",
        title:     "Project Funded",
        message:   `$${amount.toLocaleString()} has been placed in escrow for "${project.title}".`,
        link:      `/payments`,
        priority:  "high",
      });
    }

    res.status(201).json({ success: true, message: "Payment funded and held in escrow.", payment, txRef });
  } catch (err) { next(err); }
};

// ── @POST /api/payments/razorpay/order ───────────────────
// Creates a Razorpay order — frontend opens the Razorpay checkout popup
export const createRazorpayOrder = async (req, res, next) => {
  try {
    const { projectId, amount, notes } = req.body;
    if (!amount || amount < 1)
      return res.status(400).json({ success: false, message: "Amount must be at least ₹1." });

    const project = await Project.findById(projectId);
    if (!project)
      return res.status(404).json({ success: false, message: "Project not found." });

    if (project.client.toString() !== req.user._id.toString() && req.user.role !== "admin")
      return res.status(403).json({ success: false, message: "Only the client can fund this project." });

    // Razorpay keys not configured — block payment
    if (!razorpay) {
      return res.status(503).json({
        success: false,
        message: "Payment gateway not configured. Please contact support.",
      });
    }

    const order = await razorpay.orders.create({
      amount:   Math.round(amount * 100), // paise
      currency: "INR",
      receipt:  `proj_${projectId}_${Date.now()}`,
      notes:    { projectId, clientId: req.user._id.toString(), notes: notes || "" },
    });

    res.json({
      success:      true,
      orderId:      order.id,
      amount:       order.amount,
      currency:     order.currency,
      keyId:        process.env.RAZORPAY_KEY_ID,
      projectTitle: project.title,
      demo:         false,
    });
  } catch (err) { next(err); }
};

// ── @POST /api/payments/razorpay/verify ──────────────────
// Called after Razorpay checkout succeeds — verifies HMAC signature & creates escrow record
export const verifyRazorpayPayment = async (req, res, next) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, projectId } = req.body;

    // ── ALWAYS verify HMAC — never accept demo flag from client ──
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ success: false, message: "Missing payment verification fields." });
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res.status(503).json({ success: false, message: "Payment gateway not configured." });
    }

    const expectedSig = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (expectedSig !== razorpaySignature) {
      return res.status(400).json({ success: false, message: "Payment verification failed. Invalid signature." });
    }

    // ── Fetch actual amount from Razorpay — never trust client-supplied amount ──
    let verifiedAmountINR;
    try {
      const rzpPayment = await razorpay.payments.fetch(razorpayPaymentId);
      if (rzpPayment.status !== "captured" && rzpPayment.status !== "authorized") {
        return res.status(400).json({ success: false, message: `Payment not captured. Status: ${rzpPayment.status}` });
      }
      verifiedAmountINR = rzpPayment.amount / 100; // paise → rupees
    } catch {
      return res.status(400).json({ success: false, message: "Could not verify payment with Razorpay." });
    }

    const project = await Project.findById(projectId).populate("freelancers");
    if (!project)
      return res.status(404).json({ success: false, message: "Project not found." });

    // ── Idempotency — prevent double-recording the same Razorpay payment ──
    const existing = await Payment.findOne({ transactionId: `RZP-${razorpayPaymentId}` });
    if (existing) {
      return res.json({ success: true, message: "Payment already recorded.", payment: existing, txRef: existing.transactionId });
    }

    // Compute contribution splits
    const contributions = await Contribution.find({ project: projectId });
    const total = contributions.reduce((s, c) => s + c.contributionScore, 0);
    const splits = contributions.map(c => ({
      freelancer:        c.freelancer,
      contributionBased: true,
      percentage:        total > 0 ? parseFloat(((c.contributionScore / total) * 100).toFixed(2)) : 0,
      amount:            total > 0 ? parseFloat(((c.contributionScore / total) * verifiedAmountINR).toFixed(2)) : 0,
    }));

    const txRef = `RZP-${razorpayPaymentId}`;

    const payment = await Payment.create({
      project:       projectId,
      payer:         req.user._id,
      amount:        verifiedAmountINR,
      currency:      "INR",
      type:          "milestone",
      status:        "in_escrow",
      paymentMethod: "razorpay",
      transactionId: txRef,
      splits,
      notes: `Razorpay · Order: ${razorpayOrderId} · Payment: ${razorpayPaymentId}`,
    });

    await Project.findByIdAndUpdate(projectId, { $inc: { escrowBalance: verifiedAmountINR } });

    // Notify freelancers
    for (const fId of project.freelancers) {
      await pushNotification(req.app, {
        recipient: fId,
        sender:    req.user._id,
        type:      "payment_received",
        title:     "Project Funded via Razorpay",
        message:   `₹${verifiedAmountINR.toLocaleString()} has been placed in escrow for "${project.title}".`,
        link:      `/payments`,
        priority:  "high",
      });
    }

    res.status(201).json({ success: true, message: "Payment verified and held in escrow.", payment, txRef });
  } catch (err) { next(err); }
};
