
const express = require("express");
const router = express.Router();

const venueController =
  require("../controllers/venueController");

const {
  authenticateToken,
  requireAdmin,
} = require("../authMiddleware");

// View venues
router.get(
  "/",
  authenticateToken,
  venueController.getAllVenues
);

router.get(
  "/:id",
  authenticateToken,
  venueController.getVenueById
);

// Manage venues
router.post(
  "/",
  authenticateToken,
  requireAdmin,
  venueController.createVenue
);

router.put(
  "/:id",
  authenticateToken,
  requireAdmin,
  venueController.updateVenue
);

router.delete(
  "/:id",
  authenticateToken,
  requireAdmin,
  venueController.deleteVenue
);

module.exports = router;
