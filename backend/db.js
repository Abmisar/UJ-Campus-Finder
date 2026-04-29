// Database connection — UJ Campus Finder
// Uses mysql2 with a connection pool and reads credentials from .env.

const mysql = require("mysql2");
require("dotenv").config();

// Create a connection pool. A pool is better than a single connection
// because it can handle multiple requests at the same time.
const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "uj_campus_finder",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test the connection once at startup so we see a clear message in the console.
pool.getConnection((err, connection) => {
    if (err) {
        console.error("❌  Database connection failed:", err.message);
        return;
    }
    console.log(`✅  Connected to MySQL database "${process.env.DB_NAME || "uj_campus_finder"}"`);
    connection.release();
});

// Export the pool with promise support so routes can use async/await.
module.exports = pool.promise();
