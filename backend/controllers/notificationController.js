import Notification from "../models/Notification.js";

// ─────────────────────────────────────────────────────────────
//  Shared helper — persist to MongoDB then push over Socket.IO
//  Call this from ANY controller that needs to notify a user.
//  `app` is the Express app instance (stored req.app).
// ─────────────────────────────────────────────────────────────
export async function pushNotification(app, payload) {
  // 1. Save to DB
  const doc = await Notification.create(payload);

  // 2. Populate sender so the frontend receives a full object
  const populated = await Notification.findById(doc._id)
    .populate("sender", "name avatar")
    .lean();

  // 3. Emit to the recipient's personal socket room
  const io = app?.get("io");
  if (io && populated) {
    // Room is named "user:{ObjectId string}" — exactly how sockets/index.js joins it
    io.to(`user:${payload.recipient}`).emit("notification:new", populated);
  }

  return populated;
}

// ── GET /api/notifications ────────────────────────────────────
export const getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const query = { recipient: req.user._id };

    const [total, unread, notifications] = await Promise.all([
      Notification.countDocuments(query),
      Notification.countDocuments({ ...query, isRead: false }),
      Notification.find(query)
        .populate("sender", "name avatar")
        .sort("-createdAt")
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .lean(),
    ]);

    res.json({
      success: true,
      total,
      unread,
      unreadCount: unread,   // alias — some frontend components read one, some the other
      notifications,
    });
  } catch (err) { next(err); }
};

// ── PUT /api/notifications/:id/read ──────────────────────────
export const markAsRead = async (req, res, next) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true, readAt: new Date() }
    );
    res.json({ success: true });
  } catch (err) { next(err); }
};

// ── PUT /api/notifications/read-all ──────────────────────────
export const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    res.json({ success: true, message: "All notifications marked as read." });
  } catch (err) { next(err); }
};

// ── DELETE /api/notifications/:id ─────────────────────────────
export const deleteNotification = async (req, res, next) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user._id });
    res.json({ success: true });
  } catch (err) { next(err); }
};
