const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");
const Attendance = require("../models/Attendance");

const router = express.Router();
const FULL_DAY_MINUTES = 8 * 60;

function getDateParts() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return {
    dateKey: `${year}-${month}-${day}`,
    workDate: new Date(year, now.getMonth(), now.getDate())
  };
}

router.get("/", authMiddleware, async (req, res) => {
  try {
    const query = req.user.role === "admin" ? {} : { employeeId: req.user.id };
    const items = await Attendance.find(query).sort({ workDate: -1, createdAt: -1 });
    return res.json({ success: true, items });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Server error" });
  }
});

router.get("/summary", authMiddleware, async (req, res) => {
  try {
    const query = req.user.role === "admin" ? {} : { employeeId: req.user.id };
    const items = await Attendance.find(query);

    return res.json({
      success: true,
      data: {
        totalDays: items.length,
        presentDays: items.filter((item) => item.status === "Present").length,
        halfDays: items.filter((item) => item.status === "Half Day").length,
        inProgress: items.filter((item) => item.status === "In Progress").length
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Server error" });
  }
});

router.post("/check-in", authMiddleware, allowRoles("admin", "employee"), async (req, res) => {
  try {
    const { dateKey, workDate } = getDateParts();
    const existing = await Attendance.findOne({ employeeId: req.user.id, dateKey });

    if (existing?.checkInAt) {
      return res.status(400).json({ success: false, message: "Check-in already recorded for today" });
    }

    const attendance = existing || new Attendance({
      employeeId: req.user.id,
      employeeName: req.user.fullName,
      employeeEmail: req.user.email,
      role: req.user.role,
      dateKey,
      workDate
    });

    attendance.checkInAt = new Date();
    attendance.status = "In Progress";

    await attendance.save();

    return res.json({ success: true, data: attendance, message: "Check-in recorded successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Server error" });
  }
});

router.post("/check-out", authMiddleware, allowRoles("admin", "employee"), async (req, res) => {
  try {
    const { dateKey } = getDateParts();
    const attendance = await Attendance.findOne({ employeeId: req.user.id, dateKey });

    if (!attendance || !attendance.checkInAt) {
      return res.status(400).json({ success: false, message: "You need to check in before checking out" });
    }

    if (attendance.checkOutAt) {
      return res.status(400).json({ success: false, message: "Check-out already recorded for today" });
    }

    attendance.checkOutAt = new Date();
    attendance.workedMinutes = Math.max(
      Math.round((attendance.checkOutAt.getTime() - attendance.checkInAt.getTime()) / (1000 * 60)),
      0
    );
    attendance.status = attendance.workedMinutes >= FULL_DAY_MINUTES ? "Present" : "Half Day";

    await attendance.save();

    return res.json({ success: true, data: attendance, message: "Check-out recorded successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Server error" });
  }
});

router.delete("/:id", authMiddleware, allowRoles("admin"), async (req, res) => {
  try {
    const attendance = await Attendance.findByIdAndDelete(req.params.id);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found"
      });
    }

    return res.json({
      success: true,
      message: "Attendance deleted successfully"
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Server error" });
  }
});

module.exports = router;
