import User from "../models/User.js";
import Project from "../models/Project.js";
import Payment from "../models/Payment.js";
import Notification from "../models/Notification.js";

export const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const query = {};
    if (role)   query.role = role;
    if (search) query.$or = [
      { name:  { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select("-password -verificationToken -resetPasswordToken")
      .sort("-createdAt")
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, total, users });
  } catch (err) { next(err); }
};

export const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });
    res.json({ success: true, message: `User ${user.isActive ? "activated" : "deactivated"}.`, isActive: user.isActive });
  } catch (err) { next(err); }
};

export const getAllProjects = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const total    = await Project.countDocuments();
    const projects = await Project.find()
      .populate("client", "name email")
      .populate("freelancers", "name")
      .sort("-createdAt")
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ success: true, total, projects });
  } catch (err) { next(err); }
};

export const broadcastNotification = async (req, res, next) => {
  try {
    const { title, message, type = "admin_alert", roles = ["freelancer","client"] } = req.body;
    const users = await User.find({ role: { $in: roles }, isActive: true }).select("_id");
    const notifications = users.map(u => ({
      recipient: u._id,
      sender:    req.user._id,
      type,
      title,
      message,
      priority:  "high",
    }));
    await Notification.insertMany(notifications);

    req.app.get("io")?.emit("notification:broadcast", { title, message });
    res.json({ success: true, message: `Broadcast sent to ${users.length} users.` });
  } catch (err) { next(err); }
};

export const getPlatformStats = async (req, res, next) => {
  try {
    const [totalUsers, totalProjects, totalRevenue, activeProjects] = await Promise.all([
      User.countDocuments(),
      Project.countDocuments(),
      Payment.aggregate([{ $match: { status: "released" } }, { $group: { _id: null, sum: { $sum: "$amount" } } }]),
      Project.countDocuments({ status: "in_progress" }),
    ]);
    res.json({
      success: true,
      stats: {
        totalUsers,
        totalProjects,
        totalRevenue: totalRevenue[0]?.sum || 0,
        activeProjects,
      },
    });
  } catch (err) { next(err); }
};
