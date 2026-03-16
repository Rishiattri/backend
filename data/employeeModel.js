const mongoose = require("mongoose");

const EmployeeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  role: {
    type: String,
  },
  department: {
    type: String,
  },
  status: {
    type: String,
    default: "Active",
  },
}, { timestamps: true });

module.exports = mongoose.model("Employee", EmployeeSchema);