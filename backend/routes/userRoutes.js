
const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const {
  authenticateToken,
  requireAdmin,
} = require("../middleware/authMiddleware");

// User management requires an active administrator.
router.use(authenticateToken, requireAdmin);

router.get("/", userController.getUsers);
router.post("/", userController.createUser);
router.put("/:id", userController.updateUser);
router.patch("/:id/status", userController.toggleUserStatus);
router.delete("/:id", userController.deleteUser);

module.exports = router;
