const Venue = require("../models/venueModel");

// GET ALL VENUES
exports.getAllVenues = (req, res) => {
  Venue.getAll((err, results) => {
    if (err) {
      console.error("Get Venues Error:", err);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch venues",
      });
    }

    res.json({
      success: true,
      data: results,
    });
  });
};

// GET VENUE BY ID
exports.getVenueById = (req, res) => {
  Venue.getById(req.params.id, (err, results) => {
    if (err) {
      console.error("Get Venue Error:", err);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch venue",
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Venue not found",
      });
    }

    res.json({
      success: true,
      data: results[0],
    });
  });
};

// CREATE VENUE
exports.createVenue = (req, res) => {
  const {
    venue_name,
    venue_code,
    venue_type,
    capacity,
    faculty_id,
    department_id,
    status,
  } = req.body;

  if (!venue_name || !venue_code || !venue_type || !capacity) {
    return res.status(400).json({
      success: false,
      message: "Venue name, code, type and capacity are required",
    });
  }

  Venue.create(
    {
      venue_name,
      venue_code,
      venue_type,
      capacity,
      faculty_id: faculty_id || null,
      department_id: department_id || null,
      status: status || "Available",
    },
    (err, result) => {
      if (err) {
        console.error("Create Venue Error:", err);

        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({
            success: false,
            message: "Venue code already exists",
          });
        }

        if (err.code === "ER_NO_REFERENCED_ROW_2") {
          return res.status(400).json({
            success: false,
            message: "Selected faculty or department does not exist",
          });
        }

        return res.status(500).json({
          success: false,
          message: "Failed to create venue",
        });
      }

      res.status(201).json({
        success: true,
        message: "Venue added successfully",
        venueId: result.insertId,
      });
    },
  );
};

// UPDATE VENUE
exports.updateVenue = (req, res) => {
  const {
    venue_name,
    venue_code,
    venue_type,
    capacity,
    faculty_id,
    department_id,
    status,
  } = req.body;

  if (!venue_name || !venue_code || !venue_type || !capacity) {
    return res.status(400).json({
      success: false,
      message: "Venue name, code, type and capacity are required",
    });
  }

  Venue.update(
    req.params.id,
    {
      venue_name,
      venue_code,
      venue_type,
      capacity,
      faculty_id: faculty_id || null,
      department_id: department_id || null,
      status: status || "Available",
    },
    (err, result) => {
      if (err) {
        console.error("Update Venue Error:", err);

        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({
            success: false,
            message: "Venue code already exists",
          });
        }

        return res.status(500).json({
          success: false,
          message: "Failed to update venue",
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Venue not found",
        });
      }

      res.json({
        success: true,
        message: "Venue updated successfully",
      });
    },
  );
};

// DELETE VENUE
exports.deleteVenue = (req, res) => {
  Venue.delete(req.params.id, (err, result) => {
    if (err) {
      console.error("Delete Venue Error:", err);

      return res.status(500).json({
        success: false,
        message: "Failed to delete venue",
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Venue not found",
      });
    }

    res.json({
      success: true,
      message: "Venue deleted successfully",
    });
  });
};
