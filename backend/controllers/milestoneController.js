import Project from "../models/Project.js";
import Notification from "../models/Notification.js";

// ── @GET /api/projects/:id/milestones ────────────────────
export const getMilestones = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id).select("milestones title client freelancers");
    if (!project) return res.status(404).json({ success: false, message: "Project not found." });

    const isClient     = project.client.toString() === req.user._id.toString();
    const isFreelancer = project.freelancers.some(f => f.toString() === req.user._id.toString());
    const isAdmin      = req.user.role === "admin";
    if (!isClient && !isFreelancer && !isAdmin) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    res.json({ success: true, milestones: project.milestones || [] });
  } catch (err) { next(err); }
};

// ── @POST /api/projects/:id/milestones ───────────────────
export const addMilestone = async (req, res, next) => {
  try {
    const { title, description, amount, dueDate, deliverables } = req.body;
    if (!title) return res.status(400).json({ success: false, message: "Milestone title is required." });

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: "Project not found." });
    if (project.client.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Only the client can add milestones." });
    }

    const milestone = {
      title,
      description:  description || "",
      amount:       amount      || 0,
      dueDate:      dueDate     || null,
      deliverables: deliverables || [],
      status:       "pending",
    };

    project.milestones.push(milestone);
    await project.save({ validateBeforeSave: false });

    const newMilestone = project.milestones[project.milestones.length - 1];

    // Notify freelancers
    for (const fId of project.freelancers) {
      await Notification.create({
        recipient: fId,
        sender:    req.user._id,
        type:      "project_update",
        title:     "New Milestone Added",
        message:   `A new milestone "${title}" has been added to "${project.title}".`,
        link:      `/projects/${project._id}`,
        priority:  "normal",
      });
    }

    res.status(201).json({ success: true, message: "Milestone added.", milestone: newMilestone });
  } catch (err) { next(err); }
};

// ── @PUT /api/milestones/:milestoneId ─────────────────────
// Called as PUT /api/projects/:id/milestones/:milestoneId
export const updateMilestone = async (req, res, next) => {
  try {
    const { id: projectId, milestoneId } = req.params;
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ success: false, message: "Project not found." });

    const isClient     = project.client.toString() === req.user._id.toString();
    const isFreelancer = project.freelancers.some(f => f.toString() === req.user._id.toString());
    const isAdmin      = req.user.role === "admin";
    if (!isClient && !isFreelancer && !isAdmin) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    const milestone = project.milestones.id(milestoneId);
    if (!milestone) return res.status(404).json({ success: false, message: "Milestone not found." });

    const { title, description, amount, dueDate, deliverables, status } = req.body;
    if (title)        milestone.title       = title;
    if (description !== undefined) milestone.description = description;
    if (amount !== undefined)      milestone.amount      = amount;
    if (dueDate)      milestone.dueDate     = dueDate;
    if (deliverables) milestone.deliverables= deliverables;
    if (status)       milestone.status      = status;

    // Auto-set completedAt when marking complete
    if (status === "completed" && !milestone.completedAt) {
      milestone.completedAt = new Date();
    }

    await project.save({ validateBeforeSave: false });

    // Notify on key status changes
    if (status === "completed") {
      await Notification.create({
        recipient: project.client,
        sender:    req.user._id,
        type:      "milestone_completed",
        title:     "Milestone Completed",
        message:   `Milestone "${milestone.title}" has been marked as completed.`,
        link:      `/projects/${project._id}`,
        priority:  "high",
      });
    }

    res.json({ success: true, message: "Milestone updated.", milestone });
  } catch (err) { next(err); }
};

// ── @DELETE /api/projects/:id/milestones/:milestoneId ────
export const deleteMilestone = async (req, res, next) => {
  try {
    const { id: projectId, milestoneId } = req.params;
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ success: false, message: "Project not found." });
    if (project.client.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Only the client can delete milestones." });
    }

    project.milestones = project.milestones.filter(m => m._id.toString() !== milestoneId);
    await project.save({ validateBeforeSave: false });
    res.json({ success: true, message: "Milestone deleted." });
  } catch (err) { next(err); }
};
