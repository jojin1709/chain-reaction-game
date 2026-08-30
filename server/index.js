import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 5);

const app = express();
app.use(cors());
app.get("/", (_req, res) => res.send("Chain Reaction server is running."));
app.get("/health", (_req, res) => res.json({ ok: true }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

// In-memory rooms only — no database, no accounts.
// rooms[code] = {
//   code, hostId, phase: 'lobby'|'writing'|'chain'|'reveal',
//   players: [{id, nickname, avatarColor, connected}],
//   chains: [ [ {type:'phrase'|'drawing', author, authorName, content} ] ],
//   step, order: [playerId...], submitted: Set,
// }
const rooms = {};

const AVATAR_COLORS = ["#FF6B6B", "#4ECDC4", "#FFD93D", "#A78BFA", "#6BCB77", "#FF9F5A", "#5AC8FA", "#F783AC"];

function publicRoomState(room) {
  return {
    code: room.code,
    hostId: room.hostId,
    phase: room.phase,
    players: room.players.map((p) => ({
      id: p.id,
      nickname: p.nickname,
      avatarColor: p.avatarColor,
      connected: p.connected,
    })),
    round: room.round || 1,
    totalSteps: room.order ? room.order.length : 0,
    step: room.step || 0,
  };
}

function broadcastRoom(code) {
  const room = rooms[code];
  if (!room) return;
  io.to(code).emit("room_update", publicRoomState(room));
}

function startWritingPhase(room) {
  room.phase = "writing";
  room.step = 0;
  room.submitted = new Set();
  room.chains = room.order.map((playerId) => {
    const p = room.players.find((pl) => pl.id === playerId);
    return [{ type: "phrase", author: playerId, authorName: p ? p.nickname : "?", content: null }];
  });
  broadcastRoom(room.code);
  room.order.forEach((playerId) => {
    io.to(playerId).emit("your_turn", { isDrawStep: false, previous: null, step: 0 });
  });
}

function currentAssignmentFor(room, playerId) {
  // At step s, player p works on chain (p_index - s) mod N
  const n = room.order.length;
  const pIndex = room.order.indexOf(playerId);
  const chainIndex = ((pIndex - room.step) % n + n) % n;
  const chain = room.chains[chainIndex];
  const lastEntry = chain[chain.length - 1];
  return { chainIndex, lastEntry, isDrawStep: room.step % 2 === 1 };
}

function allSubmitted(room) {
  return room.submitted.size >= room.order.length;
}

function advanceStep(room) {
  room.step += 1;
  room.submitted = new Set();
  const totalSteps = room.order.length; // after N-1 more steps beyond initial phrase, chain complete
  if (room.step >= totalSteps) {
    room.phase = "reveal";
    room.revealIndex = 0;
    broadcastRoom(room.code);
    io.to(room.code).emit("chain_reveal", { chains: room.chains, revealIndex: 0 });
    return;
  }
  room.phase = room.step % 2 === 1 ? "drawing" : "writing";
  broadcastRoom(room.code);
  // send each player their new assignment
  room.order.forEach((playerId) => {
    const { lastEntry, isDrawStep } = currentAssignmentFor(room, playerId);
    io.to(playerId).emit("your_turn", {
      isDrawStep,
      previous: lastEntry, // either a phrase/guess text or a drawing dataURL
      step: room.step,
    });
  });
}

io.on("connection", (socket) => {
  socket.on("create_room", ({ nickname }, cb) => {
    const code = nanoid();
    const player = {
      id: socket.id,
      nickname: (nickname || "Player").slice(0, 16),
      avatarColor: AVATAR_COLORS[0],
      connected: true,
    };
    rooms[code] = {
      code,
      hostId: socket.id,
      phase: "lobby",
      players: [player],
    };
    socket.join(code);
    cb && cb({ ok: true, code });
    broadcastRoom(code);
  });

  socket.on("join_room", ({ code, nickname }, cb) => {
    code = (code || "").toUpperCase().trim();
    const room = rooms[code];
    if (!room) return cb && cb({ ok: false, error: "Room not found" });
    if (room.phase !== "lobby") return cb && cb({ ok: false, error: "Game already started" });
    if (room.players.length >= 8) return cb && cb({ ok: false, error: "Room is full (max 8)" });

    const usedColors = room.players.map((p) => p.avatarColor);
    const avatarColor = AVATAR_COLORS.find((c) => !usedColors.includes(c)) || AVATAR_COLORS[room.players.length % AVATAR_COLORS.length];

    room.players.push({
      id: socket.id,
      nickname: (nickname || "Player").slice(0, 16),
      avatarColor,
      connected: true,
    });
    socket.join(code);
    cb && cb({ ok: true, code });
    broadcastRoom(code);
  });

  socket.on("start_game", ({ code }) => {
    const room = rooms[code];
    if (!room || room.hostId !== socket.id) return;
    if (room.players.length < 3) return;
    room.order = room.players.map((p) => p.id);
    startWritingPhase(room);
  });

  socket.on("submit_step", ({ code, content }) => {
    const room = rooms[code];
    if (!room || !room.order) return;
    if (room.submitted.has(socket.id)) return;

    const { chainIndex, isDrawStep } = currentAssignmentFor(room, socket.id);
    const player = room.players.find((p) => p.id === socket.id);
    if (room.step === 0) {
      room.chains[chainIndex][0].content = content;
    } else {
      room.chains[chainIndex].push({
        type: isDrawStep ? "drawing" : "guess",
        author: socket.id,
        authorName: player ? player.nickname : "?",
        content,
      });
    }
    room.submitted.add(socket.id);
    io.to(code).emit("progress_update", { submitted: room.submitted.size, total: room.order.length });

    if (allSubmitted(room)) {
      advanceStep(room);
    }
  });

  socket.on("next_reveal", ({ code }) => {
    const room = rooms[code];
    if (!room || room.hostId !== socket.id) return;
    room.revealIndex = (room.revealIndex || 0) + 1;
    io.to(code).emit("chain_reveal", { chains: room.chains, revealIndex: room.revealIndex });
  });

  socket.on("play_again", ({ code }) => {
    const room = rooms[code];
    if (!room || room.hostId !== socket.id) return;
    room.phase = "lobby";
    room.chains = [];
    room.order = null;
    room.step = 0;
    broadcastRoom(code);
  });

  socket.on("leave_room", ({ code }) => handleLeave(socket, code));

  socket.on("disconnect", () => {
    for (const code of Object.keys(rooms)) {
      const room = rooms[code];
      if (room.players.some((p) => p.id === socket.id)) {
        handleLeave(socket, code);
      }
    }
  });

  function handleLeave(socket, code) {
    const room = rooms[code];
    if (!room) return;
    room.players = room.players.filter((p) => p.id !== socket.id);
    if (room.players.length === 0) {
      delete rooms[code];
      return;
    }
    if (room.hostId === socket.id) {
      room.hostId = room.players[0].id;
    }
    broadcastRoom(code);
  }
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Chain Reaction server listening on :${PORT}`));
