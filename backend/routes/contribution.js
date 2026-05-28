import express from "express";
import Contribution from "../models/Contribution.js";
import { protect } from "../middleware/auth.js";
const router = express.Router();
router.get("/project/:projectId", protect, async (req, res, next) => {
  try {
    const contributions = await Contribution.find({ project: req.params.projectId })
      .populate("freelancer", "name avatar skills");
    const total = contributions.reduce((s,c)=>s+c.contributionScore,0);
    const data = contributions.map(c=>({...c.toObject(), percentage: total>0?Math.round((c.contributionScore/total)*100):0}));
    res.json({ success: true, contributions: data });
  } catch(err){ next(err); }
});
export default router;
