import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    project:    { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    reviewer:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reviewee:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    rating:    { type: Number, required: true, min: 1, max: 5 },
    title:     { type: String, default: "" },
    comment:   { type: String, required: true, maxlength: 1000 },

    // Detailed ratings
    metrics: {
      communication: { type: Number, min: 1, max: 5 },
      quality:       { type: Number, min: 1, max: 5 },
      timeliness:    { type: Number, min: 1, max: 5 },
      professionalism:{ type: Number, min: 1, max: 5 },
    },

    isPublic: { type: Boolean, default: true },
    response: { type: String, default: "" },
    helpfulVotes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

reviewSchema.index({ reviewee: 1 });
reviewSchema.index({ project: 1 });

const Review = mongoose.model("Review", reviewSchema);
export default Review;
