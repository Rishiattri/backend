const mongoose = require("mongoose");

const leaveSchema = new mongoose.Schema(
  {
    employeeName: {
      type: String,
      required: true,
      trim: true
    },
    leaveType: {
      type: String,
      enum: ["Casual", "Sick", "Earned", "Unpaid"],
      required: true
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    reason: {
      type: String,
      required: true,
      trim: true
    },
    days: {
      type: Number,
      required: true,
      min: 1
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Cancelled"],
      default: "Pending"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.models.Leave || mongoose.model("Leave", leaveSchema);
