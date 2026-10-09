
const express = require("express");
const router = express.Router();

const lecturerController =
  require("../controllers/lecturerController");

// Lecturer records
router.get("/", lecturerController.getAllLecturers);
router.get("/:id", lecturerController.getLecturerById);
router.post("/", lecturerController.createLecturer);
router.put("/:id", lecturerController.updateLecturer);
router.delete("/:id", lecturerController.deleteLecturer);

// Course assignments
router.get("/courses", lecturerController.getCourses);
router.get(
  "/:id/courses",
  lecturerController.getAssignedCourses
);
router.put(
  "/:id/courses",
  lecturerController.assignCourses
);

module.exports = router;
