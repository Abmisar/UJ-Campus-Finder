// Contact messages routes — UJ Campus Finder
// Handles messages submitted from the contact page.

const express = require("express");
const router = express.Router();
const db = require("../db");

// Very simple email check used as a backend safety net
// (the frontend has stricter validation as well).
function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
}

// -----------------------------------------------------------------
// GET /api/contact
// Return all contact messages, newest first.
// -----------------------------------------------------------------
router.get("/", async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT * FROM contact_messages ORDER BY created_at DESC"
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error("GET /api/contact error:", err.message);
        res.status(500).json({ success: false, message: "Failed to fetch messages" });
    }
});

// -----------------------------------------------------------------
// POST /api/contact
// Save a new contact / help message.
// Body: { name, email, subject, message }
// -----------------------------------------------------------------
router.post("/", async (req, res) => {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({
            success: false,
            message: "name, email and message are required"
        });
    }
    if (!isValidEmail(email)) {
        return res.status(400).json({
            success: false,
            message: "Please provide a valid email address"
        });
    }

    try {
        const [result] = await db.query(
            `INSERT INTO contact_messages (name, email, subject, message)
             VALUES (?, ?, ?, ?)`,
            [name, email, subject || null, message]
        );
        res.status(201).json({
            success: true,
            message: "Message sent successfully",
            id: result.insertId
        });
    } catch (err) {
        console.error("POST /api/contact error:", err.message);
        res.status(500).json({ success: false, message: "Failed to save message" });
    }
});

module.exports = router;
