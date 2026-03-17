const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");
const SystemSettings = require("../models/SystemSettings");

const router = express.Router();

async function ensureSettings() {
  let settings = await SystemSettings.findOne();

  if (!settings) {
    settings = await SystemSettings.create({});
  }

  return settings;
}

router.get("/", authMiddleware, async (req, res) => {
  try {
    const settings = await ensureSettings();

    if (req.user.role === "employee") {
      return res.json({
        success: true,
        data: {
          notifications: settings.notifications,
          employeePreferences: settings.employeePreferences
        }
      });
    }

    return res.json({ success: true, data: settings });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Server error" });
  }
});

router.put("/", authMiddleware, allowRoles("admin"), async (req, res) => {
  try {
    const settings = await SystemSettings.findOneAndUpdate({}, req.body, { new: true, upsert: true });
    return res.json({ success: true, data: settings, message: "Settings updated successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Server error" });
  }
});

module.exports = router;
