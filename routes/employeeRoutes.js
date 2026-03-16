const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema({
  name: String,
  email: String,
});

const Employee = mongoose.model("Employee", employeeSchema);


// ADD EMPLOYEE
router.post("/add", async (req, res) => {

  try {

    const { name, email } = req.body;

    const employee = new Employee({
      name,
      email
    });

    await employee.save();

    res.json({
      message: "Employee added successfully"
    });

  } catch (err) {

    res.status(500).json({
      message: "Server error"
    });

  }

});


// GET TOTAL EMPLOYEES
router.get("/", async (req, res) => {

  const total = await Employee.countDocuments();

  res.json({
    totalEmployees: total
  });

});

module.exports = router;