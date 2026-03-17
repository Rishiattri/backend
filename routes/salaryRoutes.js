const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");
const SalarySlip = require("../models/SalarySlip");
const User = require("../models/User");

const router = express.Router();

router.get("/", authMiddleware, allowRoles("admin"), async (_req, res) => {
  try {
    const items = await SalarySlip.find().sort({ createdAt: -1 });
    return res.json({ success: true, items });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Server error" });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const items = await SalarySlip.find({
      $or: [{ employeeId: req.user.id }, { employeeEmail: req.user.email }]
    }).sort({ createdAt: -1 });
    return res.json({ success: true, items });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Server error" });
  }
});

router.post("/", authMiddleware, allowRoles("admin"), async (req, res) => {
  try {
    const {
      employeeId,
      employeeEmail,
      employeeName,
      month,
      baseSalary,
      bonus = 0,
      deductions = 0
    } = req.body;

    if (!employeeName || !employeeEmail || !month || baseSalary === undefined) {
      return res.status(400).json({ success: false, message: "Employee, month, and salary fields are required" });
    }

    const linkedUser = employeeId
      ? await User.findById(employeeId)
      : await User.findOne({ email: String(employeeEmail).toLowerCase() });

    const netSalary = Number(baseSalary) + Number(bonus) - Number(deductions);
    const salarySlip = await SalarySlip.create({
      employeeId: linkedUser?._id || null,
      employeeEmail: String(employeeEmail).toLowerCase(),
      employeeName,
      month,
      baseSalary,
      bonus,
      deductions,
      netSalary
    });

    return res.json({ success: true, data: salarySlip, message: "Salary slip created successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Server error" });
  }
});

module.exports = router;
