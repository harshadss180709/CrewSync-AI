import Notification from "../models/Notification.js";

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
    res.json({ success: true, total, unread, notifications });
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
