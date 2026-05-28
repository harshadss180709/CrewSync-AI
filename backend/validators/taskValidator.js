import { body } from "express-validator";
import { validate } from "./authValidator.js";

// ── Create Task ───────────────────────────────────────────
export const validateTask = [
  body("title")
    .trim()
    .notEmpty().withMessage("Task title is required.")
    .isLength({ min: 2, max: 200 }).withMessage("Title must be 2–200 characters."),

  body("project")
    .notEmpty().withMessage("Project ID is required.")
    .isMongoId().withMessage("Invalid project ID."),

  body("priority")
    .optional()
    .isIn(["low", "medium", "high", "critical"]).withMessage("Invalid priority."),

  body("status")
    .optional()
    .isIn(["todo", "in_progress", "review", "completed"]).withMessage("Invalid status."),

  body("category")
    .optional()
    .isIn([
      "design", "development", "audio", "video",
      "writing", "research", "review", "other",
    ]).withMessage("Invalid category."),

  body("estimatedHours")
    .optional({ checkFalsy: true })
    .isNumeric().withMessage("Estimated hours must be a number.")
    .custom(v => v >= 0).withMessage("Estimated hours cannot be negative."),

  body("dueDate")
    .optional({ checkFalsy: true })
    .isISO8601().withMessage("Invalid due date format."),

  validate,
];

// ── Update Task ───────────────────────────────────────────
export const validateTaskUpdate = [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 }).withMessage("Title must be 2–200 characters."),

  body("priority")
    .optional()
    .isIn(["low", "medium", "high", "critical"]).withMessage("Invalid priority."),

  body("status")
    .optional()
    .isIn(["todo", "in_progress", "review", "completed"]).withMessage("Invalid status."),

  body("category")
    .optional()
    .isIn([
      "design", "development", "audio", "video",
      "writing", "research", "review", "other",
    ]).withMessage("Invalid category."),

  body("estimatedHours")
    .optional({ checkFalsy: true })
    .isNumeric().withMessage("Estimated hours must be a number.")
    .custom(v => v >= 0).withMessage("Estimated hours cannot be negative."),

  body("loggedHours")
    .optional({ checkFalsy: true })
    .isNumeric().withMessage("Logged hours must be a number.")
    .custom(v => v >= 0).withMessage("Logged hours cannot be negative."),

  validate,
];
