import React, { useEffect, useState } from "react";
import { socket } from "../socket";

function getSessionToken() {
  let token = sessionStorage.getItem("chain_reaction_session_token");
  if (!token) {
    token = "st_" + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    sessionStorage.setItem("chain_reaction_session_token", token);
  }
  return token;
}

export default function Home({ onJoined }) {
  const [tab, setTab] = useState("create");
  const [nickname, setNickname] = useState(() => sessionStorage.getItem("chain_reaction_nickname") || "");
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check URL parameters for ?code=XXXXX invite link
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get("code");
    if (codeParam) {
      setRoomCode(codeParam.toUpperCase());
      setTab("join");
    }
  }, []);

  function handleCreate(e) {
    e.preventDefault();
    if (!nickname.trim()) return setError("Enter a nickname first");
    setError("");
    setLoading(true);
    const sessionToken = getSessionToken();
    sessionStorage.setItem("chain_reaction_nickname", nickname.trim());

    socket.emit("create_room", { nickname: nickname.trim(), sessionToken }, (res) => {
      setLoading(false);
      if (res?.ok) onJoined(res.code, nickname.trim());
      else setError(res?.error || "Something went wrong");
    });
  }

  function handleJoin(e) {
    e.preventDefault();
    if (!nickname.trim()) return setError("Enter a nickname first");
    if (!roomCode.trim()) return setError("Enter a room code");
    setError("");
    setLoading(true);
    const sessionToken = getSessionToken();
    sessionStorage.setItem("chain_reaction_nickname", nickname.trim());

    socket.emit("join_room", { code: roomCode.trim(), nickname: nickname.trim(), sessionToken }, (res) => {
      setLoading(false);
      if (res?.ok) onJoined(res.code, nickname.trim());
      else setError(res?.error || "Could not join room");
    });
  }

  return (
    <div className="home-wrap page-fade-enter">
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
            onChange={(e) => {
              setNickname(e.target.value);
              setError("");
            }}
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
                onChange={(e) => {
                  setRoomCode(e.target.value.toUpperCase());
                  setError("");
                }}
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
          <b>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: 6 }}>
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
              <line x1="9" y1="9" x2="9.01" y2="9"></line>
              <line x1="15" y1="9" x2="15.01" y2="9"></line>
            </svg>
            Endless laughs
          </b>
          Watch your phrase mutate in the funniest ways.
        </div>
        <div className="feature-pill">
          <b>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: 6 }}>
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
            Draw & guess
          </b>
          No skills? No problem. Just doodle and guess.
        </div>
        <div className="feature-pill">
          <b>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: 6 }}>
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
            Pass it on
          </b>
          One phrase, many minds, one hilarious chain.
        </div>
      </div>

      <div className="developer-card">
        <div className="dev-info">
          <img
            src="https://github.com/jojin1709.png"
            alt="JOJIN JOHN"
            className="dev-avatar-img"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/developer.png";
            }}
          />
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
