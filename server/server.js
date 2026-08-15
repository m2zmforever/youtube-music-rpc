const WebSocket = require("ws");
const rpc = require("./rpc");

const PORT = 5006;

const wss = new WebSocket.Server({ port: PORT });

console.log("YouTube Music RPC Server");
console.log(`Listening on ws://localhost:${PORT}`);

let lastUrl = null;
let lastPlaying = null;
let lastProgress = null;

wss.on("connection", (ws) => {
    console.log("Extension connected.");

    ws.on("message", async (message) => {
        try {
            const data = JSON.parse(message.toString());

            const isInvalid =
                !data ||
                data.type === "clear" ||
                !data.url ||
                !data.url.includes("music.youtube.com/watch");

            if (isInvalid) {
                await rpc.clearActivity();
                lastUrl = null;
                lastPlaying = null;
                lastProgress = null;
                return;
            }

            const changed =
                data.url !== lastUrl ||
                data.playing !== lastPlaying ||
                data.progress !== lastProgress;

            if (!changed) return;

            console.clear();
            console.log("YouTube Music");
            console.log("----------------------------");
            console.log("Title:   ", data.title);
            console.log("Artist:  ", data.artist);
            console.log("Playing: ", data.playing);
            console.log("Progress:", `${data.progress} / ${data.duration}`);

            await rpc.setActivity(data);

            lastUrl = data.url;
            lastPlaying = data.playing;
            lastProgress = data.progress;
        } catch (err) {
            console.error(err);
        }
    });

    ws.on("close", async () => {
        console.log("Extension disconnected.");
        await rpc.clearActivity();
    });
});
