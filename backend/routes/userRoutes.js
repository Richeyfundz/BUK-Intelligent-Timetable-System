const express = require("express");

const router = express.Router();

const userController = require("../controllers/userController");

// =============================================
// GET ALL USERS
// =============================================
router.get("/", userController.getUsers);

// =============================================
// CREATE NEW USER
// =============================================
router.post("/", userController.createUser);

// =============================================
// UPDATE USER
// =============================================
router.put("/:id", userController.updateUser);

// =============================================
// ACTIVATE / DEACTIVATE USER
// =============================================
router.patch("/:id/status", userController.toggleUserStatus);

// =============================================
// DELETE USER
// =============================================
router.delete("/:id", userController.deleteUser);

module.exports = router;
