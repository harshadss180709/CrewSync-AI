import express from "express";
import { createPayment, getPayments, approvePayment, releasePayment, getPaymentSummary, fundEscrow, createRazorpayOrder, verifyRazorpayPayment } from "../controllers/paymentController.js";
import { protect, authorize } from "../middleware/auth.js";
const router = express.Router();
router.post("/",                      protect, authorize("client","admin"), createPayment);
router.get("/",                       protect, getPayments);
router.get("/summary",                protect, getPaymentSummary);
router.put("/:id/approve",            protect, approvePayment);
router.put("/:id/release",            protect, releasePayment);
// Simulated card payment
router.post("/fund",                  protect, authorize("client","admin"), fundEscrow);
// Razorpay
router.post("/razorpay/order",        protect, authorize("client","admin"), createRazorpayOrder);
router.post("/razorpay/verify",       protect, authorize("client","admin"), verifyRazorpayPayment);
export default router;
