import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    sender:    { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    type: {
      type: String,
      enum: [
        "project_invite","task_assigned","payment_received","payment_pending",
        "project_update","message","review_received","milestone_completed",
        "deadline_reminder","ai_suggestion","system","admin_alert",
      ],
      required: true,
    },

    title:   { type: String, required: true },
    message: { type: String, required: true },
    link:    { type: String, default: "" },

    isRead: { type: Boolean, default: false },
    readAt: { type: Date },

    metadata: { type: mongoose.Schema.Types.Mixed },
    priority: { type: String, enum: ["low","normal","high","urgent"], default: "normal" },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
