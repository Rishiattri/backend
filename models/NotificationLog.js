const mongoose = require("mongoose");

const notificationLogSchema = new mongoose.Schema(
  {
    dedupeKey: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    type: {
      type: String,
      enum: ["birthday", "holiday"],
      required: true
    },
    status: {
      type: String,
      enum: ["sent", "failed"],
      default: "sent"
    },
    notificationDateKey: {
      type: String,
      required: true,
      trim: true
    },
    recipientEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    recipientName: {
      type: String,
      default: "",
      trim: true
    },
    employeeId: {
      type: String,
      default: null,
      trim: true
    },
    holidayName: {
      type: String,
      default: "",
      trim: true
    },
    subject: {
      type: String,
      default: "",
      trim: true
    },
    errorMessage: {
      type: String,
      default: "",
      trim: true
    }
  },
  { timestamps: true }
);

notificationLogSchema.index({ notificationDateKey: 1, type: 1, recipientEmail: 1 });

module.exports = mongoose.models.NotificationLog || mongoose.model("NotificationLog", notificationLogSchema);
