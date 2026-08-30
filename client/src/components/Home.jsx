import React, { useState } from "react";
import { socket } from "../socket";

export default function Home({ onJoined }) {
  const [tab, setTab] = useState("create");
  const [nickname, setNickname] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleCreate(e) {
    e.preventDefault();
    if (!nickname.trim()) return setError("Enter a nickname first");
    setError("");
    setLoading(true);
    socket.emit("create_room", { nickname }, (res) => {
      setLoading(false);
      if (res?.ok) onJoined(res.code, nickname);
      else setError(res?.error || "Something went wrong");
    });
  }

  function handleJoin(e) {
    e.preventDefault();
    if (!nickname.trim()) return setError("Enter a nickname first");
    if (!roomCode.trim()) return setError("Enter a room code");
    setError("");
    setLoading(true);
    socket.emit("join_room", { code: roomCode, nickname }, (res) => {
      setLoading(false);
      if (res?.ok) onJoined(res.code, nickname);
      else setError(res?.error || "Could not join room");
    });
  }

  return (
    <div className="home-wrap">
      <div className="logo">
        CHAIN <span className="accent-teal">↻</span>
        <br />
        <span className="accent-coral">REACTION</span>
      </div>
      <div className="logo-sub">DRAW IT. GUESS IT. PASS IT ON.</div>

      <div style={{ height: 24 }} />

      <div className="card">
        <div className="tab-row">
          <button className={`tab-btn ${tab === "create" ? "active" : ""}`} onClick={() => setTab("create")}>
            Start a room
          </button>
          <button className={`tab-btn ${tab === "join" ? "active" : ""}`} onClick={() => setTab("join")}>
            Join a room
          </button>
        </div>

        <form onSubmit={tab === "create" ? handleCreate : handleJoin}>
          <label className="field-label">Your nickname</label>
          <input
            type="text"
            placeholder="e.g. Maya"
            value={nickname}
            maxLength={16}
            onChange={(e) => setNickname(e.target.value)}
          />

          {tab === "join" && (
            <>
              <div style={{ height: 14 }} />
              <label className="field-label">Room code</label>
              <input
                type="text"
                placeholder="e.g. X7QK9"
                value={roomCode}
                maxLength={6}
                style={{ textTransform: "uppercase", letterSpacing: 2 }}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              />
            </>
          )}

          {error && <div className="error-text">{error}</div>}

          <div style={{ height: 20 }} />
          <button className="btn btn-primary full" disabled={loading}>
            {loading ? "One sec..." : tab === "create" ? "Create room" : "Join room"}
          </button>
        </form>
      </div>

      <div className="footer-features">
        <div className="feature-pill">
          <b>😂 Endless laughs</b>
          Watch your phrase mutate in the funniest ways.
        </div>
        <div className="feature-pill">
          <b>✏️ Draw & guess</b>
          No skills? No problem. Just doodle and guess.
        </div>
        <div className="feature-pill">
          <b>🔗 Pass it on</b>
          One phrase, many minds, one hilarious chain.
        </div>
      </div>
    </div>
  );
}
