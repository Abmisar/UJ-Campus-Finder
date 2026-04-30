// Claim requests routes — UJ Campus Finder
// Handles claim submissions linked to a report.

const express = require("express");
const router = express.Router();
const db = require("../db");

const VALID_STATUSES = ["pending", "approved", "rejected"];

// -----------------------------------------------------------------
// GET /api/claims
// Return all claim requests, newest first.
// -----------------------------------------------------------------
router.get("/", async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT c.*, r.title AS report_title, r.type AS report_type
             FROM claim_requests c
             LEFT JOIN reports r ON r.id = c.report_id
             ORDER BY c.created_at DESC`
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error("GET /api/claims error:", err.message);
        res.status(500).json({ success: false, message: "Failed to fetch claims" });
    }
});

// -----------------------------------------------------------------
// POST /api/claims
// Submit a new claim for a specific report.
// Body: { report_id, claimant, student_id, email, phone, message }
// -----------------------------------------------------------------
router.post("/", async (req, res) => {
    const { report_id, claimant, student_id, email, phone, message } = req.body;

    if (!report_id || !claimant) {
        return res.status(400).json({
            success: false,
            message: "report_id and claimant are required"
        });
    }

    try {
        // Make sure the report exists before linking a claim to it.
        const [reports] = await db.query(
            "SELECT id FROM reports WHERE id = ?",
            [report_id]
        );
        if (reports.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Report not found — please check the Report ID"
            });
        }

        const [result] = await db.query(
            `INSERT INTO claim_requests
                (report_id, claimant, student_id, email, phone, message)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                report_id,
                claimant,
                student_id || null,
                email || null,
                phone || null,
                message || null
            ]
        );
        res.status(201).json({
            success: true,
            message: "Claim submitted successfully",
            id: result.insertId
        });
    } catch (err) {
        console.error("POST /api/claims error:", err.message);
        res.status(500).json({ success: false, message: "Failed to save claim" });
    }
});

// -----------------------------------------------------------------
// PUT /api/claims/:id/status
// Update the status of a claim (pending / approved / rejected).
// -----------------------------------------------------------------
router.put("/:id/status", async (req, res) => {
    const { status } = req.body;

    if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({
            success: false,
            message: "status must be 'pending', 'approved' or 'rejected'"
        });
    }

    try {
        const [result] = await db.query(
            "UPDATE claim_requests SET status = ? WHERE id = ?",
            [status, req.params.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Claim not found" });
        }
        res.json({ success: true, message: "Claim status updated" });
    } catch (err) {
        console.error("PUT /api/claims/:id/status error:", err.message);
        res.status(500).json({ success: false, message: "Failed to update claim" });
    }
});

module.exports = router;
