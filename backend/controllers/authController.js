import User from "../models/User.js";
import { generateToken } from "../middleware/auth.js";
import crypto from "crypto";
import { sendVerificationEmail, sendPasswordResetEmail } from "../services/emailService.js";

// ── @POST /api/auth/register ──────────────────────────────
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: "Email already registered." });

    const user = await User.create({
      name,
      email,
      password,
      role: role || "freelancer",
      verificationToken: crypto.randomBytes(32).toString("hex"),
    });

    const token = generateToken(user._id);

    // Send verification email (non-blocking — don't fail registration if email fails)
    sendVerificationEmail(user, user.verificationToken).catch(err =>
      console.error("Verification email failed:", err.message)
    );

    res.status(201).json({
      success: true,
      message: "Account created. Check your email to verify your account.",
      token,
      user: {
        _id:    user._id,
        name:   user.name,
        email:  user.email,
        role:   user.role,
        avatar: user.avatar,
        isVerified: user.isVerified,
      },
    });
  } catch (err) { next(err); }
};

// ── @POST /api/auth/login ─────────────────────────────────
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    user.lastActive = Date.now();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        _id:    user._id,
        name:   user.name,
        email:  user.email,
        role:   user.role,
        avatar: user.avatar,
        isVerified: user.isVerified,
        skills: user.skills,
        availability: user.availability,
      },
    });
  } catch (err) { next(err); }
};

// ── @GET /api/auth/me ─────────────────────────────────────
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password -verificationToken -resetPasswordToken");
    res.json({ success: true, user });
  } catch (err) { next(err); }
};

// ── @PUT /api/auth/change-password ───────────────────────
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select("+password");

    if (!(await user.matchPassword(currentPassword))) {
      return res.status(400).json({ success: false, message: "Current password is incorrect." });
    }
    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: "Password updated successfully." });
  } catch (err) { next(err); }
};

// ── @POST /api/auth/forgot-password ──────────────────────
export const forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json({ success: false, message: "No user with that email." });

    user.resetPasswordToken  = crypto.randomBytes(32).toString("hex");
    user.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hr
    await user.save({ validateBeforeSave: false });

    sendPasswordResetEmail(user, user.resetPasswordToken).catch(err =>
      console.error("Reset email failed:", err.message)
    );
    res.json({ success: true, message: "Password reset email sent. Check your inbox." });
  } catch (err) { next(err); }
};

// ── @PUT /api/auth/reset-password/:token ─────────────────
export const resetPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({
      resetPasswordToken:  req.params.token,
      resetPasswordExpire: { $gt: Date.now() },
    });
    if (!user) return res.status(400).json({ success: false, message: "Invalid or expired reset token." });

    user.password = req.body.password;
    user.resetPasswordToken  = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    const token = generateToken(user._id);
    res.json({ success: true, message: "Password reset successful.", token });
  } catch (err) { next(err); }
};

// ── @GET /api/auth/verify/:token ─────────────────────────
export const verifyEmail = async (req, res, next) => {
  try {
    const user = await User.findOne({ verificationToken: req.params.token });
    if (!user) return res.status(400).json({ success: false, message: "Invalid verification token." });

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, message: "Email verified successfully." });
  } catch (err) { next(err); }
};
