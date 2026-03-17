const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const authRoutes = require("./routes/authRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const leaveRoutes = require("./routes/leaveRoutes");
const profileRoutes = require("./routes/profileRoutes");
const projectRoutes = require("./routes/projectRoutes");
const salaryRoutes = require("./routes/salaryRoutes");
const settingsRoutes = require("./routes/settingsRoutes");

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

app.use("/api", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/salary", salaryRoutes);
app.use("/api/settings", settingsRoutes);

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
