const RPC = require("@xhayper/discord-rpc");

const CLIENT_ID = "1534665939100893397";

const client = new RPC.Client({ clientId: CLIENT_ID });

let connected = false;
let lastUrl = null;

client.on("ready", () => {
    connected = true;
    console.log("Discord RPC connected");
});

client.on("disconnected", () => {
    connected = false;
    console.log("Discord RPC disconnected");
});

client.login();

function parseTime(time) {
    if (!time) return 0;

    const parts = time.split(":").map(Number);

    if (parts.length === 2) {
        return parts[0] * 60 + parts[1];
    }

    if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }

    return 0;
}

async function setActivity(data) {
    if (!connected) return;

    if (lastUrl !== data.url) {
        await client.user.clearActivity();
        lastUrl = data.url;
    }

    const elapsed = parseTime(data.progress);
    const total = parseTime(data.duration);
    const start = Date.now() - elapsed * 1000;
    const end = start + total * 1000;

    await client.user.setActivity({
        type: 2,
        details: data.title,
        state: data.artist,
        largeImageKey: data.image || "youtube_music",
        startTimestamp: data.playing ? new Date(start) : undefined,
        endTimestamp: data.playing ? new Date(end) : undefined,
        buttons: [{ label: "Open on YouTube Music", url: data.url }],
        instance: false
    });
}

async function clearActivity() {
    if (!connected) return;

    await client.user.clearActivity();
    lastUrl = null;
}

module.exports = { setActivity, clearActivity };
