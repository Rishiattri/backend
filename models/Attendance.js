const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    employeeName: {
      type: String,
      required: true,
      trim: true
    },
    employeeEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    role: {
      type: String,
      enum: ["admin", "employee"],
      default: "employee"
    },
    dateKey: {
      type: String,
      required: true,
      trim: true
    },
    workDate: {
      type: Date,
      required: true
    },
    checkInAt: {
      type: Date,
      default: null
    },
    checkOutAt: {
      type: Date,
      default: null
    },
    workedMinutes: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ["In Progress", "Present", "Half Day", "Missed"],
      default: "In Progress"
    }
  },
  { timestamps: true }
);

attendanceSchema.index({ employeeId: 1, dateKey: 1 }, { unique: true });

module.exports = mongoose.models.Attendance || mongoose.model("Attendance", attendanceSchema);
