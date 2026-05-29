import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role:     { type: String, enum: ["client","freelancer","admin"], default: "freelancer" },

    // Profile
    avatar:      { type: String, default: "" },
    bio:         { type: String, default: "" },
    location:    { type: String, default: "" },
    website:     { type: String, default: "" },
    phone:       { type: String, default: "" },

    // Freelancer-specific
    skills:        [{ type: String }],
    specialtyTags: [{ type: String }],
    hourlyRate:    { type: Number, default: 0 },
    availability:  { type: String, enum: ["available","busy","offline"], default: "available" },

    // Ratings & Reputation
    reliabilityScore: { type: Number, default: 100, min: 0, max: 100 },
    averageRating:    { type: Number, default: 0, min: 0, max: 5 },
    totalReviews:     { type: Number, default: 0 },
    totalEarnings:    { type: Number, default: 0 },
    completedProjects:{ type: Number, default: 0 },

    // Portfolio
    portfolio: [
      {
        title:       String,
        description: String,
        fileUrl:     String,
        fileType:    String,
        tags:        [String],
        createdAt:   { type: Date, default: Date.now },
      },
    ],

    // Social links
    social: {
      linkedin: { type: String, default: "" },
      github:   { type: String, default: "" },
      behance:  { type: String, default: "" },
      dribbble: { type: String, default: "" },
      spotify:  { type: String, default: "" },
    },

    // Auth
    isVerified:              { type: Boolean, default: false },
    verificationToken:       { type: String },
    verificationTokenExpire: { type: Date },
    resetPasswordToken:      { type: String },
    resetPasswordExpire:     { type: Date },
    lastActive:          { type: Date, default: Date.now },
    isActive:            { type: Boolean, default: true },

    // Notification prefs
    notificationPrefs: {
      email:    { type: Boolean, default: true },
      push:     { type: Boolean, default: true },
      payments: { type: Boolean, default: true },
      projects: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────
// Note: email is already indexed via unique:true — do not add a duplicate
userSchema.index({ role: 1 });
userSchema.index({ skills: 1 });
userSchema.index({ verificationToken: 1 }, { sparse: true });
userSchema.index({ resetPasswordToken: 1 }, { sparse: true });

// ── Hash password before save ─────────────────────────────
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ── Compare password ──────────────────────────────────────
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// ── Public profile (strips sensitive fields) ──────────────
userSchema.methods.toPublicProfile = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.verificationToken;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpire;
  return obj;
};

const User = mongoose.model("User", userSchema);
export default User;
