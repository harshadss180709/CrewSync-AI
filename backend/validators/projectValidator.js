import { body } from "express-validator";
import { validate } from "./authValidator.js";

// ── Create / Update Project ───────────────────────────────
export const validateProject = [
  body("title")
    .trim()
    .notEmpty().withMessage("Project title is required.")
    .isLength({ min: 3, max: 120 }).withMessage("Title must be 3–120 characters."),

  body("description")
    .trim()
    .notEmpty().withMessage("Project description is required.")
    .isLength({ min: 10, max: 2000 }).withMessage("Description must be 10–2000 characters."),

  body("budget")
    .notEmpty().withMessage("Budget is required.")
    .isNumeric().withMessage("Budget must be a number.")
    .custom(v => v >= 1).withMessage("Budget must be at least $1."),

  body("projectType")
    .optional()
    .isIn([
      "music_production", "video_editing", "graphic_design",
      "content_creation", "web_development", "animation",
      "podcast", "other",
    ]).withMessage("Invalid project type."),

  body("priority")
    .optional()
    .isIn(["low", "medium", "high", "critical"]).withMessage("Invalid priority."),

  body("dueDate")
    .optional({ checkFalsy: true })
    .isISO8601().withMessage("Invalid due date format."),

  validate,
];

// ── Invite Freelancer ─────────────────────────────────────
export const validateInvite = [
  body("freelancerId")
    .notEmpty().withMessage("Freelancer ID is required.")
    .isMongoId().withMessage("Invalid freelancer ID."),

  validate,
];
