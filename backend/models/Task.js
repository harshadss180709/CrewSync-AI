import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    project:     { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    title:       { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    assignedTo:  [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    status: {
      type: String,
      enum: ["todo","in_progress","review","completed","blocked"],
      default: "todo",
    },
    priority: {
      type: String,
      enum: ["low","medium","high","critical"],
      default: "medium",
    },
    category: {
      type: String,
      enum: ["design","development","audio","video","writing","research","review","other"],
      default: "other",
    },

    dueDate:     { type: Date },
    completedAt: { type: Date },
    estimatedHours: { type: Number, default: 0 },
    loggedHours:    { type: Number, default: 0 },

    subtasks: [
      {
        title:       { type: String, required: true },
        isCompleted: { type: Boolean, default: false },
        completedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
    ],

    attachments: [
      {
        name:  String,
        url:   String,
        type:  String,
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        addedAt: { type: Date, default: Date.now },
      },
    ],

    comments: [
      {
        user:      { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        text:      String,
        createdAt: { type: Date, default: Date.now },
      },
    ],

    contributionWeight: { type: Number, default: 1, min: 0.1, max: 10 },
    tags:               [String],
    position:           { type: Number, default: 0 },
  },
  { timestamps: true }
);

taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ assignedTo: 1 });

const Task = mongoose.model("Task", taskSchema);
export default Task;
