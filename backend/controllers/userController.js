import User from "../models/User.js";
import Project from "../models/Project.js";
import Review from "../models/Review.js";
import Contribution from "../models/Contribution.js";

// ── @GET /api/users/freelancers ───────────────────────────
export const getFreelancers = async (req, res, next) => {
  try {
    const { skills, availability, minRating, maxRate, search, sort = "-averageRating", page = 1, limit = 12 } = req.query;

    const query = { role: "freelancer", isActive: true };
    if (skills)        query.skills = { $in: skills.split(",") };
    if (availability)  query.availability = availability;
    if (minRating)     query.averageRating = { $gte: parseFloat(minRating) };
    if (maxRate)       query.hourlyRate = { $lte: parseFloat(maxRate) };
    if (search)        query.$or = [
      { name: { $regex: search, $options: "i" } },
      { bio:  { $regex: search, $options: "i" } },
      { skills: { $in: [new RegExp(search, "i")] } },
    ];

    const total     = await User.countDocuments(query);
    const freelancers = await User.find(query)
      .select("-password -verificationToken -resetPasswordToken")
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      count: freelancers.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: Number(page),
      freelancers,
    });
  } catch (err) { next(err); }
};

// ── @GET /api/users/:id ───────────────────────────────────
export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password -verificationToken -resetPasswordToken -resetPasswordExpire");
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    const reviews = await Review.find({ reviewee: user._id, isPublic: true })
      .populate("reviewer", "name avatar role")
      .sort("-createdAt")
      .limit(10);

    const completedProjects = await Project.countDocuments({
      freelancers: user._id,
      status: "completed",
    });

    res.json({ success: true, user, reviews, completedProjects });
  } catch (err) { next(err); }
};

// ── @PUT /api/users/profile ───────────────────────────────
export const updateProfile = async (req, res, next) => {
  try {
    const allowed = [
      "name","bio","location","website","phone",
      "skills","specialtyTags","hourlyRate","availability","social","notificationPrefs",
    ];
    const updates = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true, runValidators: true,
    }).select("-password");

    res.json({ success: true, message: "Profile updated.", user });
  } catch (err) { next(err); }
};

// ── @POST /api/users/portfolio ────────────────────────────
export const addPortfolioItem = async (req, res, next) => {
  try {
    const { title, description, fileUrl, fileType, tags } = req.body;
    const user = await User.findById(req.user._id);
    user.portfolio.push({ title, description, fileUrl, fileType, tags });
    await user.save({ validateBeforeSave: false });
    res.status(201).json({ success: true, message: "Portfolio item added.", portfolio: user.portfolio });
  } catch (err) { next(err); }
};

// ── @DELETE /api/users/portfolio/:itemId ──────────────────
export const removePortfolioItem = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    user.portfolio = user.portfolio.filter((p) => p._id.toString() !== req.params.itemId);
    await user.save({ validateBeforeSave: false });
    res.json({ success: true, message: "Portfolio item removed." });
  } catch (err) { next(err); }
};

// ── @PUT /api/users/avatar ────────────────────────────────
export const updateAvatar = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded." });
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: req.file.path },
      { new: true }
    ).select("-password");
    res.json({ success: true, message: "Avatar updated.", user });
  } catch (err) { next(err); }
};

// ── @GET /api/users/:id/stats ─────────────────────────────
export const getUserStats = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const contributions = await Contribution.find({ freelancer: userId });
    const totalEarned   = contributions.reduce((sum, c) => sum + c.actualPayment, 0);
    const activeProjects= await Project.countDocuments({ freelancers: userId, status: "in_progress" });

    res.json({
      success: true,
      stats: {
        totalEarned,
        activeProjects,
        totalContributions: contributions.length,
        avgContributionScore: contributions.length
          ? contributions.reduce((s, c) => s + c.contributionScore, 0) / contributions.length
          : 0,
      },
    });
  } catch (err) { next(err); }
};
