const express = require("express");

const Employee = require("../models/Employee");

const router = express.Router();

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

router.get("/", async (req, res) => {
  try {
    const totalEmployees = await Employee.countDocuments();

    res.json({
      totalEmployees
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error"
    });
  }
});

module.exports = router;
