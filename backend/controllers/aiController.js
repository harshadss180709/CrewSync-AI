import * as aiService from "../services/aiService.js";
import User from "../models/User.js";
import Project from "../models/Project.js";
import Task from "../models/Task.js";

// ── @POST /api/ai/brief ───────────────────────────────────
export const generateBrief = async (req, res, next) => {
  try {
    const brief = await aiService.generateCreativeBrief(req.body);
    res.json({ success: true, brief });
  } catch (err) {
    console.error("AI Brief Error:", err.message);
    res.status(500).json({ success: false, message: "AI service temporarily unavailable.", detail: err.message });
  }
};

// ── @POST /api/ai/allocate ────────────────────────────────
export const allocateTeam = async (req, res, next) => {
  try {
    const { projectId, requiredSkills } = req.body;
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ success: false, message: "Project not found." });

    const skillQuery = requiredSkills?.length
      ? { skills: { $in: requiredSkills }, role: "freelancer", availability: { $ne: "offline" } }
      : { role: "freelancer", availability: { $ne: "offline" } };

    const freelancers = await User.find(skillQuery).select("-password").limit(30);
    if (!freelancers.length) {
      return res.json({ success: true, recommendations: [], message: "No available freelancers found." });
    }

    const recommendations = await aiService.allocateFreelancers({
      projectDetails: project,
      freelancers,
    });

    // Save to project
    const enriched = recommendations.map(r => {
      const f = freelancers.find(fl => fl._id.toString() === r.freelancerId);
      return {
        freelancer:         r.freelancerId,
        compatibilityScore: r.compatibilityScore,
        successRate:        r.successRate,
        reason:             r.reason,
      };
    }).filter(r => r.freelancer);

    project.aiAllocation = { recommendedFreelancers: enriched, generatedAt: new Date() };
    await project.save({ validateBeforeSave: false });

    res.json({ success: true, recommendations, freelancers: freelancers.map(f => f.toPublicProfile()) });
  } catch (err) {
    console.error("AI Allocate Error:", err.message);
    res.status(500).json({ success: false, message: "AI service error.", detail: err.message });
  }
};

// ── @POST /api/ai/estimate ────────────────────────────────
export const estimateProject = async (req, res, next) => {
  try {
    const estimate = await aiService.estimateProject(req.body);
    res.json({ success: true, estimate });
  } catch (err) {
    console.error("AI Estimate Error:", err.message);
    res.status(500).json({ success: false, message: "AI service error.", detail: err.message });
  }
};

// ── @POST /api/ai/chat ────────────────────────────────────
export const aiChat = async (req, res, next) => {
  try {
    const { message, projectId } = req.body;
    let projectContext = {};
    if (projectId) {
      const proj = await Project.findById(projectId).select("title projectType status completionPercentage budget dueDate requiredSkills");
      if (proj) projectContext = proj;
    }
    const response = await aiService.chatAssistant({ message, projectContext });
    res.json({ success: true, response });
  } catch (err) {
    console.error("AI Chat Error:", err.message);
    res.status(500).json({ success: false, message: "AI service error.", detail: err.message });
  }
};

// ── @POST /api/ai/discover-projects ──────────────────────
export const discoverProjects = async (req, res, next) => {
  try {
    const { skills, preferredBudget, location } = req.body;

    const userSkills = skills?.length
      ? skills
      : (req.user?.skills || ["React", "Node.js"]);

    const projects = await aiService.discoverProjects({
      skills: userSkills,
      role: req.user?.role || "freelancer",
      preferredBudget: preferredBudget || 2000,
      location: location || "Remote",
    });

    res.json({
      success: true,
      projects,
    });
  } catch (err) {
    console.error("AI Discover Error:", err.message);

    res.status(500).json({
      success: false,
      message: "AI service error.",
      detail: err.message,
    });
  }
};

// ── @POST /api/ai/analyze-progress ───────────────────────
export const analyzeProgress = async (req, res, next) => {
  try {
    const { projectId } = req.body;
    const project = await Project.findById(projectId)
      .populate("freelancers", "name")
      .select("title status budget dueDate freelancers milestones");
    if (!project) return res.status(404).json({ success: false, message: "Project not found." });

    const tasks      = await Task.find({ project: projectId });
    const milestones = project.milestones || [];

    const analysis = await aiService.analyzeProjectProgress({ project, tasks, milestones });
    res.json({ success: true, analysis });
  } catch (err) {
    console.error("AI Progress Error:", err.message);
    res.status(500).json({ success: false, message: "AI service error.", detail: err.message });
  }
};
