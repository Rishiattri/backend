const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      default: "",
      trim: true
    },
    role: {
      type: String,
      default: "Employee",
      trim: true
    },
    department: {
      type: String,
      default: "General",
      trim: true
    },
    joiningDate: {
      type: Date,
      default: Date.now
    },
    experience: {
      type: String,
      default: "Fresher",
      trim: true
    },
    address: {
      type: String,
      default: "",
      trim: true
    },
    profileImage: {
      type: String,
      default: "",
      trim: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.models.Profile || mongoose.model("Profile", profileSchema);
