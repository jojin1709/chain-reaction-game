> [!NOTE]
> **[Chain Reaction is live on Vercel!](https://chain-react.vercel.app)**

<div align="center">

# Chain Reaction 🔗

### Draw it. Guess it. Pass it on.

A telephone-style drawing & guessing party game for 3 to 8 players.  
**No accounts • No database • 100% free to host & play**

---

<a href="https://chain-react.vercel.app" target="_blank"><img src="https://img.shields.io/badge/Play_Live-Vercel-black?style=for-the-badge&logo=vercel" alt="Play Live on Vercel" height="40"/></a>
&nbsp;&nbsp;&nbsp;&nbsp;
<a href="https://chain-reaction-game-7ncz.onrender.com/health" target="_blank"><img src="https://img.shields.io/badge/Backend_Status-Render-46E3B7?style=for-the-badge&logo=render" alt="Render Backend Status" height="40"/></a>

---

</div>

> [!TIP]
> **Quick Start:** Play right now in your browser at [chain-react.vercel.app](https://chain-react.vercel.app). Open it in 3 or more browser tabs to simulate a multi-player lobby!

---

## Table of Contents

- [What is Chain Reaction?](#what-is-chain-reaction)
- [How it Works](#how-it-works)
- [Features](#features)
- [Quick Start (Local Development)](#quick-start-local-development)
- [Architecture & Tech Stack](#architecture--tech-stack)
- [Deployment Guide](#deployment-guide)
  - [Frontend (Vercel)](#frontend-vercel)
  - [Backend (Render)](#backend-render)
- [Game Rules Recap](#game-rules-recap)
- [License](#license)

---

## What is Chain Reaction?

**Chain Reaction** is an open-source, real-time multiplayer telephone game (inspired by Telestrations and Gartic Phone). 

Players alternate between writing phrases and drawing pictures. At the end of the round, everyone watches the chain unfold from the original prompt to the hilarious final guess!

### Why Play Chain Reaction?

- ⚡ **Instant Rooms**: Create or join rooms with a simple 5-character room code.
- 🔒 **Zero Footprint**: No registration, no login, and no databases — everything runs strictly in-memory.
- 📱 **Mobile & Desktop Friendly**: Draw easily on touchscreens or with a mouse.

---

## How it Works

```text
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ Player 1 Writes │  ──►  │ Player 2 Draws  │  ──►  │ Player 3 Guesses│  ──►  │  Final Reveal   │
│ "Flying Cat"    │       │ the picture     │       │ "Superhero Cat" │       │ Watch the chain │
└─────────────────┘       └─────────────────┘       └─────────────────┘       └─────────────────┘
```

1. **Step 1 — Write**: Everyone writes a secret prompt.
2. **Step 2 — Draw**: Prompts are shuffled. You draw what the previous player wrote.
3. **Step 3 — Guess**: You guess what the previous player drew.
4. **Loop**: The cycle alternates until every chain makes a full loop around all players.
5. **Reveal**: Watch the hilarious evolution of every chain together!

---

## Features

- **Real-Time Synchronized Lobby**: Powered by Socket.io WebSockets.
- **Interactive Canvas**: HTML5 Canvas with custom color palettes, brush sizes, and clear controls.
- **Dynamic Host Controls**: Host manages game initialization and chain reveal steps.
- **Privacy First**: Game state disappears the moment players leave the room.

---

## Quick Start (Local Development)

### Prerequisites

- **Node.js 18+** installed on your system.

> [!WARNING]
> You need at least **3 players** (or 3 browser tabs) to start a game round.

### 1. Start the Backend Server

```bash
cd server
npm install
npm start
```
The server will run on `http://localhost:4000`.

### 2. Start the Frontend Client

In a second terminal window:

```bash
cd client
npm install
npm run dev
```
The client will run on `http://localhost:5173`.

---

## Architecture & Tech Stack

| Layer | Technology | Description |
| --- | --- | --- |
| **Frontend** | React 18 + Vite | Fast SPA UI with responsive canvas drawing component |
| **Backend** | Node.js + Express | Lightweight server handling room lifecycle & HTTP endpoints |
| **Sockets** | Socket.io | Bi-directional real-time communication for game steps |
| **Hosting** | Vercel + Render | Decoupled client & server deployment architecture |

---

## Deployment Guide

### Frontend (Vercel)

1. Connect repo `jojin1709/chain-reaction-game` to Vercel.
2. Set Root Directory to `client`.
3. Add Environment Variable:
   - `VITE_SERVER_URL` = `https://chain-reaction-game-7ncz.onrender.com`
4. Deploy to get your live URL (e.g., `https://chain-react.vercel.app`).

### Backend (Render)

1. Create a new **Web Service** on Render connected to `jojin1709/chain-reaction-game`.
2. Root Directory: `server`
3. Build Command: `npm install`
4. Start Command: `npm start`

---

## Game Rules Recap

- **Player Limit**: 3–8 players per room.
- **Host Privileges**: Only the room creator can start the game and advance reveal slides.
- **Anonymity**: Players only see the previous step, keeping the chain secret until the final reveal!

---

<p align="center">
  <b>Built with ❤️ for game nights</b>
</p>
