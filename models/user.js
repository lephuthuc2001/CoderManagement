const mongoose = require("mongoose");

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["Manager", "Employee"],
      required: true,
      default: "Employee",
    },
    department: {
      type: String,
      enum: [
        "Marketing",
        "Sales",
        "Human Resources",
        "Customer Service",
        "Tech",
      ],
      required: true,
    },
    tasks: [{ type: Schema.Types.ObjectId, ref: "Tasks" }],
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const User = mongoose.model("Users", userSchema);

module.exports = User;
