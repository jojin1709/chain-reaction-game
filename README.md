# Chain Reaction 🔗

Draw it. Guess it. Pass it on. A telephone-style drawing & guessing party game — 3 to 8 players, no accounts, no database. Everything free to run and host.

- One player writes a secret phrase.
- The next player draws it (they only see the phrase, not who wrote it).
- The next player guesses what the drawing shows (they only see the drawing).
- It keeps alternating draw → guess → draw → guess until it loops back around.
- At the end, everyone watches every chain unfold from original phrase to final (usually very wrong) guess.

## How it's built

- `server/` — Node.js + Socket.io. Holds all game state **in memory only** (no database, no login). Rooms disappear when everyone leaves.
- `client/` — React + Vite. Talks to the server over WebSockets.

## Run it locally

You need Node.js 18+ installed.

**1. Start the server**
```bash
cd server
npm install
npm start
```
It runs on `http://localhost:4000`.

**2. Start the client** (in a second terminal)
```bash
cd client
npm install
npm run dev
```
It runs on `http://localhost:5173` and already points at `localhost:4000` by default.

Open the client URL in a few browser tabs (or share your local IP with friends on the same WiFi) to test a full game — you need at least 3 players to start.

## Deploy to Render (100% free tier)

You'll deploy **two separate services** from the same repo: the Socket.io server as a Web Service, and the React app as a Static Site.

### Option A — one-click with the included blueprint

1. Push this project to a GitHub repo.
2. In Render, click **New → Blueprint**, connect the repo. Render will read `render.yaml` and create both services automatically.
3. Once created, open the **chain-reaction-client** static site's settings → Environment, and set:
   - `VITE_SERVER_URL` = the URL Render gave your `chain-reaction-server` (something like `https://chain-reaction-server.onrender.com`)
4. Trigger a manual redeploy of the client so it picks up the env var (static sites bake env vars in at build time).

### Option B — manual setup

**Deploy the server:**
1. New → Web Service → connect your repo.
2. Root directory: `server`
3. Build command: `npm install`
4. Start command: `npm start`
5. Plan: Free
6. Deploy, then copy the live URL (e.g. `https://chain-reaction-server.onrender.com`).

**Deploy the client:**
1. New → Static Site → connect your repo.
2. Root directory: `client`
3. Build command: `npm install && npm run build`
4. Publish directory: `dist`
5. Add environment variable `VITE_SERVER_URL` = the server URL from above.
6. Add a rewrite rule: source `/*` → destination `/index.html` (so page refreshes don't 404).
7. Deploy.

Share the client's URL with friends — they type a nickname, create or join a room with a code, and you're playing.

### A note on free tier

Render's free Web Services **sleep after 15 minutes of no traffic** and take ~30–60 seconds to wake back up. This game is lobby-based (everyone waits for players to join anyway) so it's a non-issue — just expect the first person to open the game after a while to see a short delay before the server responds.

## Game rules recap

- 3–8 players per room.
- Host starts the game once everyone's in.
- Everyone writes a phrase → passes to write/draw alternately → full reveal at the end.
- No accounts, no saved history — closing the tab or refreshing loses your spot in that room.
