import Project from "../models/Project.js";
import Task from "../models/Task.js";
import Payment from "../models/Payment.js";
import Contribution from "../models/Contribution.js";
import Review from "../models/Review.js";
import User from "../models/User.js";

// ── @GET /api/analytics/dashboard ────────────────────────
export const getDashboardAnalytics = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const role   = req.user.role;

    if (role === "client") {
      const [projects, reviews, payments] = await Promise.all([
        Project.find({ client: userId }),
        Review.find({ reviewer: userId }),
        Payment.find({ payer: userId }),
      ]);

      const active    = projects.filter(p => p.status === "in_progress").length;
      const completed = projects.filter(p => p.status === "completed").length;
      const totalSpent= payments.filter(p => p.status === "released").reduce((s,p) => s+p.amount, 0);
      const inEscrow  = payments.filter(p => p.status === "in_escrow").reduce((s,p)  => s+p.amount, 0);

      // Monthly spend (last 6 months)
      const spendTrend = await Payment.aggregate([
        { $match: { payer: userId, status: "released" } },
        { $group: {
            _id:   { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
            total: { $sum: "$amount" },
        }},
        { $sort: { "_id.year": 1, "_id.month": 1 } },
        { $limit: 6 },
      ]);

      return res.json({
        success: true,
        analytics: {
          totalProjects:  projects.length,
          activeProjects: active,
          completedProjects: completed,
          totalSpent,
          inEscrow,
          spendTrend,
          avgTeamRating:  reviews.length ? reviews.reduce((s,r) => s+r.rating, 0)/reviews.length : 0,
        },
      });
    }

    // Freelancer analytics
    const [contributions, tasks, reviews] = await Promise.all([
      Contribution.find({ freelancer: userId }).populate("project", "title status"),
      Task.find({ assignedTo: userId }),
      Review.find({ reviewee: userId }),
    ]);

    const totalEarned   = contributions.reduce((s, c) => s + c.actualPayment, 0);
    const activeProjects= contributions.filter(c => c.project?.status === "in_progress").length;
    const avgRating     = reviews.length ? reviews.reduce((s,r) => s+r.rating, 0)/reviews.length : 0;
    const completedTasks= tasks.filter(t => t.status === "completed").length;

    // Monthly earnings (last 6 months)
    const earningsTrend = await Payment.aggregate([
      { $unwind: "$splits" },
      { $match: { "splits.freelancer": userId, "splits.released": true } },
      { $group: {
          _id:   { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          total: { $sum: "$splits.amount" },
      }},
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $limit: 6 },
    ]);

    res.json({
      success: true,
      analytics: {
        totalEarned,
        activeProjects,
        completedTasks,
        avgRating,
        reliabilityScore: req.user.reliabilityScore,
        earningsTrend,
        contributions: contributions.length,
        avgContributionScore: contributions.length
          ? contributions.reduce((s,c) => s+c.contributionScore, 0)/contributions.length
          : 0,
      },
    });
  } catch (err) { next(err); }
};

// ── @GET /api/analytics/project/:id ──────────────────────
export const getProjectAnalytics = async (req, res, next) => {
  try {
    const [project, tasks, contributions] = await Promise.all([
      Project.findById(req.params.id),
      Task.find({ project: req.params.id }),
      Contribution.find({ project: req.params.id }).populate("freelancer","name avatar"),
    ]);
    if (!project) return res.status(404).json({ success: false, message: "Project not found." });

    const totalTasks     = tasks.length;
    const completedTasks = tasks.filter(t => t.status === "completed").length;
    const overdueTasks   = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "completed").length;

    // Delay risk
    const daysRemaining = Math.ceil((new Date(project.dueDate) - new Date()) / 86400000);
    const delayRisk = daysRemaining < 3 && project.completionPercentage < 80 ? "high"
                    : daysRemaining < 7 && project.completionPercentage < 60 ? "medium" : "low";

    // Contribution splits
    const totalScore  = contributions.reduce((s, c) => s + c.contributionScore, 0);
    const splitData   = contributions.map(c => ({
      freelancer:   c.freelancer,
      score:        c.contributionScore,
      percentage:   totalScore > 0 ? parseFloat(((c.contributionScore / totalScore)*100).toFixed(1)) : 0,
      estimatedPay: totalScore > 0 ? parseFloat(((c.contributionScore / totalScore) * project.budget).toFixed(2)) : 0,
    }));

    res.json({
      success: true,
      analytics: {
        completionPercentage: project.completionPercentage,
        totalTasks,
        completedTasks,
        overdueTasks,
        daysRemaining: Math.max(0, daysRemaining),
        delayRisk,
        splitData,
        budgetUsed: project.totalPaid,
        budgetRemaining: project.budget - project.totalPaid,
      },
    });
  } catch (err) { next(err); }
};

// ── @GET /api/analytics/admin ─────────────────────────────
export const getAdminAnalytics = async (req, res, next) => {
  try {
    const [users, projects, payments] = await Promise.all([
      User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
      Project.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Payment.aggregate([
        { $match: { status: "released" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

    const monthlySignups = await User.aggregate([
      { $group: {
          _id:   { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          count: { $sum: 1 },
      }},
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $limit: 12 },
    ]);

    res.json({
      success: true,
      analytics: {
        usersByRole:    users,
        projectsByStatus: projects,
        totalRevenue:   payments[0]?.total || 0,
        monthlySignups,
      },
    });
  } catch (err) { next(err); }
};
