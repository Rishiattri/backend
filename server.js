const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const employeeRoutes = require("./routes/employeeRoutes");
const leaveRoutes = require("./routes/leaveRoutes");
const projectRoutes = require("./routes/projectRoutes");

async function dropLegacyLeaveBalanceIndexes() {
  try {
    const indexes = await mongoose.connection.collection("leavebalances").indexes();
    const legacyIndexes = indexes.filter((index) =>
      Object.prototype.hasOwnProperty.call(index.key || {}, "employeeEmail")
    );

    for (const legacyIndex of legacyIndexes) {
      await mongoose.connection.collection("leavebalances").dropIndex(legacyIndex.name);
      console.log(`Dropped legacy leave balance index: ${legacyIndex.name}`);
    }
  } catch (error) {
    if (error?.codeName !== "NamespaceNotFound") {
      console.error("Leave balance index cleanup failed:", error.message);
    }
  }
}

function loadEnvFile() {
  const envPath = path.join(__dirname, ".env");

  if (!fs.existsSync(envPath)) {
    return;
  }

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "");

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile();

const app = express();
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI;
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));

if (!MONGODB_URI) {
  console.error("Missing MONGODB_URI. Add it to server/.env or set it in your shell before starting the server.");
  process.exit(1);
}

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true }
});

const User = mongoose.model("User", userSchema);

app.post("/api/signup", async (req, res) => {
  try {
    const { email, password } = req.body;

    const exists = await User.findOne({ email });

    if (exists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = new User({ email, password });
    await user.save();

    res.json({ message: "Signup successful" });
  } catch (_err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email, password });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.json({ message: "Login successful", email });
  } catch (_err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.use("/api/employees", employeeRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/projects", projectRoutes);

async function startServer() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("MongoDB connected");
    await dropLegacyLeaveBalanceIndexes();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("MongoDB connection failed.");

    if (error?.name === "MongooseServerSelectionError") {
      console.error("Atlas usually returns this when your current public IP is not allowed under Network Access.");
      console.error("Whitelist your IP in MongoDB Atlas, then restart the server.");
    }

    console.error(error.message);
    process.exit(1);
  }
}

startServer();
