const express = require("express");

const Project = require("../models/Project");

const router = express.Router();

router.post("/add", async (req, res) => {
  try {
    const {
      projectName,
      status,
      role,
      developerName,
      techStack
    } = req.body;

    const project = new Project({
      projectName,
      status,
      role,
      developerName,
      techStack
    });

    await project.save();

    res.json({
      success: true,
      data: project,
      message: "Project added successfully"
    });
  } catch (error) {
    console.error("Project create failed:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error"
    });
  }
});

router.get("/", async (_req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    const normalizedProjects = projects.map((project) => ({
      _id: project._id,
      projectName: project.projectName || "",
      status: project.status || "Active",
      role: project.role || "",
      developerName: project.developerName || "",
      techStack: project.techStack || ""
    }));

    res.json({
      success: true,
      data: normalizedProjects,
      totalProjects: normalizedProjects.length
    });
  } catch (error) {
    console.error("Project fetch failed:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error"
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    res.json({
      success: true,
      message: "Project deleted successfully"
    });
  } catch (error) {
    console.error("Project delete failed:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error"
    });
  }
});

module.exports = router;
