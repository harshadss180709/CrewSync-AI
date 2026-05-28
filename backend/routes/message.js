import express from "express";
import { getMessages, sendMessage, deleteMessage, reactToMessage } from "../controllers/messageController.js";
import { protect } from "../middleware/auth.js";
const router = express.Router();
router.get("/:projectId", protect, getMessages);
router.post("/:projectId", protect, sendMessage);
router.delete("/:id", protect, deleteMessage);
router.post("/:id/react", protect, reactToMessage);
export default router;
