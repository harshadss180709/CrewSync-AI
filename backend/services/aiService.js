import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const getModel = () => genAI.getGenerativeModel({ model: "gemini-1.5-flash", });

// ── Timeout wrapper: reject if Gemini takes > 25 s ───────
const withTimeout = (promise, ms = 25000) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("AI request timed out. Please try again.")), ms)
    ),
  ]);

// ── Safe JSON parse: strips markdown fences if Gemini adds them ──
const safeParseJSON = (text) => {
  const cleaned = text.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
  // Find first [ or { to handle any leading text
  const start = cleaned.search(/[\[{]/);
  if (start === -1) throw new Error("AI returned non-JSON response.");
  return JSON.parse(cleaned.slice(start));
};

// ── Generate Creative Brief ───────────────────────────────
export const generateCreativeBrief = async ({ projectIdea, projectType, budget, timeline }) => {
  const model = getModel();
  const prompt = `
You are a senior creative director at a top-tier media agency.
A client has submitted the following project idea:

"${projectIdea}"

Project Type: ${projectType}
Budget: $${budget}
Timeline: ${timeline}

Generate a comprehensive creative brief in JSON format with these exact keys:
{
  "scope": "detailed project scope",
  "deliverables": ["deliverable 1", "deliverable 2", ...],
  "productionSteps": ["step 1", "step 2", ...],
  "estimatedTimeline": "detailed timeline breakdown",
  "budgetBreakdown": "budget allocation suggestion",
  "suggestedTeam": "recommended team composition",
  "qualityBenchmarks": ["benchmark 1", ...],
  "riskFactors": ["risk 1", ...]
}
Respond ONLY with valid JSON.`;

  const result   = await withTimeout(model.generateContent(prompt));
  const text     = result.response.text();
  return safeParseJSON(text);
};

// ── AI Freelancer Allocation ──────────────────────────────
export const allocateFreelancers = async ({ projectDetails, freelancers }) => {
  const model = getModel();
  const freelancerProfiles = freelancers.map(f => ({
    id:               f._id,
    name:             f.name,
    skills:           f.skills,
    rating:           f.averageRating,
    reliability:      f.reliabilityScore,
    completedProjects:f.completedProjects,
    hourlyRate:       f.hourlyRate,
    availability:     f.availability,
  }));

  const prompt = `
You are an AI project manager specialising in creative freelancer allocation.

Project Details:
- Title: ${projectDetails.title}
- Type: ${projectDetails.projectType}
- Required Skills: ${projectDetails.requiredSkills?.join(", ")}
- Budget: $${projectDetails.budget}
- Timeline: ${projectDetails.timeline}
- Mood/Style: ${projectDetails.mood} / ${projectDetails.style}

Available Freelancers:
${JSON.stringify(freelancerProfiles, null, 2)}

Analyse each freelancer and return a JSON array of the TOP 5 recommendations:
[
  {
    "freelancerId": "id",
    "compatibilityScore": 0-100,
    "successRate": 0-100,
    "reason": "2-sentence explanation",
    "role": "suggested role on this project"
  }
]
Consider skills match, rating, reliability, rate vs budget, and availability.
Respond ONLY with valid JSON array.`;

  const result = await withTimeout(model.generateContent(prompt));
  const text   = result.response.text();
  return safeParseJSON(text);
};

// ── Estimate Project Timeline & Budget ───────────────────
export const estimateProject = async ({ title, projectType, requiredSkills, description }) => {
  const model = getModel();
  const prompt = `
You are an experienced creative project estimator.
Project: "${title}"
Type: ${projectType}
Skills needed: ${requiredSkills?.join(", ")}
Description: ${description}

Respond in JSON:
{
  "estimatedDays": number,
  "estimatedBudgetMin": number,
  "estimatedBudgetMax": number,
  "teamSize": number,
  "complexityLevel": "low|medium|high|complex",
  "keyMilestones": ["milestone 1", "milestone 2", ...]
}
Respond ONLY with valid JSON.`;

  const result = await withTimeout(model.generateContent(prompt));
  const text   = result.response.text();
  return safeParseJSON(text);
};

// ── Smart Chat Assistant ──────────────────────────────────
export const chatAssistant = async ({ message, projectContext }) => {
  const model = getModel();
  const prompt = `
You are CrewSync AI's intelligent project assistant helping a creative team.
Project context: ${JSON.stringify(projectContext)}

User message: "${message}"

Provide a helpful, concise, professional response (max 150 words). Be specific and actionable.`;

  const result = await withTimeout(model.generateContent(prompt));
  return result.response.text().trim();
};

// ── Discover Projects from the Web ───────────────────────
export const discoverProjects = async ({ skills, role, preferredBudget, location }) => {
  const model = getModel();
  const prompt = `
You are an AI that aggregates and curates freelance project opportunities from across the internet (Upwork, Freelancer, Toptal, LinkedIn, Remote.co, AngelList, YCombinator, etc.).

Generate 12 realistic, diverse, currently-available project listings tailored for a ${role} with these skills: ${skills?.join(", ")}.
Preferred budget: $${preferredBudget || "500-5000"}.

Return a JSON array of exactly 12 projects:
[
  {
    "id": "unique-slug-id",
    "title": "specific project title",
    "description": "2-3 sentence project description explaining the work needed",
    "client": "Company or client name (realistic business name)",
    "clientAvatar": "initials 2 chars",
    "budgetMin": number,
    "budgetMax": number,
    "currency": "USD",
    "deadline": "X days" (realistic, 7-90 days),
    "requiredSkills": ["skill1", "skill2", "skill3"],
    "matchScore": number (70-99, based on skills match),
    "category": "one of: web_development|design|video_editing|content_writing|music_production|animation|marketing|ai_ml|mobile_dev|data_science",
    "postedTime": "X hours ago|X days ago|just now",
    "location": "Remote|US Only|EU|Worldwide",
    "source": "one of: Upwork|Freelancer.com|Toptal|LinkedIn|AngelList|Remote.co|YCombinator",
    "urgency": "normal|urgent|high_priority",
    "proposals": number (1-45, random),
    "verified": true or false
  }
]
Make titles specific and realistic (not generic). Vary the sources and categories.
Respond ONLY with valid JSON array.`;

  const result = await withTimeout(model.generateContent(prompt));
  const text   = result.response.text();
  return safeParseJSON(text);
};

// ── Analyse Project Progress ──────────────────────────────
export const analyzeProjectProgress = async ({ project, tasks, milestones }) => {
  const model = getModel();

  const taskSummary = {
    total:     tasks.length,
    completed: tasks.filter(t => t.status === "completed").length,
    inProgress:tasks.filter(t => t.status === "in_progress").length,
    blocked:   tasks.filter(t => t.status === "blocked").length,
    overdue:   tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "completed").length,
  };

  const milestoneSummary = {
    total:    milestones.length,
    completed:milestones.filter(m => m.status === "completed" || m.status === "paid").length,
    pending:  milestones.filter(m => m.status === "pending").length,
  };

  const daysRemaining = project.dueDate
    ? Math.max(0, Math.ceil((new Date(project.dueDate) - new Date()) / (1000 * 60 * 60 * 24)))
    : null;

  const prompt = `
You are an AI project health analyst for CrewSync AI.

Project: "${project.title}"
Status: ${project.status}
Budget: $${project.budget}
Days Remaining: ${daysRemaining ?? "no deadline"}
Team Size: ${project.freelancers?.length || 0} freelancers

Tasks: ${JSON.stringify(taskSummary)}
Milestones: ${JSON.stringify(milestoneSummary)}

Analyse project health and respond in JSON:
{
  "healthScore": number (0-100),
  "riskLevel": "low|medium|high|critical",
  "timelineStatus": "on_track|slightly_behind|at_risk|delayed",
  "bottlenecks": ["specific bottleneck 1", "specific bottleneck 2"],
  "suggestions": ["actionable suggestion 1", "actionable suggestion 2", "actionable suggestion 3"],
  "estimatedCompletion": "X days from now (realistic estimate)",
  "insights": ["personalized insight 1", "personalized insight 2"]
}
Be specific and data-driven. Respond ONLY with valid JSON.`;

  const result = await withTimeout(model.generateContent(prompt));
  const text   = result.response.text();
  return safeParseJSON(text);
};
