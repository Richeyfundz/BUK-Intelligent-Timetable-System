
const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const {
  authenticateToken,
  requireAdmin
} = require("../authMiddleware");

// All user-management routes require an Admin account.
router.use(authenticateToken, requireAdmin);

router.get("/", userController.getUsers);
router.post("/", userController.createUser);
router.put("/:id", userController.updateUser);
router.delete("/:id", userController.deleteUser);

// Toggle a user's Active/Inactive status.
router.patch(
  "/:id/status",
  userController.toggleUserStatus
);

module.exports = router;
