import Review from "../models/Review.js";
import User from "../models/User.js";

export const createReview = async (req, res, next) => {
  try {
    const { revieweeId, projectId, rating, title, comment, metrics } = req.body;

    const existing = await Review.findOne({ project: projectId, reviewer: req.user._id, reviewee: revieweeId });
    if (existing) return res.status(400).json({ success: false, message: "You have already reviewed this user for this project." });

    const review = await Review.create({
      project:  projectId,
      reviewer: req.user._id,
      reviewee: revieweeId,
      rating,
      title,
      comment,
      metrics,
    });

    // Update user's average rating
    const reviews = await Review.find({ reviewee: revieweeId });
    const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
    await User.findByIdAndUpdate(revieweeId, {
      averageRating: parseFloat(avg.toFixed(2)),
      totalReviews:  reviews.length,
    });

    res.status(201).json({ success: true, message: "Review submitted.", review });
  } catch (err) { next(err); }
};

export const getReviewsForUser = async (req, res, next) => {
  try {
    const reviews = await Review.find({ reviewee: req.params.userId, isPublic: true })
      .populate("reviewer", "name avatar role")
      .sort("-createdAt");
    res.json({ success: true, count: reviews.length, reviews });
  } catch (err) { next(err); }
};

export const respondToReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: "Review not found." });
    if (review.reviewee.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorised." });
    }
    review.response = req.body.response;
    await review.save();
    res.json({ success: true, message: "Response added.", review });
  } catch (err) { next(err); }
};
