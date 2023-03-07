const mongoose = require("mongoose");

const { Schema } = mongoose;

const taskSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["pending", "working", "review", "done", "archive"],
      default: "pending",
    },
    assignees: [{ type: Schema.Types.ObjectId, ref: "Users" }],
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Task = mongoose.model("Tasks", taskSchema);

module.exports = Task;
