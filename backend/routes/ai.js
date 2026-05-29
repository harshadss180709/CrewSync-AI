import express from "express";
import rateLimit from "express-rate-limit";
import { generateBrief, allocateTeam, estimateProject, aiChat, discoverProjects, analyzeProgress } from "../controllers/aiController.js";
import { protect } from "../middleware/auth.js";

// Per-user AI rate limit: 20 requests per 15 minutes
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "AI rate limit reached. Please wait 15 minutes." },
});

const router = express.Router();
router.use(protect);
router.post("/brief",            aiLimiter, generateBrief);
router.post("/allocate",         aiLimiter, allocateTeam);
router.post("/estimate",         aiLimiter, estimateProject);
router.post("/chat",             aiLimiter, aiChat);
router.post("/discover-projects",aiLimiter, discoverProjects);
router.post("/analyze-progress", aiLimiter, analyzeProgress);
export default router;
