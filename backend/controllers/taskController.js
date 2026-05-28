import Task from "../models/Task.js";
import Contribution from "../models/Contribution.js";
import Notification from "../models/Notification.js";
import Project from "../models/Project.js";

// ── @POST /api/tasks ──────────────────────────────────────
export const createTask = async (req, res, next) => {
  try {
    const task = await Task.create({ ...req.body, createdBy: req.user._id });

    // Notify assigned freelancers
    if (task.assignedTo?.length) {
      for (const uid of task.assignedTo) {
        await Notification.create({
          recipient: uid,
          sender:    req.user._id,
          type:      "task_assigned",
          title:     "New Task Assigned",
          message:   `Task "${task.title}" has been assigned to you.`,
          link:      `/projects/${task.project}`,
        });
      }
    }

    const populated = await task.populate("assignedTo", "name avatar");
    res.status(201).json({ success: true, task: populated });
  } catch (err) { next(err); }
};

// ── @GET /api/tasks/project/:projectId ───────────────────
export const getProjectTasks = async (req, res, next) => {
  try {
    const tasks = await Task.find({ project: req.params.projectId })
      .populate("assignedTo", "name avatar")
      .populate("createdBy", "name avatar")
      .sort("position");
    res.json({ success: true, tasks });
  } catch (err) { next(err); }
};

// ── @PUT /api/tasks/:id ───────────────────────────────────
export const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: "Task not found." });

    const prevStatus = task.status;
    const allowed = ["title","description","status","priority","assignedTo","dueDate","estimatedHours","loggedHours","subtasks","tags","position","category"];
    allowed.forEach(f => { if (req.body[f] !== undefined) task[f] = req.body[f]; });

    if (req.body.status === "completed" && prevStatus !== "completed") {
      task.completedAt = Date.now();

      // Update contribution scores for assigned freelancers
      for (const uid of task.assignedTo) {
        await Contribution.findOneAndUpdate(
          { project: task.project, freelancer: uid },
          {
            $inc: {
              tasksCompleted:   1,
              contributionScore: task.contributionWeight * 10,
            },
            $push: {
              activityLog: {
                action:      "task_completed",
                description: `Completed task: ${task.title}`,
                points:      task.contributionWeight * 10,
              },
            },
            lastActiveAt: Date.now(),
          },
          { upsert: true }
        );
      }

      // Recalculate project completion
      const [total, done] = await Promise.all([
        Task.countDocuments({ project: task.project }),
        Task.countDocuments({ project: task.project, status: "completed" }),
      ]);
      await Project.findByIdAndUpdate(task.project, {
        completionPercentage: total ? Math.round((done / total) * 100) : 0,
      });
    }

    await task.save();
    const updated = await Task.findById(task._id).populate("assignedTo", "name avatar");

    // Emit real-time via socket (attached to app)
    req.app.get("io")?.to(`project:${task.project}`).emit("task:updated", updated);

    res.json({ success: true, task: updated });
  } catch (err) { next(err); }
};

// ── @DELETE /api/tasks/:id ────────────────────────────────
export const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: "Task not found." });
    await task.deleteOne();
    req.app.get("io")?.to(`project:${task.project}`).emit("task:deleted", { taskId: task._id });
    res.json({ success: true, message: "Task deleted." });
  } catch (err) { next(err); }
};

// ── @POST /api/tasks/:id/comment ─────────────────────────
export const addComment = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: "Task not found." });
    task.comments.push({ user: req.user._id, text: req.body.text });
    await task.save({ validateBeforeSave: false });
    res.status(201).json({ success: true, comments: task.comments });
  } catch (err) { next(err); }
};
