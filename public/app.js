// Clipz frontend
// public/app.js

"use strict";

// --------------------------------------------------
// Elements
// --------------------------------------------------

const feed = document.getElementById("feed");
const searchButton = document.getElementById("searchButton");
const loginButton = document.getElementById("loginButton");

const feedTabs = document.querySelectorAll(".feed-tab");
const bottomNavItems = document.querySelectorAll(".bottom-nav-item");

// --------------------------------------------------
// App state
// --------------------------------------------------

const state = {
    currentFeed: "for-you",
    currentPage: "home",
    loggedIn: false
};

// --------------------------------------------------
// API helper
// --------------------------------------------------

async function api(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    });

    let data;

    try {
        data = await response.json();
    } catch {
        data = null;
    }

    if (!response.ok) {
        throw new Error(
            data?.error || `Request failed (${response.status})`
        );
    }

    return data;
}

// --------------------------------------------------
// Server status
// --------------------------------------------------

async function checkServer() {
    try {
        const data = await api("/api/status");

        console.log("Clipz server:", data.message);
    } catch (error) {
        console.error("Could not connect to Clipz server:", error);
    }
}

// --------------------------------------------------
// Feed tabs
// --------------------------------------------------

feedTabs.forEach(tab => {
    tab.addEventListener("click", () => {
        const selectedFeed = tab.dataset.feed;

        state.currentFeed = selectedFeed;

        feedTabs.forEach(otherTab => {
            otherTab.classList.remove("active");
        });

        tab.classList.add("active");

        loadFeed(selectedFeed);
    });
});

// --------------------------------------------------
// Bottom navigation
// --------------------------------------------------

bottomNavItems.forEach(item => {
    item.addEventListener("click", () => {
        const page = item.dataset.page;

        state.currentPage = page;

        bottomNavItems.forEach(otherItem => {
            otherItem.classList.remove("active");
        });

        item.classList.add("active");

        handlePage(page);
    });
});

// --------------------------------------------------
// Navigation
// --------------------------------------------------

function handlePage(page) {
    switch (page) {
        case "home":
            showHome();
            break;

        case "discover":
            showDiscover();
            break;

        case "upload":
            showUpload();
            break;

        case "notifications":
            showNotifications();
            break;

        case "profile":
            showProfile();
            break;

        default:
            showHome();
            break;
    }
}

// --------------------------------------------------
// Pages
// --------------------------------------------------

function showHome() {
    loadFeed(state.currentFeed);
}

function showDiscover() {
    feed.innerHTML = `
        <article class="video-card placeholder">
            <div class="placeholder-content">
                <div class="play-icon">⌕</div>
                <h1>Discover</h1>
                <p>
                    Search and discover new Clipz here.
                </p>
            </div>
        </article>
    `;
}

function showUpload() {
    feed.innerHTML = `
        <article class="video-card placeholder">
            <div class="placeholder-content">
                <div class="play-icon">＋</div>
                <h1>Upload</h1>
                <p>
                    Video uploading will be added here.
                </p>
                <button id="uploadPlaceholderButton" type="button">
                    Choose a video
                </button>
            </div>
        </article>
    `;

    const uploadButton = document.getElementById(
        "uploadPlaceholderButton"
    );

    if (uploadButton) {
        uploadButton.addEventListener("click", () => {
            alert("Video uploading isn't connected yet.");
        });
    }
}

function showNotifications() {
    feed.innerHTML = `
        <article class="video-card placeholder">
            <div class="placeholder-content">
                <div class="play-icon">♡</div>
                <h1>Activity</h1>
                <p>
                    Likes, comments, follows, and other activity
                    will appear here.
                </p>
            </div>
        </article>
    `;
}

function showProfile() {
    feed.innerHTML = `
        <article class="video-card placeholder">
            <div class="placeholder-content">
                <div class="play-icon">●</div>
                <h1>Your Profile</h1>
                <p>
                    Profiles and account settings will be added here.
                </p>
            </div>
        </article>
    `;
}

// --------------------------------------------------
// Feed
// --------------------------------------------------

async function loadFeed(feedType = "for-you") {
    if (state.currentPage !== "home") {
        return;
    }

    feed.innerHTML = `
        <article class="video-card placeholder">
            <div class="placeholder-content">
                <div class="play-icon">▶</div>
                <h1>Loading...</h1>
                <p>
                    Getting your Clipz feed.
                </p>
            </div>
        </article>
    `;

    try {
        const data = await api(`/api/feed?type=${encodeURIComponent(feedType)}`);

        if (!data || !Array.isArray(data.videos) || data.videos.length === 0) {
            showEmptyFeed();
            return;
        }

        renderFeed(data.videos);
    } catch (error) {
        console.error("Feed error:", error);

        showEmptyFeed();
    }
}

function showEmptyFeed() {
    feed.innerHTML = `
        <article class="video-card placeholder">
            <div class="placeholder-content">
                <div class="play-icon">▶</div>
                <h1>No Clipz yet</h1>
                <p>
                    Your feed is empty. Once videos are uploaded,
                    they'll appear here.
                </p>
            </div>
        </article>
    `;
}

function renderFeed(videos) {
    feed.innerHTML = "";

    videos.forEach(video => {
        const card = createVideoCard(video);
        feed.appendChild(card);
    });
}

// --------------------------------------------------
// Video cards
// --------------------------------------------------

function createVideoCard(video) {
    const card = document.createElement("article");

    card.className = "video-card";

    card.innerHTML = `
        <video
            class="video-player"
            src="${escapeHTML(video.url || "")}"
            loop
            playsinline
            preload="metadata"
        ></video>

        <div class="video-info">
            <strong>@${escapeHTML(video.username || "unknown")}</strong>

            <p>
                ${escapeHTML(video.description || "")}
            </p>
        </div>

        <div class="video-actions">

            <button
                type="button"
                class="like-button"
                data-video-id="${escapeHTML(video.id || "")}"
            >
                ♥
            </button>

            <button
                type="button"
                class="comment-button"
                data-video-id="${escapeHTML(video.id || "")}"
            >
                💬
            </button>

            <button
                type="button"
                class="share-button"
                data-video-id="${escapeHTML(video.id || "")}"
            >
                ↗
            </button>

        </div>
    `;

    setupVideoCard(card, video);

    return card;
}

function setupVideoCard(card, video) {
    const videoElement = card.querySelector(".video-player");

    if (!videoElement) {
        return;
    }

    // Clicking a video toggles playback.
    videoElement.addEventListener("click", () => {
        if (videoElement.paused) {
            videoElement.play().catch(() => {});
        } else {
            videoElement.pause();
        }
    });

    // Automatically play when visible.
    const observer = new IntersectionObserver(
        entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    videoElement.play().catch(() => {});
                } else {
                    videoElement.pause();
                }
            });
        },
        {
            threshold: 0.75
        }
    );

    observer.observe(videoElement);

    const likeButton = card.querySelector(".like-button");

    if (likeButton) {
        likeButton.addEventListener("click", () => {
            handleLike(video.id, likeButton);
        });
    }

    const commentButton = card.querySelector(".comment-button");

    if (commentButton) {
        commentButton.addEventListener("click", () => {
            handleComments(video.id);
        });
    }

    const shareButton = card.querySelector(".share-button");

    if (shareButton) {
        shareButton.addEventListener("click", () => {
            handleShare(video);
        });
    }
}

// --------------------------------------------------
// Likes
// --------------------------------------------------

async function handleLike(videoId, button) {
    if (!videoId) {
        return;
    }

    try {
        const data = await api(`/api/videos/${videoId}/like`, {
            method: "POST"
        });

        button.classList.toggle("liked", data.liked);

    } catch (error) {
        console.error("Like error:", error);
    }
}

// --------------------------------------------------
// Comments
// --------------------------------------------------

function handleComments(videoId) {
    alert(
        `Comments for ${videoId || "this video"} will be added soon.`
    );
}

// --------------------------------------------------
// Sharing
// --------------------------------------------------

async function handleShare(video) {
    const url = `${window.location.origin}/video/${video.id}`;

    try {
        await navigator.clipboard.writeText(url);

        alert("Clipz link copied!");
    } catch {
        prompt("Copy this Clipz link:", url);
    }
}

// --------------------------------------------------
// Search
// --------------------------------------------------

searchButton.addEventListener("click", () => {
    const query = prompt("What do you want to search for?");

    if (!query || !query.trim()) {
        return;
    }

    console.log("Search:", query.trim());

    alert(
        `Search for "${query.trim()}" will be connected to the server later.`
    );
});

// --------------------------------------------------
// Login
// --------------------------------------------------

loginButton.addEventListener("click", () => {
    if (state.loggedIn) {
        showProfile();
        return;
    }

    alert("Login and account creation will be added soon.");
});

// --------------------------------------------------
// HTML escaping
// --------------------------------------------------

function escapeHTML(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

// --------------------------------------------------
// Start
// --------------------------------------------------

checkServer();
loadFeed("for-you");
