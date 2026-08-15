let socket;
let lastPayload = "";

const SERVER_URL = "ws://localhost:3001";
const RECONNECT_DELAY = 3000;

function connect() {
    socket = new WebSocket(SERVER_URL);

    socket.onopen = () => {
        console.log("Connected to RPC server");
        sendData();
    };

    socket.onclose = () => {
        console.log("Server disconnected. Retrying...");
        setTimeout(connect, RECONNECT_DELAY);
    };

    socket.onerror = () => socket.close();
}

function getVideoElement() {
    return document.querySelector(".video-stream");
}

function getWatchId() {
    const match = document.location.href.match(/v=([^&#]{5,})/)?.[1];
    if (match) return match;

    return document
        .querySelector("a.ytp-title-link.yt-uix-sessionlink")
        ?.href.match(/v=([^&#]{5,})/)?.[1];
}

function getTrackUrl() {
    const id = getWatchId();
    return id ? `https://music.youtube.com/watch?v=${id}` : null;
}

function getMediaData() {
    const mediaSession = navigator.mediaSession;

    if (mediaSession?.metadata && ["playing", "paused"].includes(mediaSession.playbackState)) {
        return {
            playbackState: mediaSession.playbackState,
            title: mediaSession.metadata.title,
            artist: mediaSession.metadata.artist,
            album: mediaSession.metadata.album,
            artwork: mediaSession.metadata.artwork?.at(-1)?.src
        };
    }

    const videoElement = getVideoElement();
    const isPaused = videoElement?.paused ?? true;
    const isPlaying = !isPaused && videoElement && videoElement.currentTime > 0;

    if (!isPlaying && isPaused) {
        return { playbackState: "none" };
    }

    const titleElement = document.querySelector(".title.ytmusic-player-bar");
    const artistElements = document.querySelectorAll(".byline.ytmusic-player-bar a");
    const artistElement = artistElements[0];
    const albumElement = artistElements.length > 1 ? artistElements[1] : null;
    const thumbnailElement = document.querySelector("#song-image img, ytmusic-player-bar img#img");

    const complexInfo = document.querySelector(".complex-string.ytmusic-player-bar");
    const albumFromElement = albumElement?.textContent?.trim();
    const albumFromComplex = complexInfo?.querySelector("a:last-child")?.textContent?.trim();
    const album = (albumFromElement && albumFromElement.length > 0)
        ? albumFromElement
        : (albumFromComplex && albumFromComplex.length > 0)
            ? albumFromComplex
            : undefined;

    return {
        playbackState: isPaused ? "paused" : "playing",
        title: titleElement?.textContent?.trim() || undefined,
        artist: artistElement?.textContent?.trim() || undefined,
        album,
        artwork: thumbnailElement?.src || undefined
    };
}

function getCurrentAndTotalTime() {
    const timeText = document
        .querySelector("#left-controls > span")
        ?.textContent?.trim();

    if (timeText) {
        const times = timeText.split(" / ");
        if (times.length === 2 && times[0] && times[1]) {
            return [times[0].trim(), times[1].trim()];
        }
    }

    const progressBar = document.querySelector(".time-info");
    if (progressBar) {
        const currentTime = progressBar.querySelector(".time-info-current")?.textContent?.trim();
        const totalTime = progressBar.querySelector(".time-info-total")?.textContent?.trim();
        if (currentTime && totalTime) {
            return [currentTime, totalTime];
        }
    }

    return null;
}

function formatDuration(seconds) {
    if (!seconds || Number.isNaN(seconds)) return null;
    const s = Math.floor(seconds);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const pad = (n) => String(n).padStart(2, "0");
    return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

function getTrackData() {
    const media = getMediaData();

    if (!media || media.playbackState === "none") {
        return null;
    }

    const url = getTrackUrl();
    if (!url) {
        return null;
    }

    const [progress, duration] = getCurrentAndTotalTime() || [];
    const playing = media.playbackState === "playing";

    return {
        type: "track",
        title: media.title,
        artist: media.artist,
        album: media.album,
        image: media.artwork,
        url,
        progress: progress || formatDuration(getVideoElement()?.currentTime),
        duration: duration || formatDuration(getVideoElement()?.duration),
        playing
    };
}

function sendData() {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;

    const data = getTrackData();
    if (!data) {
        socket.send(JSON.stringify({ type: "clear" }));
        return;
    }

    const payload = JSON.stringify(data);
    if (payload === lastPayload) return;

    lastPayload = payload;
    socket.send(payload);
}

function attachVideoListeners() {
    const video = getVideoElement();
    if (!video || video.dataset.rpcBound) return;
    video.dataset.rpcBound = "true";
    video.addEventListener("play", sendData);
    video.addEventListener("pause", sendData);
    video.addEventListener("timeupdate", sendData);
    video.addEventListener("loadedmetadata", sendData);
}

const observer = new MutationObserver(() => {
    attachVideoListeners();
    sendData();
});
observer.observe(document.body, { childList: true, subtree: true, characterData: true });

attachVideoListeners();
connect();
