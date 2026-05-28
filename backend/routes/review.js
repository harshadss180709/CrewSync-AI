import express from "express";
import { createReview, getReviewsForUser, respondToReview } from "../controllers/reviewController.js";
import { protect } from "../middleware/auth.js";
const router = express.Router();
router.post("/", protect, createReview);
router.get("/user/:userId", getReviewsForUser);
router.put("/:id/respond", protect, respondToReview);
export default router;
