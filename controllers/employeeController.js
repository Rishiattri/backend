const Employee = require("../data/employeeModel");

exports.getTotalEmployees = async (req, res) => {
  try {
    const totalEmployees = await Employee.countDocuments();

    res.status(200).json({
      success: true,
      totalEmployees: totalEmployees
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching total employees",
      error: error.message
    });
  }
};