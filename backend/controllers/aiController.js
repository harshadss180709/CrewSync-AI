import * as aiService from "../services/aiService.js";
import User    from "../models/User.js";
import Project from "../models/Project.js";
import Task    from "../models/Task.js";

// ─────────────────────────────────────────────────────────
//  FALLBACK HELPERS  (pure DB / rule-based — no Gemini)
// ─────────────────────────────────────────────────────────

/**
 * Score a freelancer against required skills 0–100.
 * Factors: skill overlap, rating, reliability, availability.
 */
function scoreFreelancer(freelancer, requiredSkills = []) {
  const fl = freelancer;

  // Skill overlap (50 pts)
  let skillPts = 0;
  if (requiredSkills.length) {
    const flSkills  = (fl.skills || []).map(s => s.toLowerCase());
    const reqSkills = requiredSkills.map(s => s.toLowerCase());
    const matched   = reqSkills.filter(s => flSkills.some(fs => fs.includes(s) || s.includes(fs)));
    skillPts = Math.round((matched.length / reqSkills.length) * 50);
  } else {
    skillPts = 30; // no required skills — neutral score
  }

  // Rating (25 pts, 0–5 → 0–25)
  const ratingPts = Math.round(((fl.averageRating || 0) / 5) * 25);

  // Reliability (15 pts, 0–100 → 0–15)
  const reliabilityPts = Math.round(((fl.reliabilityScore || 100) / 100) * 15);

  // Availability (10 pts)
  const availPts = fl.availability === "available" ? 10
                 : fl.availability === "busy"      ? 4
                 : 0;

  return Math.min(99, skillPts + ratingPts + reliabilityPts + availPts);
}

/**
 * Build a synthetic "discover" card from a real DB project.
 * Mirrors the shape the frontend expects from the AI discovery endpoint.
 */
function dbProjectToDiscoverCard(project, userSkills = []) {
  const req       = project.requiredSkills || [];
  const reqLower  = req.map(s => s.toLowerCase());
  const userLower = userSkills.map(s => s.toLowerCase());
  const matched   = userLower.filter(s => reqLower.some(r => r.includes(s) || s.includes(r)));
  const matchScore = req.length
    ? Math.min(99, 60 + Math.round((matched.length / Math.max(req.length, 1)) * 39))
    : 70;

  const daysLeft = project.dueDate
    ? Math.max(0, Math.ceil((new Date(project.dueDate) - Date.now()) / 86_400_000))
    : 30;

  const clientName   = project.client?.name || "Client";
  const clientInitials = clientName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return {
    id:            project._id.toString(),
    title:         project.title,
    description:   project.description?.slice(0, 200) || "",
    client:        clientName,
    clientAvatar:  clientInitials,
    budgetMin:     Math.round(project.budget * 0.8),
    budgetMax:     project.budget,
    currency:      "USD",
    deadline:      `${daysLeft} days`,
    requiredSkills: req.slice(0, 5),
    matchScore,
    category:      project.projectType || "other",
    postedTime:    timeAgo(project.createdAt),
    location:      "Remote",
    source:        "CrewSync",
    urgency:       project.priority === "critical" ? "urgent"
                 : project.priority === "high"     ? "high_priority"
                 : "normal",
    proposals:     project.freelancers?.length || 0,
    verified:      true,
    _fromDB:       true,   // flag so frontend can distinguish
  };
}

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60)  return `${mins || 1} minutes ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs} hours ago`;
  return `${Math.floor(hrs / 24)} days ago`;
}

/**
 * Rule-based project estimate by type.
 * Returns the same shape as aiService.estimateProject().
 */
const TYPE_ESTIMATES = {
  music_production:  { days: [14, 45], budgetRange: [500,  5000],  team: 2 },
  video_editing:     { days: [7,  30], budgetRange: [300,  3000],  team: 2 },
  graphic_design:    { days: [5,  21], budgetRange: [200,  2500],  team: 1 },
  content_creation:  { days: [3,  14], budgetRange: [100,  1500],  team: 1 },
  web_development:   { days: [14, 60], budgetRange: [1000, 15000], team: 3 },
  animation:         { days: [14, 45], budgetRange: [800,  8000],  team: 2 },
  photography:       { days: [3,  14], budgetRange: [300,  3000],  team: 1 },
  podcast:           { days: [7,  21], budgetRange: [200,  2000],  team: 2 },
  other:             { days: [7,  30], budgetRange: [500,  5000],  team: 2 },
};

function ruleBasedEstimate({ projectType, requiredSkills = [] }) {
  const cfg = TYPE_ESTIMATES[projectType] || TYPE_ESTIMATES.other;
  const complexity = requiredSkills.length > 5 ? "high"
                   : requiredSkills.length > 2 ? "medium"
                   : "low";
  const mult = { low: 0.8, medium: 1.0, high: 1.4 }[complexity];
  return {
    estimatedDays:      Math.round((cfg.days[0] + cfg.days[1]) / 2 * mult),
    estimatedBudgetMin: Math.round(cfg.budgetRange[0] * mult),
    estimatedBudgetMax: Math.round(cfg.budgetRange[1] * mult),
    teamSize:           cfg.team,
    complexityLevel:    complexity,
    keyMilestones: [
      "Project kickoff & requirements review",
      "Initial draft / prototype delivery",
      "Feedback & revision round",
      "Final delivery & handover",
    ],
    _fallback: true,
  };
}

/**
 * Compute project health score purely from DB stats.
 * Returns same shape as aiService.analyzeProjectProgress().
 */
function ruleBasedProgress({ tasks, milestones, project }) {
  const now      = Date.now();
  const total    = tasks.length;
  const done     = tasks.filter(t => t.status === "completed").length;
  const blocked  = tasks.filter(t => t.status === "blocked").length;
  const overdue  = tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== "completed").length;

  const taskPct  = total > 0 ? Math.round((done / total) * 100) : 0;

  const mTotal   = milestones.length;
  const mDone    = milestones.filter(m => ["completed","paid"].includes(m.status)).length;

  const daysLeft = project.dueDate
    ? Math.max(0, Math.ceil((new Date(project.dueDate) - now) / 86_400_000))
    : null;
  const totalDays = project.dueDate && project.createdAt
    ? Math.ceil((new Date(project.dueDate) - new Date(project.createdAt)) / 86_400_000)
    : null;
  const elapsed  = totalDays ? totalDays - (daysLeft || 0) : 0;
  const timePct  = totalDays ? Math.min(100, Math.round((elapsed / totalDays) * 100)) : 0;

  const timelineStatus = !totalDays             ? "on_track"
    : daysLeft === 0 && taskPct < 100            ? "delayed"
    : timePct > taskPct + 20                     ? "at_risk"
    : timePct > taskPct + 10                     ? "slightly_behind"
    : "on_track";

  const healthScore = Math.max(0, Math.min(100,
    taskPct * 0.5
    + (100 - Math.min(overdue * 10, 40)) * 0.2
    + (timelineStatus === "on_track"       ? 30
     : timelineStatus === "slightly_behind"? 20
     : timelineStatus === "at_risk"        ? 10 : 0)
  ));

  const bottlenecks = [];
  if (blocked > 0)                            bottlenecks.push(`${blocked} blocked task${blocked > 1 ? "s" : ""} need attention`);
  if (overdue > 0)                            bottlenecks.push(`${overdue} overdue task${overdue > 1 ? "s" : ""} past deadline`);
  if (timelineStatus === "at_risk")           bottlenecks.push("Timeline significantly behind schedule");
  if (timelineStatus === "delayed")           bottlenecks.push("Project is past its deadline");
  if (mDone === 0 && mTotal > 0)             bottlenecks.push("No milestones completed yet");

  const suggestions = [];
  if (blocked > 0)     suggestions.push("Resolve blocked tasks immediately — assign a team member to unblock them.");
  if (overdue > 0)     suggestions.push("Review overdue tasks and either reschedule or reassign them.");
  if (taskPct < 30)    suggestions.push("Break remaining work into smaller daily tasks to build momentum.");
  if (taskPct >= 80)   suggestions.push("Schedule a final review session before marking project complete.");
  if (!suggestions.length) suggestions.push("Keep up the pace — project is on track.");

  return {
    healthScore:        Math.round(healthScore),
    riskLevel:          healthScore >= 70 ? "low" : healthScore >= 45 ? "medium" : healthScore >= 20 ? "high" : "critical",
    timelineStatus,
    bottlenecks,
    suggestions,
    estimatedCompletion: daysLeft != null ? `${daysLeft} days remaining` : "No deadline set",
    insights: [
      `${done}/${total} tasks completed (${taskPct}%).`,
      mTotal > 0 ? `${mDone}/${mTotal} milestones reached.` : "No milestones defined yet.",
      timelineStatus === "on_track" ? "Project is on track." : `Timeline is ${timelineStatus.replace("_", " ")}.`,
    ],
    _fallback: true,
  };
}

/**
 * Produce a template creative brief from project metadata.
 */
const BRIEF_TEMPLATES = {
  music_production:  { deliverables: ["Mixed & mastered audio tracks","Stem files","Project session file","Release-ready WAV & MP3 exports"], steps: ["Pre-production & concept alignment","Recording & arrangement","Mixing & processing","Mastering","Final delivery"] },
  video_editing:     { deliverables: ["Edited video file (H.264 & ProRes)","Colour-graded version","Social media cuts","Subtitles / SRT file"], steps: ["Footage review & selects","Rough cut assembly","Motion graphics & titles","Colour grade & audio mix","Export & delivery"] },
  graphic_design:    { deliverables: ["High-res print-ready files","Web-optimised PNG/SVG","Source files (AI / PSD)","Brand guidelines PDF"], steps: ["Brief review & mood board","Concept sketches (2–3 options)","Client feedback round","Refinements","Final export package"] },
  web_development:   { deliverables: ["Deployed website / app","Source code repository","Documentation","Testing report"], steps: ["Requirements & architecture","UI/UX wireframes","Frontend development","Backend integration","QA testing & deployment"] },
  animation:         { deliverables: ["Animation file (MP4/MOV)","Source project file","Still frames","Social media version"], steps: ["Storyboard & animatic","Style frame approval","Animation production","Sound design","Final render & delivery"] },
  content_creation:  { deliverables: ["Written content pieces","Edited drafts","SEO metadata","Content calendar"], steps: ["Research & brief review","First draft","Client review","Revisions","Final delivery"] },
  other:             { deliverables: ["Primary deliverable","Supporting files","Documentation"], steps: ["Planning","Execution","Review","Delivery"] },
};

function templateBrief({ projectIdea, projectType, budget, timeline }) {
  const tpl = BRIEF_TEMPLATES[projectType] || BRIEF_TEMPLATES.other;
  return {
    scope:             `Deliver a complete ${(projectType || "creative").replace(/_/g, " ")} project based on the brief: "${projectIdea || "as described"}". This includes all planning, production, revisions, and final delivery.`,
    deliverables:      tpl.deliverables,
    productionSteps:   tpl.steps,
    estimatedTimeline: timeline || "To be agreed",
    budgetBreakdown:   budget ? `Suggested split — 40% production, 30% revisions, 20% project management, 10% contingency. Total budget: $${budget}.` : "To be agreed with client.",
    suggestedTeam:     "1–2 specialists matching required skills, plus a project lead for coordination.",
    qualityBenchmarks: ["Meets all client brief requirements","Delivered on or before deadline","Passes review round with ≤ 2 revision cycles","Files delivered in all agreed formats"],
    riskFactors:       ["Scope creep — ensure brief is locked before production begins","Feedback delays — agree response SLAs with client upfront","Revision overruns — cap revision rounds in contract"],
    _fallback: true,
  };
}

// ─────────────────────────────────────────────────────────
//  CONTROLLERS
// ─────────────────────────────────────────────────────────

// ── @POST /api/ai/brief ───────────────────────────────────
export const generateBrief = async (req, res, next) => {
  try {
    const brief = await aiService.generateCreativeBrief(req.body);
    res.json({ success: true, brief, source: "gemini" });
  } catch (err) {
    console.warn("AI Brief — Gemini unavailable, using template fallback:", err.message);
    try {
      const brief = templateBrief(req.body);
      res.json({ success: true, brief, source: "fallback" });
    } catch (fbErr) {
      next(fbErr);
    }
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
      return res.json({ success: true, recommendations: [], message: "No available freelancers found.", source: "db" });
    }

    // ── Try Gemini ────────────────────────────────────────
    let recommendations;
    let source = "gemini";
    try {
      recommendations = await aiService.allocateFreelancers({ projectDetails: project, freelancers });
    } catch (aiErr) {
      console.warn("AI Allocate — Gemini unavailable, using DB scoring:", aiErr.message);
      source = "fallback";

      // DB-based scoring: rank by skill overlap + rating + reliability
      recommendations = freelancers
        .map(fl => {
          const score = scoreFreelancer(fl, requiredSkills || project.requiredSkills || []);
          const skillsMatched = (requiredSkills || []).filter(s =>
            (fl.skills || []).map(x => x.toLowerCase()).some(fs => fs.includes(s.toLowerCase()))
          );
          return {
            freelancerId:       fl._id.toString(),
            compatibilityScore: score,
            successRate:        Math.min(99, Math.round((fl.reliabilityScore || 80) * 0.9 + (fl.averageRating || 3) * 2)),
            reason:             skillsMatched.length
              ? `Strong match on ${skillsMatched.slice(0, 2).join(" and ")}. Rated ${fl.averageRating?.toFixed(1) || "N/A"}/5 with ${fl.completedProjects || 0} completed projects.`
              : `Available ${fl.availability} with ${fl.completedProjects || 0} completed projects and ${fl.reliabilityScore || 100}% reliability score.`,
            role:               (fl.skills?.[0] || "Specialist") + " Lead",
            _fromDB:            true,
          };
        })
        .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
        .slice(0, 5);
    }

    // Save AI allocation to project (for Gemini results)
    if (source === "gemini") {
      const enriched = recommendations.map(r => ({
        freelancer:         r.freelancerId,
        compatibilityScore: r.compatibilityScore,
        successRate:        r.successRate,
        reason:             r.reason,
      })).filter(r => r.freelancer);
      project.aiAllocation = { recommendedFreelancers: enriched, generatedAt: new Date() };
      await project.save({ validateBeforeSave: false });
    }

    res.json({
      success: true,
      recommendations,
      freelancers: freelancers.map(f => f.toPublicProfile()),
      source,
    });
  } catch (err) { next(err); }
};

// ── @POST /api/ai/estimate ────────────────────────────────
export const estimateProject = async (req, res, next) => {
  try {
    const estimate = await aiService.estimateProject(req.body);
    res.json({ success: true, estimate, source: "gemini" });
  } catch (err) {
    console.warn("AI Estimate — Gemini unavailable, using rule-based fallback:", err.message);
    try {
      const estimate = ruleBasedEstimate(req.body);
      res.json({ success: true, estimate, source: "fallback" });
    } catch (fbErr) {
      next(fbErr);
    }
  }
};

// ── @POST /api/ai/chat ────────────────────────────────────
export const aiChat = async (req, res, next) => {
  try {
    const { message, projectId } = req.body;
    let projectContext = {};
    if (projectId) {
      const proj = await Project.findById(projectId)
        .select("title projectType status completionPercentage budget dueDate requiredSkills");
      if (proj) projectContext = proj;
    }
    const response = await aiService.chatAssistant({ message, projectContext });
    res.json({ success: true, response, source: "gemini" });
  } catch (err) {
    console.warn("AI Chat — Gemini unavailable, using static fallback:", err.message);

    // Context-aware canned responses based on keywords
    const msg  = (req.body.message || "").toLowerCase();
    let response = "I'm currently offline — please try again shortly. In the meantime, check your project dashboard for an overview of tasks, milestones, and team activity.";

    if (msg.includes("progress") || msg.includes("status"))
      response = "Check your Project Workspace → Progress Tracker for live task completion, timeline status, and milestone tracking. Your team's recent activity is shown in the activity feed.";
    else if (msg.includes("payment") || msg.includes("escrow") || msg.includes("fund"))
      response = "Navigate to the Payments page to see escrow balances, pending releases, and transaction history. Clients can fund escrow and release payment once milestones are approved.";
    else if (msg.includes("freelancer") || msg.includes("hire") || msg.includes("team"))
      response = "Use Freelancer Discovery to search by skill, availability, and rating. Clients can invite freelancers directly from their profile into any project.";
    else if (msg.includes("task") || msg.includes("todo") || msg.includes("board"))
      response = "Open your Project Workspace and switch to the Task Board view. You can drag tasks between columns (To Do → In Progress → Review → Done) and assign them to team members.";
    else if (msg.includes("insight") || msg.includes("suggest") || msg.includes("tip"))
      response = "Keep tasks moving daily, communicate milestone expectations early, and release escrow promptly when work meets quality standards. Consistent activity keeps reliability scores high.";

    res.json({ success: true, response, source: "fallback" });
  }
};

// ── @POST /api/ai/discover-projects ──────────────────────
export const discoverProjects = async (req, res, next) => {
  try {
    const { skills, preferredBudget, location } = req.body;
    const userSkills = skills?.length ? skills : (req.user?.skills || []);

    // ── Try Gemini first ──────────────────────────────────
    let projects;
    let source = "gemini";
    try {
      projects = await aiService.discoverProjects({
        skills:          userSkills,
        role:            req.user?.role || "freelancer",
        preferredBudget: preferredBudget || 2000,
        location:        location || "Remote",
      });
    } catch (aiErr) {
      console.warn("AI Discover — Gemini unavailable, falling back to DB projects:", aiErr.message);
      source = "fallback";

      // ── DB fallback: find open projects matching user skills ──
      const query = {
        status: "open",
        // exclude projects the user is already part of
        freelancers: { $ne: req.user._id },
        client:      { $ne: req.user._id },
      };

      // Skill-matched query (prefer matching; fall back to all open)
      if (userSkills.length) {
        query.requiredSkills = { $in: userSkills };
      }

      let dbProjects = await Project.find(query)
        .populate("client", "name avatar")
        .sort("-createdAt")
        .limit(12)
        .lean();

      // If skill match returns < 6 results, top up with any open projects
      if (dbProjects.length < 6) {
        const ids = dbProjects.map(p => p._id.toString());
        const extra = await Project.find({
          status: "open",
          freelancers: { $ne: req.user._id },
          client:      { $ne: req.user._id },
          _id: { $nin: ids },
        })
          .populate("client", "name avatar")
          .sort("-createdAt")
          .limit(12 - dbProjects.length)
          .lean();
        dbProjects = [...dbProjects, ...extra];
      }

      projects = dbProjects.map(p => dbProjectToDiscoverCard(p, userSkills));
    }

    res.json({ success: true, projects, source });
  } catch (err) { next(err); }
};

// ── @POST /api/ai/analyze-progress ───────────────────────
export const analyzeProgress = async (req, res, next) => {
  try {
    const { projectId } = req.body;
    const project = await Project.findById(projectId)
      .populate("freelancers", "name")
      .select("title status budget dueDate freelancers milestones createdAt");
    if (!project) return res.status(404).json({ success: false, message: "Project not found." });

    const tasks      = await Task.find({ project: projectId });
    const milestones = project.milestones || [];

    // ── Try Gemini ────────────────────────────────────────
    let analysis;
    let source = "gemini";
    try {
      analysis = await aiService.analyzeProjectProgress({ project, tasks, milestones });
    } catch (aiErr) {
      console.warn("AI Progress — Gemini unavailable, using computed fallback:", aiErr.message);
      source = "fallback";
      analysis = ruleBasedProgress({ tasks, milestones, project });
    }

    res.json({ success: true, analysis, source });
  } catch (err) { next(err); }
};
