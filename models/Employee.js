const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    position: {
      type: String
    },
    department: {
      type: String
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Employee", employeeSchema);
