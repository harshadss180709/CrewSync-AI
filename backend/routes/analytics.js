import express from "express";
import { getDashboardAnalytics, getProjectAnalytics, getAdminAnalytics } from "../controllers/analyticsController.js";
import { protect, authorize } from "../middleware/auth.js";
const router = express.Router();
router.get("/dashboard", protect, getDashboardAnalytics);
router.get("/project/:id", protect, getProjectAnalytics);
router.get("/admin", protect, authorize("admin"), getAdminAnalytics);
export default router;
