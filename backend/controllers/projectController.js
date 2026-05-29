import Project from "../models/Project.js";
import Contribution from "../models/Contribution.js";
import Notification from "../models/Notification.js";
import Task from "../models/Task.js";

// ── @POST /api/projects ───────────────────────────────────
export const createProject = async (req, res, next) => {
  try {
    const project = await Project.create({ ...req.body, client: req.user._id });
    res.status(201).json({ success: true, message: "Project created.", project });
  } catch (err) { next(err); }
};

// ── @GET /api/projects ────────────────────────────────────
export const getProjects = async (req, res, next) => {
  try {
    const { status, type, search, page = 1, limit = 10 } = req.query;
    const query = {};

    if (req.user.role === "client")     query.client = req.user._id;
    if (req.user.role === "freelancer") query.freelancers = req.user._id;

    if (status) query.status = status;
    if (type)   query.projectType = type;
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").slice(0, 100);
      query.$or = [
        { title:       { $regex: escaped, $options: "i" } },
        { description: { $regex: escaped, $options: "i" } },
      ];
    }

    const total    = await Project.countDocuments(query);
    const projects = await Project.find(query)
      .populate("client", "name avatar email")
      .populate("freelancers", "name avatar skills")
      .sort("-createdAt")
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, count: projects.length, total, pages: Math.ceil(total / limit), projects });
  } catch (err) { next(err); }
};

// ── @GET /api/projects/:id ────────────────────────────────
export const getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("client", "name avatar email")
      .populate("freelancers", "name avatar skills averageRating hourlyRate")
      .populate("aiAllocation.recommendedFreelancers.freelancer", "name avatar skills");

    if (!project) return res.status(404).json({ success: false, message: "Project not found." });

    // Access check
    const isClient     = project.client._id.toString() === req.user._id.toString();
    const isFreelancer = project.freelancers.some(f => f._id.toString() === req.user._id.toString());
    const isAdmin      = req.user.role === "admin";
    if (!isClient && !isFreelancer && !isAdmin) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    project.analytics.viewCount += 1;
    await project.save({ validateBeforeSave: false });

    const tasks = await Task.find({ project: project._id })
      .populate("assignedTo", "name avatar")
      .sort("position");

    res.json({ success: true, project, tasks });
  } catch (err) { next(err); }
};

// ── @PUT /api/projects/:id ────────────────────────────────
export const updateProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: "Project not found." });
    if (project.client.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorised." });
    }

    const allowed = ["title","description","status","budget","timeline","dueDate","priority","tags","requiredSkills"];
    allowed.forEach((f) => { if (req.body[f] !== undefined) project[f] = req.body[f]; });
    await project.save();

    // Notify freelancers
    for (const fId of project.freelancers) {
      await Notification.create({
        recipient: fId,
        sender:    req.user._id,
        type:      "project_update",
        title:     "Project Updated",
        message:   `"${project.title}" has been updated.`,
        link:      `/projects/${project._id}`,
      });
    }

    res.json({ success: true, message: "Project updated.", project });
  } catch (err) { next(err); }
};

// ── @POST /api/projects/:id/invite ───────────────────────
export const inviteFreelancer = async (req, res, next) => {
  try {
    const { freelancerId } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: "Project not found." });
    if (project.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Only clients can invite freelancers." });
    }

    if (!project.freelancers.includes(freelancerId)) {
      project.freelancers.push(freelancerId);
      await project.save({ validateBeforeSave: false });

      // Create contribution tracker
      await Contribution.create({ project: project._id, freelancer: freelancerId });

      // Send notification
      await Notification.create({
        recipient: freelancerId,
        sender:    req.user._id,
        type:      "project_invite",
        title:     "Project Invitation",
        message:   `You have been invited to join "${project.title}".`,
        link:      `/projects/${project._id}`,
        priority:  "high",
      });
    }

    res.json({ success: true, message: "Freelancer invited." });
  } catch (err) { next(err); }
};

// ── @DELETE /api/projects/:id/freelancer/:fid ────────────
export const removeFreelancer = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: "Project not found." });
    if (project.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorised." });
    }

    project.freelancers = project.freelancers.filter(f => f.toString() !== req.params.fid);
    await project.save({ validateBeforeSave: false });
    res.json({ success: true, message: "Freelancer removed from project." });
  } catch (err) { next(err); }
};

// ── @POST /api/projects/:id/files ─────────────────────────
export const uploadProjectFile = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file provided." });
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: "Project not found." });

    project.files.push({
      name:       req.file.originalname,
      url:        req.file.path,
      fileType:   req.file.mimetype,
      size:       req.file.size,
      uploadedBy: req.user._id,
    });
    await project.save({ validateBeforeSave: false });

    // Update contribution
    await Contribution.findOneAndUpdate(
      { project: project._id, freelancer: req.user._id },
      { $inc: { filesUploaded: 1, contributionScore: 5 } },
      { new: true }
    );

    res.status(201).json({ success: true, message: "File uploaded.", files: project.files });
  } catch (err) { next(err); }
};

// ── @GET /api/projects/:id/contributions ─────────────────
export const getContributions = async (req, res, next) => {
  try {
    const contributions = await Contribution.find({ project: req.params.id })
      .populate("freelancer", "name avatar skills averageRating");

    // Calculate percentage
    const total = contributions.reduce((s, c) => s + c.contributionScore, 0);
    const enriched = contributions.map(c => ({
      ...c.toObject(),
      contributionPercentage: total > 0 ? Math.round((c.contributionScore / total) * 100) : 0,
    }));

    res.json({ success: true, contributions: enriched });
  } catch (err) { next(err); }
};

// ── @GET /api/projects/:id/progress ──────────────────────
export const getProjectProgress = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("freelancers", "name avatar")
      .populate("client", "name avatar");
    if (!project) return res.status(404).json({ success: false, message: "Project not found." });

    const tasks = await Task.find({ project: req.params.id });

    const totalTasks     = tasks.length;
    const completedTasks = tasks.filter(t => t.status === "completed").length;
    const inProgress     = tasks.filter(t => t.status === "in_progress").length;
    const blocked        = tasks.filter(t => t.status === "blocked").length;
    const overdueTasks   = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "completed").length;

    const milestones          = project.milestones || [];
    const totalMilestones     = milestones.length;
    const completedMilestones = milestones.filter(m => ["completed","paid"].includes(m.status)).length;

    const now          = new Date();
    const createdAt    = new Date(project.createdAt);
    const dueDate      = project.dueDate ? new Date(project.dueDate) : null;
    const daysElapsed  = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
    const daysRemaining= dueDate ? Math.max(0, Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24))) : null;
    const totalDays    = dueDate ? Math.ceil((dueDate - createdAt) / (1000 * 60 * 60 * 24)) : null;
    const timeProgress = totalDays ? Math.min(100, Math.round((daysElapsed / totalDays) * 100)) : 0;

    let timelineStatus = "on_track";
    if (dueDate) {
      const taskProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
      if (daysRemaining === 0 && taskProgress < 100) timelineStatus = "delayed";
      else if (timeProgress > taskProgress + 20)      timelineStatus = "at_risk";
      else if (timeProgress > taskProgress + 10)      timelineStatus = "slightly_behind";
    }

    // 7-day team activity (simplified: tasks touched in last 7 days)
    const sevenDaysAgo  = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const recentActivity= tasks.filter(t => new Date(t.updatedAt) > sevenDaysAgo).length;

    const budgetUsedPct = project.totalPaid && project.budget
      ? Math.min(100, Math.round((project.totalPaid / project.budget) * 100))
      : 0;

    const bottlenecks = [];
    if (blocked > 0)      bottlenecks.push(`${blocked} blocked task${blocked > 1 ? "s" : ""}`);
    if (overdueTasks > 0) bottlenecks.push(`${overdueTasks} overdue task${overdueTasks > 1 ? "s" : ""}`);
    if (timelineStatus === "at_risk" || timelineStatus === "delayed") {
      bottlenecks.push("Timeline behind schedule");
    }

    res.json({
      success: true,
      progress: {
        taskCompletion:      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        milestoneCompletion: totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0,
        timelineStatus,
        timeProgress,
        daysElapsed,
        daysRemaining,
        totalDays,
        budgetUsed:     budgetUsedPct,
        totalBudget:    project.budget,
        amountPaid:     project.totalPaid || 0,
        taskStats:      { total: totalTasks, completed: completedTasks, inProgress, blocked, overdue: overdueTasks },
        milestoneStats: { total: totalMilestones, completed: completedMilestones },
        teamSize:       project.freelancers?.length || 0,
        recentActivity,
        bottlenecks,
      },
    });
  } catch (err) { next(err); }
};

// ── @DELETE /api/projects/:id ─────────────────────────────
export const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: "Project not found." });
    if (project.client.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorised." });
    }
    await project.deleteOne();
    res.json({ success: true, message: "Project deleted." });
  } catch (err) { next(err); }
};
