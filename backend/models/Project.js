import mongoose from "mongoose";

const milestoneSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String },
  amount:      { type: Number, required: true },
  dueDate:     { type: Date },
  status:      { type: String, enum: ["pending","in_progress","completed","paid"], default: "pending" },
  completedAt: { type: Date },
});

const projectSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String, required: true },
    client:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // AI-generated brief fields
    projectType: {
      type: String,
      enum: ["music_production","video_editing","graphic_design","content_creation","web_development","animation","photography","podcast","other"],
      required: true,
    },
    mood:         { type: String, default: "" },
    style:        { type: String, default: "" },
    requiredSkills: [{ type: String }],

    // Team
    freelancers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    teamSize:    { type: Number, default: 1 },

    // AI Allocation
    aiAllocation: {
      recommendedFreelancers: [
        {
          freelancer:        { type: mongoose.Schema.Types.ObjectId, ref: "User" },
          compatibilityScore: { type: Number },
          successRate:        { type: Number },
          reason:             { type: String },
        },
      ],
      estimatedDuration: { type: String },
      suggestedBudget:   { type: Number },
      generatedAt:       { type: Date },
    },

    // Timeline & Budget
    budget:    { type: Number, required: true },
    timeline:  { type: String, required: true },
    startDate: { type: Date, default: Date.now },
    dueDate:   { type: Date, required: true },

    // Status
    status: {
      type: String,
      enum: ["draft","open","in_progress","review","completed","cancelled","on_hold"],
      default: "open",
    },
    completionPercentage: { type: Number, default: 0 },

    // Milestones & Payments
    milestones:    [milestoneSchema],
    totalPaid:     { type: Number, default: 0 },
    escrowBalance: { type: Number, default: 0 },

    // Files
    files: [
      {
        name:       String,
        url:        String,
        fileType:   String,
        size:       Number,
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    // AI Creative Brief
    creativeBrief: {
      scope:            { type: String },
      deliverables:     [String],
      productionSteps:  [String],
      estimatedTimeline:{ type: String },
      budgetBreakdown:  { type: String },
      suggestedTeam:    { type: String },
      generatedAt:      { type: Date },
    },

    // Analytics
    analytics: {
      viewCount:       { type: Number, default: 0 },
      messageCount:    { type: Number, default: 0 },
      taskCompletionRate: { type: Number, default: 0 },
      delayRisk:       { type: String, enum: ["low","medium","high"], default: "low" },
    },

    tags:     [String],
    priority: { type: String, enum: ["low","medium","high","critical"], default: "medium" },
    isPublic: { type: Boolean, default: false },
  },
  { timestamps: true }
);

projectSchema.index({ client: 1, status: 1 });
projectSchema.index({ freelancers: 1 });
projectSchema.index({ projectType: 1 });

const Project = mongoose.model("Project", projectSchema);
export default Project;
