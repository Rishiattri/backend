const express = require("express");

const Employee = require("../models/Employee");

const router = express.Router();

router.post("/add", async (req, res) => {
  try {
    const {
      fullName,
      email,
      phoneNumber,
      role,
      education,
      address,
      experienceLevel,
      joiningDate,
      profileImage
    } = req.body;

    const existingEmployee = await Employee.findOne({ email: String(email).toLowerCase() });

    if (existingEmployee) {
      return res.status(400).json({
        success: false,
        message: "Employee email already exists"
      });
    }

    const employee = new Employee({
      name: fullName,
      fullName,
      email,
      phoneNumber,
      position: role,
      role,
      department: education,
      education,
      address,
      experienceLevel,
      joiningDate,
      profileImage
    });

    await employee.save();

    res.json({
      success: true,
      data: employee,
      message: "Employee added successfully"
    });
  } catch (error) {
    console.error("Employee create failed:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error"
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const employees = await Employee.find().sort({ createdAt: -1 });
    const normalizedEmployees = employees.map((employee) => ({
      _id: employee._id,
      fullName: employee.fullName || employee.name || "",
      email: employee.email || "",
      phoneNumber: employee.phoneNumber || "",
      role: employee.role || employee.position || "",
      education: employee.education || employee.department || "",
      address: employee.address || "",
      experienceLevel: employee.experienceLevel || "Fresher",
      joiningDate: employee.joiningDate || employee.createdAt,
      profileImage: employee.profileImage || ""
    }));

    res.json({
      success: true,
      items: normalizedEmployees,
      totalEmployees: normalizedEmployees.length
    });
  } catch (error) {
    console.error("Employee fetch failed:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error"
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    res.json({
      success: true,
      message: "Employee deleted successfully"
    });
  } catch (error) {
    console.error("Employee delete failed:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error"
    });
  }
});

module.exports = router;
