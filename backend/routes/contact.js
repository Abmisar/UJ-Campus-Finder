// Contact messages routes — UJ Campus Finder
// Handles messages submitted from the contact page.

const express = require("express");
const router = express.Router();
const db = require("../db");
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

// Very simple email check used as a backend safety net
// (the frontend has stricter validation as well).
function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
}

// Escape HTML special characters to prevent XSS in the email body.
function esc(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/\n/g, '<br>');
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
// Save a new contact / help message, then send a notification email.
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

    // ── Step 1: Save to MySQL ────────────────────────────────────
    let insertId;
    try {
        const [result] = await db.query(
            `INSERT INTO contact_messages (name, email, subject, message)
             VALUES (?, ?, ?, ?)`,
            [name, email, subject || null, message]
        );
        insertId = result.insertId;
    } catch (err) {
        console.error("POST /api/contact DB error:", err.message);
        return res.status(500).json({ success: false, message: "Failed to save message" });
    }

    // ── Step 2: Send email via Resend (non-blocking on failure) ──
    const toEmail   = process.env.CONTACT_TO_EMAIL;
    const fromEmail = process.env.CONTACT_FROM_EMAIL || "UJ Campus Finder <onboarding@resend.dev>";

    if (toEmail && process.env.RESEND_API_KEY) {
        try {
            await resend.emails.send({
                from:     fromEmail,
                to:       [toEmail],
                reply_to: email,
                subject:  `New Contact Message: ${subject || '(no subject)'}`,
                html: `
                    <h2 style="font-family:sans-serif;color:#004731;">New message from UJ Campus Finder</h2>
                    <table style="font-family:sans-serif;font-size:15px;border-collapse:collapse;width:100%;max-width:540px;">
                        <tr><td style="padding:8px 0;color:#54676d;width:90px;"><strong>Name</strong></td>
                            <td style="padding:8px 0;">${esc(name)}</td></tr>
                        <tr><td style="padding:8px 0;color:#54676d;"><strong>Email</strong></td>
                            <td style="padding:8px 0;">${esc(email)}</td></tr>
                        <tr><td style="padding:8px 0;color:#54676d;"><strong>Subject</strong></td>
                            <td style="padding:8px 0;">${esc(subject || '(none)')}</td></tr>
                        <tr><td style="padding:8px 0;color:#54676d;vertical-align:top;"><strong>Message</strong></td>
                            <td style="padding:8px 0;">${esc(message)}</td></tr>
                    </table>
                    <hr style="margin-top:24px;border:none;border-top:1px solid #cfdbd7;">
                    <p style="font-family:sans-serif;font-size:12px;color:#8d9ba0;">
                        Saved to database with ID #${insertId}
                    </p>`
            });
            console.log(`✅  Email sent for contact message #${insertId}`);
        } catch (emailErr) {
            // DB save succeeded — still return 201 but flag the email failure.
            console.error("Resend email error:", emailErr.message);
            return res.status(201).json({
                success: true,
                message: "Message saved, but email could not be sent.",
                emailError: true,
                id: insertId
            });
        }
    }

    return res.status(201).json({
        success: true,
        message: "Message sent successfully",
        id: insertId
    });
});

module.exports = router;
