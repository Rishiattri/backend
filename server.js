const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
app.use(express.json());
app.use(cors({
  origin: "http://localhost:3000", // Next.js default port
  credentials: true
}));

// ✅ MongoDB Connect
mongoose.connect("mongodb+srv://gotbit:Aannuuuu%40123@cluster0.1t8kp8h.mongodb.net/staffhub")
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ MongoDB Error:", err));

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
});
const User = mongoose.model("User", userSchema);

// ✅ SIGNUP
app.post("/api/signup", async (req, res) => {
  try {
    const { email, password } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "User already exists" });
    const user = new User({ email, password });
    await user.save();
    res.json({ message: "Signup successful" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ LOGIN
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    res.json({ message: "Login successful", email });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.listen(3001, () => {
  console.log("🚀 Server running on http://localhost:3001");
});