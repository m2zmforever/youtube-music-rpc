# YouTube Music RPC

Shows the YouTube Music track you're currently listening to as a Discord Rich Presence.

## Requirements

- [Node.js](https://nodejs.org/) 16 or newer
- Discord desktop app (running and logged in)
- A Chromium-based browser (Chrome, Edge, Brave, etc.)
- YouTube Music Web Player: <https://music.youtube.com>

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/m2zmforever/youtube-music-rpc.git
cd youtube-music-rpc
```

### 2. Run the server

```bash
cd server
npm install
npm start
```

### 3. Load the browser extension

1. Open your browser's extensions page:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
   - Opera: `opera://extensions`
2. Enable **Developer mode**.
3. Click **Load unpacked** and select the `extension/` folder.
4. Open (or refresh) <https://music.youtube.com> and start playing a song.

Your Discord status should now show the song you're listening to.

## Configuration

### Server port

The default port is `5006`. If you change it, update **both**:

- `server/server.js` — `const PORT = 5006;`
- `extension/content.js` — `const SERVER_URL = "ws://localhost:5006";`

