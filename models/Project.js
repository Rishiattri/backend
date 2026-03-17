const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    projectName: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ["Active", "Completed"],
      default: "Active",
      required: true
    },
    role: {
      type: String,
      required: true,
      trim: true
    },
    developerName: {
      type: String,
      required: true,
      trim: true
    },
    techStack: {
      type: String,
      required: true,
      trim: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.models.Project || mongoose.model("Project", projectSchema);
