const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();

const PORT = process.env.PORT || 3000;

// --------------------------------------------------
// Directories
// --------------------------------------------------

const PUBLIC_DIR = path.join(__dirname, "public");
const DATA_DIR = path.join(__dirname, "data");
const USERS_DIR = path.join(DATA_DIR, "users");
const VIDEOS_DIR = path.join(DATA_DIR, "videos");

// Create our data directories if they don't exist.
for (const directory of [DATA_DIR, USERS_DIR, VIDEOS_DIR]) {
    fs.mkdirSync(directory, { recursive: true });
}

// --------------------------------------------------
// Middleware
// --------------------------------------------------

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Serve frontend files.
app.use(express.static(PUBLIC_DIR));

// --------------------------------------------------
// Basic API
// --------------------------------------------------

app.get("/api/status", (req, res) => {
    res.json({
        success: true,
        name: "Clipz",
        message: "Clipz server is running.",
        version: "1.0.0"
    });
});

// --------------------------------------------------
// Frontend fallback
// --------------------------------------------------

// If the browser requests a normal page that doesn't
// correspond to a file, send index.html.
app.get("/{*splat}", (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

// --------------------------------------------------
// Start server
// --------------------------------------------------

app.listen(PORT, () => {
    console.log("=================================");
    console.log("          CLIPZ SERVER");
    console.log("=================================");
    console.log(`Server running on port ${PORT}`);
    console.log(`Local: http://localhost:${PORT}`);
    console.log("=================================");
});
