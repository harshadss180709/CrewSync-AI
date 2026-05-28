import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    project:  { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    sender:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type:     { type: String, enum: ["text","file","voice","image","system","ai"], default: "text" },
    content:  { type: String, default: "" },

    // File attachment
    attachment: {
      url:      String,
      name:     String,
      fileType: String,
      size:     Number,
    },

    // Read receipts
    readBy: [
      {
        user:    { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        readAt:  { type: Date },
      },
    ],

    replyTo:  { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
    reactions:[
      {
        user:  { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        emoji: { type: String },
      },
    ],

    isEdited:  { type: Boolean, default: false },
    editedAt:  { type: Date },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

messageSchema.index({ project: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });

const Message = mongoose.model("Message", messageSchema);
export default Message;
