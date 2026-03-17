const mongoose = require("mongoose");

const balanceBucketSchema = new mongoose.Schema(
  {
    total: {
      type: Number,
      required: true,
      default: 0
    },
    used: {
      type: Number,
      required: true,
      default: 0
    },
    remaining: {
      type: Number,
      required: true,
      default: 0
    }
  },
  { _id: false }
);

const leaveBalanceSchema = new mongoose.Schema(
  {
    employeeName: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    casual: {
      type: balanceBucketSchema,
      default: () => ({ total: 12, used: 0, remaining: 12 })
    },
    sick: {
      type: balanceBucketSchema,
      default: () => ({ total: 8, used: 0, remaining: 8 })
    },
    earned: {
      type: balanceBucketSchema,
      default: () => ({ total: 15, used: 0, remaining: 15 })
    },
    emergency: {
      type: balanceBucketSchema,
      default: () => ({ total: 5, used: 0, remaining: 5 })
    },
    unpaid: {
      type: balanceBucketSchema,
      default: () => ({ total: 0, used: 0, remaining: 0 })
    }
  },
  { timestamps: true }
);

module.exports = mongoose.models.LeaveBalance || mongoose.model("LeaveBalance", leaveBalanceSchema);
