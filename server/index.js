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

// Minimal 1x1 transparent white PNG data URL for empty drawings
const BLANK_CANVAS_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

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
    settings: room.settings || { timerSeconds: 60 },
    stepSeconds: room.settings?.timerSeconds || 60,
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

function clearRoomTimer(room) {
  if (room.timerId) {
    clearTimeout(room.timerId);
    room.timerId = null;
  }
}

function startStepTimer(room) {
  clearRoomTimer(room);
  const timerSeconds = room.settings?.timerSeconds ?? 60;
  if (timerSeconds <= 0) return; // Unlimited time

  room.stepStartTime = Date.now();
  room.timerId = setTimeout(() => {
    autoSubmitMissingPlayers(room);
  }, timerSeconds * 1000);
}

function currentAssignmentFor(room, playerId) {
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

function autoSubmitMissingPlayers(room) {
  if (!room || !room.order) return;

  room.order.forEach((playerId) => {
    if (!room.submitted.has(playerId)) {
      const { chainIndex, isDrawStep } = currentAssignmentFor(room, playerId);
      const player = room.players.find((p) => p.id === playerId);
      
      let placeholder = "";
      if (room.step === 0) {
        placeholder = "(no phrase entered)";
        room.chains[chainIndex][0].content = placeholder;
      } else {
        placeholder = isDrawStep ? BLANK_CANVAS_DATA_URL : "(no guess entered)";
        room.chains[chainIndex].push({
          type: isDrawStep ? "drawing" : "guess",
          author: playerId,
          authorName: player ? player.nickname : "?",
          content: placeholder,
        });
      }
      room.submitted.add(playerId);
    }
  });

  io.to(room.code).emit("progress_update", { submitted: room.submitted.size, total: room.order.length });
  advanceStep(room);
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
  const timerSeconds = room.settings?.timerSeconds ?? 60;

  room.order.forEach((playerId) => {
    io.to(playerId).emit("your_turn", {
      isDrawStep: false,
      previous: null,
      step: 0,
      timerSeconds,
    });
  });

  startStepTimer(room);
}

function advanceStep(room) {
  clearRoomTimer(room);
  room.step += 1;
  room.submitted = new Set();
  // For 2 players, set 3 total steps (Write -> Draw -> Guess) so it ends on a guess
  const totalSteps = room.order.length === 2 ? 3 : room.order.length;

  if (room.step >= totalSteps) {
    room.phase = "reveal";
    room.revealIndex = 0;
    broadcastRoom(room.code);
    io.to(room.code).emit("chain_reveal", { chains: room.chains, revealIndex: 0 });
    return;
  }

  room.phase = room.step % 2 === 1 ? "drawing" : "writing";
  broadcastRoom(room.code);
  const timerSeconds = room.settings?.timerSeconds ?? 60;

  room.order.forEach((playerId) => {
    const { lastEntry, isDrawStep } = currentAssignmentFor(room, playerId);
    io.to(playerId).emit("your_turn", {
      isDrawStep,
      previous: lastEntry,
      step: room.step,
      timerSeconds,
    });
  });

  startStepTimer(room);
}

io.on("connection", (socket) => {
  socket.on("create_room", ({ nickname, sessionToken }, cb) => {
    const code = nanoid();
    const token = sessionToken || nanoid() + nanoid();
    const player = {
      id: socket.id,
      sessionToken: token,
      nickname: (nickname || "Player").slice(0, 16),
      avatarColor: AVATAR_COLORS[0],
      connected: true,
    };
    rooms[code] = {
      code,
      hostId: socket.id,
      phase: "lobby",
      players: [player],
      settings: { timerSeconds: 60 },
    };
    socket.join(code);
    cb && cb({ ok: true, code, sessionToken: token });
    broadcastRoom(code);
  });

  socket.on("join_room", ({ code, nickname, sessionToken }, cb) => {
    code = (code || "").toUpperCase().trim();
    const room = rooms[code];
    if (!room) return cb && cb({ ok: false, error: "Room not found" });

    // Handle re-joining an existing room slot by sessionToken or nickname match
    const existingPlayer = room.players.find(
      (p) => (sessionToken && p.sessionToken === sessionToken) || (p.nickname.toLowerCase() === (nickname || "").toLowerCase().trim() && !p.connected)
    );

    if (existingPlayer) {
      const oldId = existingPlayer.id;
      existingPlayer.id = socket.id;
      existingPlayer.connected = true;
      if (sessionToken) existingPlayer.sessionToken = sessionToken;

      if (room.hostId === oldId) room.hostId = socket.id;

      if (room.order) {
        const orderIdx = room.order.indexOf(oldId);
        if (orderIdx !== -1) room.order[orderIdx] = socket.id;
      }

      socket.join(code);
      cb && cb({ ok: true, code, sessionToken: existingPlayer.sessionToken });
      broadcastRoom(code);

      // If game is active, resend current turn assignment
      if (room.phase !== "lobby" && room.order) {
        const { lastEntry, isDrawStep } = currentAssignmentFor(room, socket.id);
        const elapsed = room.stepStartTime ? Math.floor((Date.now() - room.stepStartTime) / 1000) : 0;
        const totalTimer = room.settings?.timerSeconds ?? 60;
        const remainingTimer = Math.max(1, totalTimer - elapsed);

        socket.emit("your_turn", {
          isDrawStep,
          previous: room.step === 0 ? null : lastEntry,
          step: room.step,
          timerSeconds: remainingTimer,
        });

        if (room.submitted.has(oldId)) {
          room.submitted.delete(oldId);
          room.submitted.add(socket.id);
        }
      }
      return;
    }

    const maxP = room.settings?.maxPlayers || 8;
    if (room.players.length >= maxP) return cb && cb({ ok: false, error: `Room is full (max ${maxP})` });

    const token = sessionToken || nanoid() + nanoid();
    const usedColors = room.players.map((p) => p.avatarColor);
    const avatarColor = AVATAR_COLORS.find((c) => !usedColors.includes(c)) || AVATAR_COLORS[room.players.length % AVATAR_COLORS.length];

    room.players.push({
      id: socket.id,
      sessionToken: token,
      nickname: (nickname || "Player").slice(0, 16),
      avatarColor,
      connected: true,
    });
    socket.join(code);
    cb && cb({ ok: true, code, sessionToken: token });
    broadcastRoom(code);
  });

  socket.on("update_settings", ({ code, settings }) => {
    const room = rooms[code];
    if (!room || room.hostId !== socket.id || room.phase !== "lobby") return;
    room.settings = { ...room.settings, ...settings };
    broadcastRoom(code);
  });

  socket.on("start_game", ({ code }) => {
    const room = rooms[code];
    if (!room || room.hostId !== socket.id) return;
    if (room.players.length < 2) return;
    room.order = room.players.map((p) => p.id);
    startWritingPhase(room);
  });

  socket.on("submit_step", ({ code, content }) => {
    const room = rooms[code];
    if (!room || !room.order) return;
    if (room.submitted.has(socket.id)) return;

    const { chainIndex, isDrawStep } = currentAssignmentFor(room, socket.id);
    const player = room.players.find((p) => p.id === socket.id);
    const cleanContent = content || (isDrawStep ? BLANK_CANVAS_DATA_URL : "(no answer)");
    const isImageContent = typeof cleanContent === "string" && cleanContent.startsWith("data:image");
    const entryType = isImageContent ? "drawing" : isDrawStep ? "drawing" : "guess";

    if (room.step === 0) {
      room.chains[chainIndex][0].content = cleanContent;
    } else {
      room.chains[chainIndex].push({
        type: entryType,
        author: socket.id,
        authorName: player ? player.nickname : "?",
        content: cleanContent,
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
    const maxIdx = (room.chains ? room.chains.length : 1) - 1;
    room.revealIndex = Math.min(maxIdx, (room.revealIndex || 0) + 1);
    broadcastRoom(code);
    io.to(code).emit("chain_reveal", { chains: room.chains, revealIndex: room.revealIndex });
  });

  socket.on("play_again", ({ code }) => {
    const room = rooms[code];
    if (!room || room.hostId !== socket.id) return;
    clearRoomTimer(room);
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
      const player = room.players.find((p) => p.id === socket.id);
      if (player) {
        player.connected = false;
        
        // If room is in active game, auto-submit placeholder for disconnected player so game isn't stuck
        if (room.phase !== "lobby" && room.phase !== "reveal" && room.order && !room.submitted.has(socket.id)) {
          const { chainIndex, isDrawStep } = currentAssignmentFor(room, socket.id);
          const placeholder = isDrawStep ? BLANK_CANVAS_DATA_URL : "(player disconnected)";
          if (room.step === 0) {
            room.chains[chainIndex][0].content = "(player disconnected)";
          } else {
            room.chains[chainIndex].push({
              type: isDrawStep ? "drawing" : "guess",
              author: socket.id,
              authorName: player.nickname,
              content: placeholder,
            });
          }
          room.submitted.add(socket.id);
          io.to(code).emit("progress_update", { submitted: room.submitted.size, total: room.order.length });
          if (allSubmitted(room)) {
            advanceStep(room);
          }
        }

        // Clean room if all players disconnected
        const anyConnected = room.players.some((p) => p.connected);
        if (!anyConnected) {
          clearRoomTimer(room);
          delete rooms[code];
        } else {
          if (room.hostId === socket.id) {
            const nextHost = room.players.find((p) => p.connected) || room.players[0];
            if (nextHost) room.hostId = nextHost.id;
          }
          broadcastRoom(code);
        }
      }
    }
  });

  function handleLeave(socket, code) {
    const room = rooms[code];
    if (!room) return;
    room.players = room.players.filter((p) => p.id !== socket.id);
    if (room.players.length === 0) {
      clearRoomTimer(room);
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
