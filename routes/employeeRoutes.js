const express = require("express");
const router = express.Router();

const mongoose = require("mongoose");

// Employee schema
const employeeSchema = new mongoose.Schema({
  name: String,
  email: String,
});

const Employee = mongoose.model("Employee", employeeSchema);


// GET TOTAL EMPLOYEES
router.get("/", async (req, res) => {
  try {

    const total = await Employee.countDocuments();

    res.json({
      totalEmployees: total
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error"
    });
  }
});


module.exports = router;