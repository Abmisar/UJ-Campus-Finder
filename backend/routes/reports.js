// Reports routes — UJ Campus Finder
// Handles lost / found item reports.

const express = require("express");
const router = express.Router();
const db = require("../db");

// Allowed values for the ENUM columns in the database.
const VALID_TYPES = ["lost", "found"];
const VALID_STATUSES = ["open", "resolved"];

// -----------------------------------------------------------------
// GET /api/reports
// Return all reports, newest first.
// -----------------------------------------------------------------
router.get("/", async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT * FROM reports ORDER BY created_at DESC"
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error("GET /api/reports error:", err.message);
        res.status(500).json({ success: false, message: "Failed to fetch reports" });
    }
});

// -----------------------------------------------------------------
// GET /api/reports/:id
// Return a single report by id.
// -----------------------------------------------------------------
router.get("/:id", async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT * FROM reports WHERE id = ?",
            [req.params.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Report not found" });
        }
        res.json({ success: true, data: rows[0] });
    } catch (err) {
        console.error("GET /api/reports/:id error:", err.message);
        res.status(500).json({ success: false, message: "Failed to fetch report" });
    }
});

// -----------------------------------------------------------------
// POST /api/reports
// Create a new lost or found report.
// Body: { type, title, description, location, image_path, contact }
// -----------------------------------------------------------------
router.post("/", async (req, res) => {
    const { type, title, description, location, image_path, contact } = req.body;

    // Simple validation — all important fields must be present.
    if (!type || !title || !location || !contact) {
        return res.status(400).json({
            success: false,
            message: "type, title, location and contact are required"
        });
    }
    if (!VALID_TYPES.includes(type)) {
        return res.status(400).json({
            success: false,
            message: "type must be either 'lost' or 'found'"
        });
    }

    try {
        const [result] = await db.query(
            `INSERT INTO reports (type, title, description, location, image_path, contact)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [type, title, description || null, location, image_path || null, contact]
        );
        res.status(201).json({
            success: true,
            message: "Report submitted successfully",
            id: result.insertId
        });
    } catch (err) {
        console.error("POST /api/reports error:", err.message);
        res.status(500).json({ success: false, message: "Failed to save report" });
    }
});

// -----------------------------------------------------------------
// PUT /api/reports/:id/status
// Update the status of a report (open / resolved).
// -----------------------------------------------------------------
router.put("/:id/status", async (req, res) => {
    const { status } = req.body;

    if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({
            success: false,
            message: "status must be 'open' or 'resolved'"
        });
    }

    try {
        const [result] = await db.query(
            "UPDATE reports SET status = ? WHERE id = ?",
            [status, req.params.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Report not found" });
        }
        res.json({ success: true, message: "Report status updated" });
    } catch (err) {
        console.error("PUT /api/reports/:id/status error:", err.message);
        res.status(500).json({ success: false, message: "Failed to update report" });
    }
});

// -----------------------------------------------------------------
// DELETE /api/reports/:id
// Delete a report (any linked claim_requests are removed by ON DELETE CASCADE).
// -----------------------------------------------------------------
router.delete("/:id", async (req, res) => {
    try {
        const [result] = await db.query(
            "DELETE FROM reports WHERE id = ?",
            [req.params.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Report not found" });
        }
        res.json({ success: true, message: "Report deleted" });
    } catch (err) {
        console.error("DELETE /api/reports/:id error:", err.message);
        res.status(500).json({ success: false, message: "Failed to delete report" });
    }
});

module.exports = router;
