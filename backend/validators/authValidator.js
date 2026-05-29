import { body, validationResult } from "express-validator";

// ── Middleware: return 400 if validation failed ──────────
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,   // first error as top-level message
      errors:  errors.array(),
    });
  }
  next();
};

// ── Register ─────────────────────────────────────────────
export const validateRegister = [
  body("name")
    .trim()
    .notEmpty().withMessage("Name is required.")
    .isLength({ min: 2, max: 60 }).withMessage("Name must be 2–60 characters."),

  body("email")
    .trim()
    .notEmpty().withMessage("Email is required.")
    .isEmail().withMessage("Enter a valid email address.")
    .normalizeEmail(),

  body("password")
    .notEmpty().withMessage("Password is required.")
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters.")
    .matches(/\d/).withMessage("Password must contain at least one number."),

  body("role")
    .optional()
    .isIn(["client", "freelancer"]).withMessage("Role must be client or freelancer."),

  validate,
];

// ── Login ─────────────────────────────────────────────────
export const validateLogin = [
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required.")
    .isEmail().withMessage("Enter a valid email address.")
    .normalizeEmail(),

  body("password")
    .notEmpty().withMessage("Password is required."),

  validate,
];
