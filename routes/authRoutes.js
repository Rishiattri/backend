const express = require("express");
const bcrypt = require("bcryptjs");

const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/User");
const Profile = require("../models/Profile");
const Employee = require("../models/Employee");
const { createToken } = require("../utils/jwt");

const router = express.Router();

const buildAuthPayload = (user) => ({
  id: String(user._id),
  fullName: user.fullName,
  email: user.email,
  role: user.role
});

router.post("/signup", async (req, res) => {
  try {
    const { fullName, email, password, role = "employee" } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ success: false, message: "Full name, email, and password are required" });
    }

    const existingUser = await User.findOne({ email: String(email).toLowerCase() });

    if (existingUser) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      fullName: fullName.trim(),
      email: String(email).toLowerCase(),
      password: hashedPassword,
      role: role === "admin" ? "admin" : "employee"
    });

    await Profile.create({
      userId: user._id,
      name: user.fullName,
      email: user.email,
      role: user.role === "admin" ? "Admin" : "Employee"
    });

    const token = createToken(buildAuthPayload(user));

    res.json({
      success: true,
      message: "Signup successful",
      token,
      user: buildAuthPayload(user)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: String(email).toLowerCase() });

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = createToken(buildAuthPayload(user));

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: buildAuthPayload(user)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.user.id });
    const employee = await Employee.findOne({ email: req.user.email });

    res.json({
      success: true,
      user: req.user,
      profile: profile || null,
      employee: employee || null
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
});

module.exports = router;
