const mongoose = require("mongoose");

const salarySlipSchema = new mongoose.Schema(
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
    month: {
      type: String,
      required: true,
      trim: true
    },
    baseSalary: {
      type: Number,
      required: true,
      min: 0
    },
    bonus: {
      type: Number,
      default: 0,
      min: 0
    },
    deductions: {
      type: Number,
      default: 0,
      min: 0
    },
    netSalary: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { timestamps: true }
);

module.exports = mongoose.models.SalarySlip || mongoose.model("SalarySlip", salarySlipSchema);
