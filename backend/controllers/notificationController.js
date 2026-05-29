import Notification from "../models/Notification.js";

// ── Shared helper — save to DB then push over socket ─────
// Call this from ANY controller that needs to notify a user.
// `app` is the Express app instance (holds the io reference).
export async function pushNotification(app, payload) {
  const doc = await Notification.create(payload);
  const populated = await doc.populate("sender", "name avatar");

  // Emit to the recipient's personal socket room (if connected)
  const io = app?.get("io");
  if (io) {
    io.to(`user:${payload.recipient}`).emit("notification:new", populated);
  }

  return populated;
}

export const getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const total = await Notification.countDocuments({ recipient: req.user._id });
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate("sender", "name avatar")
      .sort("-createdAt")
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const unread = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
    // Send both names — frontend components use different keys historically
    res.json({ success: true, total, unread, unreadCount: unread, notifications });
  } catch (err) { next(err); }
};

export const markAsRead = async (req, res, next) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true, readAt: Date.now() }
    );
    res.json({ success: true, message: "Marked as read." });
  } catch (err) { next(err); }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true, readAt: Date.now() }
    );
    res.json({ success: true, message: "All notifications marked as read." });
  } catch (err) { next(err); }
};

export const deleteNotification = async (req, res, next) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user._id });
    res.json({ success: true, message: "Notification deleted." });
  } catch (err) { next(err); }
};
