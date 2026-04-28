const express = require("express");
const path = require("path");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const ROOT = path.join(__dirname, ".."); // project root (one level above backend/)

// ─── 1) Middleware ─────────────────────────────────────────────────────────────
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

// ─── 2) Static directories (only safe public folders are exposed) ──────────────
//  /html/reports.html  → html/
//  /css/style.css      → css/
//  /js/main.js         → js/
//  /media/logo.png     → media/
// HTML pages — served at BOTH /reports.html AND /html/reports.html
app.use(express.static(path.join(ROOT, "html")));
app.use("/html", express.static(path.join(ROOT, "html")));
app.use("/css",  express.static(path.join(ROOT, "css")));
app.use("/js",   express.static(path.join(ROOT, "js")));
app.use("/media", express.static(path.join(ROOT, "media")));

// ─── 3) Home page — served at both / and /index.html ──────────────────────────
const indexFile = path.join(ROOT, "index.html");
app.get("/", (req, res) => res.sendFile(indexFile));
app.get("/index.html", (req, res) => res.sendFile(indexFile));

// ─── 4) API routes ─────────────────────────────────────────────────────────────
const reportsRouter = require("./routes/reports");
const contactRouter = require("./routes/contact");
const claimsRouter = require("./routes/claims");

app.use("/api/reports", reportsRouter);
app.use("/api/contact", contactRouter);
app.use("/api/claims", claimsRouter);

// ─── 5) Test route ─────────────────────────────────────────────────────────────
app.get("/api/test", (req, res) => {
    res.json({ message: "Server is running successfully" });
});

// ─── 6) Start server ───────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
