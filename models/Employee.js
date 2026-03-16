const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema({
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
}, { timestamps: true });

module.exports = mongoose.model("Employee", employeeSchema);

const express = require("express");
const router = express.Router();
const Employee = require("../models/Employee");


// ADD EMPLOYEE
router.post("/add", async (req, res) => {
  try {

    const { name, email, position, department } = req.body;

    const employee = new Employee({
      name,
      email,
      position,
      department
    });

    await employee.save();

    res.json({
      message: "Employee added successfully"
    });

  } catch (error) {

    res.status(500).json({
      message: "Server error"
    });

  }
});


// GET ALL EMPLOYEES
router.get("/", async (req, res) => {

  try {

    const employees = await Employee.find();

    res.json(employees);

  } catch (error) {

    res.status(500).json({
      message: "Server error"
    });

  }

});


module.exports = router;