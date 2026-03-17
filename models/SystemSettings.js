const mongoose = require("mongoose");

const systemSettingsSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      default: "StaffHub",
      trim: true
    },
    companyEmail: {
      type: String,
      default: "",
      trim: true,
      lowercase: true
    },
    companyPhone: {
      type: String,
      default: "",
      trim: true
    },
    leavePolicy: {
      maxLeavesPerDay: {
        type: Number,
        default: 2,
        min: 1
      },
      allowAdminOverride: {
        type: Boolean,
        default: true
      }
    },
    rolePermissions: {
      adminCanManageSettings: {
        type: Boolean,
        default: true
      },
      employeeCanEditProfile: {
        type: Boolean,
        default: true
      }
    },
    notifications: {
      emailEnabled: {
        type: Boolean,
        default: true
      },
      pushEnabled: {
        type: Boolean,
        default: false
      }
    },
    employeePreferences: {
      theme: {
        type: String,
        enum: ["dark", "light"],
        default: "dark"
      },
      emailNotifications: {
        type: Boolean,
        default: true
      }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.models.SystemSettings || mongoose.model("SystemSettings", systemSettingsSchema);
