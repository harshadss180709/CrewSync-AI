import Message from "../models/Message.js";
import Contribution from "../models/Contribution.js";

// ── @GET /api/messages/:projectId ────────────────────────
export const getMessages = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const total    = await Message.countDocuments({ project: req.params.projectId, isDeleted: false });
    const messages = await Message.find({ project: req.params.projectId, isDeleted: false })
      .populate("sender", "name avatar role")
      .populate("replyTo")
      .sort("-createdAt")
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ success: true, total, messages: messages.reverse() });
  } catch (err) { next(err); }
};

// ── @POST /api/messages/:projectId ───────────────────────
export const sendMessage = async (req, res, next) => {
  try {
    const { content, type, attachment, replyTo } = req.body;
    const message = await Message.create({
      project:    req.params.projectId,
      sender:     req.user._id,
      content,
      type:       type || "text",
      attachment,
      replyTo,
    });
    const populated = await message.populate("sender", "name avatar role");

    // Update contribution
    await Contribution.findOneAndUpdate(
      { project: req.params.projectId, freelancer: req.user._id },
      { $inc: { messagesCount: 1, contributionScore: 1 }, lastActiveAt: Date.now() },
      { upsert: true }
    );

    // Emit via socket
    req.app.get("io")?.to(`project:${req.params.projectId}`).emit("message:new", populated);

    res.status(201).json({ success: true, message: populated });
  } catch (err) { next(err); }
};

// ── @DELETE /api/messages/:id ─────────────────────────────
export const deleteMessage = async (req, res, next) => {
  try {
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).json({ success: false, message: "Message not found." });
    if (msg.sender.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorised." });
    }
    msg.isDeleted = true;
    await msg.save({ validateBeforeSave: false });
    res.json({ success: true, message: "Message deleted." });
  } catch (err) { next(err); }
};

// ── @POST /api/messages/:id/react ─────────────────────────
export const reactToMessage = async (req, res, next) => {
  try {
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).json({ success: false, message: "Message not found." });
    const existing = msg.reactions.find(r => r.user.toString() === req.user._id.toString() && r.emoji === req.body.emoji);
    if (existing) {
      msg.reactions = msg.reactions.filter(r => !(r.user.toString() === req.user._id.toString() && r.emoji === req.body.emoji));
    } else {
      msg.reactions.push({ user: req.user._id, emoji: req.body.emoji });
    }
    await msg.save({ validateBeforeSave: false });
    req.app.get("io")?.to(`project:${msg.project}`).emit("message:reacted", { messageId: msg._id, reactions: msg.reactions });
    res.json({ success: true, reactions: msg.reactions });
  } catch (err) { next(err); }
};
