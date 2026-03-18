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
      },
      birthdayAlertsEnabled: {
        type: Boolean,
        default: true
      },
      holidayAlertsEnabled: {
        type: Boolean,
        default: true
      },
      senderName: {
        type: String,
        default: "StaffHub",
        trim: true
      },
      senderEmail: {
        type: String,
        default: "",
        trim: true,
        lowercase: true
      },
      scheduleCron: {
        type: String,
        default: "0 8 * * *",
        trim: true
      },
      holidays: {
        type: [
          new mongoose.Schema(
            {
              name: {
                type: String,
                required: true,
                trim: true
              },
              monthDay: {
                type: String,
                required: true,
                trim: true,
                match: /^\d{2}-\d{2}$/
              },
              description: {
                type: String,
                default: "",
                trim: true
              },
              active: {
                type: Boolean,
                default: true
              }
            },
            { _id: false }
          )
        ],
        default: []
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
