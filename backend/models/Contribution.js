import mongoose from "mongoose";

const contributionSchema = new mongoose.Schema(
  {
    project:    { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    freelancer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Auto-computed score
    contributionScore:      { type: Number, default: 0 },
    contributionPercentage: { type: Number, default: 0 },

    // Activity counts
    tasksCompleted:    { type: Number, default: 0 },
    filesUploaded:     { type: Number, default: 0 },
    messagesCount:     { type: Number, default: 0 },
    hoursLogged:       { type: Number, default: 0 },
    reviewsGiven:      { type: Number, default: 0 },
    commitsCount:      { type: Number, default: 0 },

    // Weighted metrics
    qualityScore:       { type: Number, default: 0, min: 0, max: 100 },
    timelinessScore:    { type: Number, default: 0, min: 0, max: 100 },
    collaborationScore: { type: Number, default: 0, min: 0, max: 100 },

    // Activity log
    activityLog: [
      {
        action:      { type: String },
        description: { type: String },
        points:      { type: Number, default: 0 },
        timestamp:   { type: Date, default: Date.now },
        metadata:    { type: mongoose.Schema.Types.Mixed },
      },
    ],

    // Payment share
    estimatedPayment: { type: Number, default: 0 },
    actualPayment:    { type: Number, default: 0 },
    paymentReleased:  { type: Boolean, default: false },

    joinedAt:    { type: Date, default: Date.now },
    lastActiveAt:{ type: Date, default: Date.now },
  },
  { timestamps: true }
);

contributionSchema.index({ project: 1, freelancer: 1 }, { unique: true });

const Contribution = mongoose.model("Contribution", contributionSchema);
export default Contribution;
