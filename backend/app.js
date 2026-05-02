// Express application — imported by server.js (to start) and by tests (without listening).

const express = require("express");
const path    = require("path");
const cors    = require("cors");
require("dotenv").config();

const app  = express();
const ROOT = path.join(__dirname, "..");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

// Static assets — only safe public folders are exposed
app.use(express.static(path.join(ROOT, "html")));
app.use("/html",  express.static(path.join(ROOT, "html")));
app.use("/css",   express.static(path.join(ROOT, "css")));
app.use("/js",    express.static(path.join(ROOT, "js")));
app.use("/media", express.static(path.join(ROOT, "media")));

// Home page served at both / and /index.html
const indexFile = path.join(ROOT, "index.html");
app.get("/",          (_req, res) => res.sendFile(indexFile));
app.get("/index.html", (_req, res) => res.sendFile(indexFile));

// API routes
app.use("/api/reports", require("./routes/reports"));
app.use("/api/contact", require("./routes/contact"));
app.use("/api/claims",  require("./routes/claims"));

// Health check
app.get("/api/test", (_req, res) =>
    res.json({ success: true, message: "API is working" })
);

module.exports = app;
