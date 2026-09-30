const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const app = express();

const PORT = process.env.PORT || 3000;

// =================================
// DIRECTORIES
// =================================

const PUBLIC_DIR = path.join(__dirname, "public");

const DATA_DIR = path.join(__dirname, "data");
const USERS_DIR = path.join(DATA_DIR, "users");
const VIDEOS_DIR = path.join(DATA_DIR, "videos");

const UPLOADS_DIR = path.join(__dirname, "uploads");
const VIDEO_UPLOADS_DIR = path.join(UPLOADS_DIR, "videos");

for (const directory of [
    DATA_DIR,
    USERS_DIR,
    VIDEOS_DIR,
    UPLOADS_DIR,
    VIDEO_UPLOADS_DIR
]) {
    fs.mkdirSync(directory, {
        recursive: true
    });
}

// =================================
// MIDDLEWARE
// =================================

app.use(express.json({
    limit: "10mb"
}));

app.use(express.urlencoded({
    extended: true
}));

app.use(express.static(PUBLIC_DIR));

app.use(
    "/uploads",
    express.static(UPLOADS_DIR)
);

// =================================
// MULTER
// =================================

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, VIDEO_UPLOADS_DIR);
    },

    filename: (req, file, cb) => {
        const extension = path.extname(
            file.originalname
        );

        const uniqueName =
            `${Date.now()}-${Math.random()
                .toString(36)
                .slice(2)}${extension}`;

        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,

    limits: {
        fileSize: 250 * 1024 * 1024
    },

    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith("video/")) {
            return cb(
                new Error(
                    "Only video files are allowed."
                )
            );
        }

        cb(null, true);
    }
});

// =================================
// API STATUS
// =================================

app.get("/api/status", (req, res) => {
    res.json({
        success: true,
        name: "Clipz",
        message: "Clipz server is running.",
        version: "1.0.0"
    });
});

// =================================
// UPLOAD ROUTE DIAGNOSTIC
// =================================

app.get("/api/videos/upload", (req, res) => {
    res.json({
        success: true,
        uploadRoute: true,
        message: "Clipz upload endpoint is deployed."
    });
});

// =================================
// FEED
// =================================

app.get("/api/feed", (req, res) => {
    try {
        const files = fs.readdirSync(
            VIDEOS_DIR
        );

        const videos = [];

        for (const file of files) {
            if (!file.endsWith(".json")) {
                continue;
            }

            try {
                const filePath = path.join(
                    VIDEOS_DIR,
                    file
                );

                const video = JSON.parse(
                    fs.readFileSync(
                        filePath,
                        "utf8"
                    )
                );

                videos.push(video);
            } catch (error) {
                console.error(
                    `Could not read video metadata: ${file}`,
                    error
                );
            }
        }

        videos.sort((a, b) => {
            return (
                new Date(b.createdAt) -
                new Date(a.createdAt)
            );
        });

        res.json({
            success: true,
            videos
        });

    } catch (error) {
        console.error(
            "Feed error:",
            error
        );

        res.status(500).json({
            success: false,
            error: "Could not load feed."
        });
    }
});

// =================================
// UPLOAD VIDEO
// =================================

app.post(
    "/api/videos/upload",

    // Diagnostic middleware
    (req, res, next) => {
        console.log(
            "================================="
        );

        console.log(
            "CLIPZ UPLOAD REQUEST RECEIVED"
        );

        console.log(
            "Method:",
            req.method
        );

        console.log(
            "Path:",
            req.path
        );

        console.log(
            "Content-Type:",
            req.headers["content-type"]
        );

        console.log(
            "================================="
        );

        next();
    },

    // Process uploaded file
    upload.single("video"),

    // Handle upload
    (req, res) => {
        console.log(
            "MULTER FINISHED"
        );

        if (!req.file) {
            console.log(
                "NO FILE RECEIVED"
            );

            return res.status(400).json({
                success: false,
                error: "No video was uploaded."
            });
        }

        console.log(
            "VIDEO RECEIVED:",
            req.file.originalname
        );

        const videoId =
            `${Date.now()}-${Math.random()
                .toString(36)
                .slice(2)}`;

        const description =
            typeof req.body.description === "string"
                ? req.body.description
                : "";

        const username =
            typeof req.body.username === "string"
                ? req.body.username
                : "anonymous";

        const video = {
            id: videoId,

            username,

            description,

            url:
                `/uploads/videos/${req.file.filename}`,

            filename:
                req.file.filename,

            originalName:
                req.file.originalname,

            size:
                req.file.size,

            createdAt:
                new Date().toISOString(),

            likes: 0,

            comments: 0
        };

        const metadataPath =
            path.join(
                VIDEOS_DIR,
                `${videoId}.json`
            );

        fs.writeFileSync(
            metadataPath,
            JSON.stringify(
                video,
                null,
                2
            )
        );

        console.log(
            "VIDEO SAVED:",
            videoId
        );

        res.json({
            success: true,
            video
        });
    }
);

// =================================
// UPLOAD ERROR HANDLER
// =================================

app.use(
    (error, req, res, next) => {

        if (error instanceof multer.MulterError) {
            console.error(
                "MULTER ERROR:",
                error
            );

            return res.status(400).json({
                success: false,
                error: error.message
            });
        }

        if (error) {
            console.error(
                "SERVER ERROR:",
                error
            );

            return res.status(400).json({
                success: false,
                error: error.message
            });
        }

        next();
    }
);

// =================================
// FRONTEND FALLBACK
// =================================

app.get(
    "/{*splat}",
    (req, res) => {
        res.sendFile(
            path.join(
                PUBLIC_DIR,
                "index.html"
            )
        );
    }
);

// =================================
// START SERVER
// =================================

app.listen(
    PORT,
    () => {

        console.log(
            "================================="
        );

        console.log(
            "          CLIPZ SERVER"
        );

        console.log(
            "================================="
        );

        console.log(
            `Server running on port ${PORT}`
        );

        console.log(
            `Local: http://localhost:${PORT}`
        );

        console.log(
            "Upload endpoint: POST /api/videos/upload"
        );

        console.log(
            "================================="
        );
    }
);
