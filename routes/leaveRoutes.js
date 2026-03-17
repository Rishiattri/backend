const express = require("express");

const Leave = require("../models/Leave");
const LeaveBalance = require("../models/LeaveBalance");
const e = require("express");

const router = express.Router();

const balanceKeyMap = {
  Casual: "casual",
  Sick: "sick",
  Earned: "earned",
  Emergency: "emergency",
  Unpaid: "unpaid"
};

const buildDefaultBalance = (employeeName) => ({
  employeeName,
  casual: { total: 12, used: 0, remaining: 12 },
  sick: { total: 8, used: 0, remaining: 8 },
  earned: { total: 15, used: 0, remaining: 15 },
  emergency: { total: 5, used: 0, remaining: 5 },
  unpaid: { total: 0, used: 0, remaining: 0 }
});

const getDurationInDays = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor((end.setHours(0, 0, 0, 0) - start.setHours(0, 0, 0, 0)) / oneDay) + 1;
};

const ensureBalance = async (employeeName) => {
  const normalizedEmployeeName = employeeName.trim();
  let balance = await LeaveBalance.findOne({ employeeName: normalizedEmployeeName });

  if (!balance) {
    balance = await LeaveBalance.create(buildDefaultBalance(normalizedEmployeeName));
  }

  return balance;
};

const applyApprovalImpact = (balance, leaveType, days, direction) => {
  const key = balanceKeyMap[leaveType];

  if (!key || key === "unpaid") {
    return;
  }

  const bucket = balance[key];

  if (direction === "approve") {
    if (bucket.remaining < days) {
      throw new Error(`Not enough ${leaveType.toLowerCase()} leave balance`);
    }

    bucket.used += days;
    bucket.remaining -= days;
    return;
  }

  bucket.used = Math.max(bucket.used - days, 0);
  bucket.remaining = Math.min(bucket.total - bucket.used, bucket.total);
};

router.post("/apply", async (req, res) => {
  try {
    const { employeeName, leaveType, startDate, endDate, reason } = req.body;
    const days = getDurationInDays(startDate, endDate);

    if (!employeeName || !leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({
        success: false,
        message: "All leave fields are required"
      });
    }

    if (days < 1) {
      return res.status(400).json({
        success: false,
        message: "End date must be the same as or after the start date"
      });
    }

    await ensureBalance(employeeName.trim());

    const leave = await Leave.create({
      employeeName: employeeName.trim(),
      leaveType,
      startDate,
      endDate,
      reason,
      days,
      status: "Pending"
    });

    res.json({
      success: true,
      data: leave,
      message: "Leave request submitted successfully"
    });
  } catch (error) {
    console.error("Leave create failed:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error"
    });
  }
});

router.get("/", async (_req, res) => {
  try {
    const leaves = await Leave.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      items: leaves,
      totalLeaves: leaves.length
    });
  } catch (error) {
    console.error("Leave fetch failed:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error"
    });
  }
});

router.get("/balances", async (_req, res) => {
  try {
    const balances = await LeaveBalance.find().sort({ employeeName: 1 });

    res.json({
      success: true,
      items: balances
    });
  } catch (error) {
    console.error("Leave balance fetch failed:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error"
    });
  }
});

router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    if (!["Approved", "Rejected", "Cancelled"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid leave status"
      });
    }

    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found"
      });
    }

    const balance = await ensureBalance(leave.employeeName);

    if (leave.status === "Approved" && status !== "Approved") {
      applyApprovalImpact(balance, leave.leaveType, leave.days, "revert");
    }

    if (leave.status !== "Approved" && status === "Approved") {
      applyApprovalImpact(balance, leave.leaveType, leave.days, "approve");
    }

    leave.status = status;

    await balance.save();
    await leave.save();

    res.json({
      success: true,
      data: leave,
      message: `Leave request ${status.toLowerCase()} successfully`
    });
  } catch (error) {
    console.error("Leave status update failed:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error"
    });
  }
});

module.exports = router;
