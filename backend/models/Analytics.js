import mongoose from "mongoose";

const analyticsSchema = new mongoose.Schema(
  {
    user:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
    period:  { type: String, enum: ["daily","weekly","monthly","all_time"], default: "monthly" },
    date:    { type: Date, default: Date.now },

    // Freelancer metrics
    freelancer: {
      earningsThisPeriod:  { type: Number, default: 0 },
      tasksCompleted:      { type: Number, default: 0 },
      hoursLogged:         { type: Number, default: 0 },
      activeProjects:      { type: Number, default: 0 },
      onTimeDeliveryRate:  { type: Number, default: 0 },
      clientSatisfaction:  { type: Number, default: 0 },
      responseTime:        { type: Number, default: 0 }, // avg hours
      contributionScore:   { type: Number, default: 0 },
    },

    // Client metrics
    client: {
      totalSpent:          { type: Number, default: 0 },
      activeProjects:      { type: Number, default: 0 },
      completedProjects:   { type: Number, default: 0 },
      teamProductivity:    { type: Number, default: 0 },
      avgProjectDuration:  { type: Number, default: 0 }, // days
      delayedProjects:     { type: Number, default: 0 },
      avgFreelancerRating: { type: Number, default: 0 },
    },

    // Earnings data points (for chart)
    earningsHistory: [
      {
        date:     { type: Date },
        amount:   { type: Number, default: 0 },
        projects: { type: Number, default: 0 },
      },
    ],

    // Performance trend
    performanceTrend: [
      {
        date:  { type: Date },
        score: { type: Number },
        label: { type: String },
      },
    ],
  },
  { timestamps: true }
);

analyticsSchema.index({ user: 1, period: 1 });

const Analytics = mongoose.model("Analytics", analyticsSchema);
export default Analytics;
