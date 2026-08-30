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

      <div className="developer-card">
        <div className="dev-info">
          <div className="dev-avatar">JJ</div>
          <div>
            <div className="dev-title">Developer</div>
            <div className="dev-name">JOJIN JOHN</div>
          </div>
        </div>
        <a
          href="https://www.linkedin.com/in/jojin-john/"
          target="_blank"
          rel="noopener noreferrer"
          className="dev-linkedin-btn"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
          </svg>
          LinkedIn
        </a>
      </div>
    </div>
  );
}
