const express = require("express");
const bcrypt = require("bcryptjs");

const authMiddleware = require("../middleware/authMiddleware");
const Profile = require("../models/Profile");
const User = require("../models/User");

const router = express.Router();

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.user.id });
    return res.json({ success: true, data: profile });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Server error" });
  }
});

router.put("/me", authMiddleware, async (req, res) => {
  try {
    const updates = req.body;
    const profile = await Profile.findOneAndUpdate(
      { userId: req.user.id },
      {
        name: updates.name,
        phone: updates.phone,
        role: updates.role,
        department: updates.department,
        joiningDate: updates.joiningDate,
        experience: updates.experience,
        address: updates.address,
        profileImage: updates.profileImage,
        email: updates.email
      },
      { returnDocument: "after", upsert: true }
    );

    await User.findByIdAndUpdate(req.user.id, {
      fullName: updates.name || req.user.fullName,
      email: updates.email || req.user.email
    });

    return res.json({ success: true, data: profile, message: "Profile updated successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Server error" });
  }
});

router.patch("/change-password", authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Current password is incorrect" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Server error" });
  }
});

module.exports = router;
