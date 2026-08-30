import React, { useState } from "react";
import { socket } from "../socket";

export default function Lobby({ room, myId }) {
  const [copied, setCopied] = useState(false);
  const isHost = room.hostId === myId;
  const n = room.players.length;
  const timerSeconds = room.settings?.timerSeconds ?? 60;

  function handleCopyInvite() {
    const url = `${window.location.origin}?code=${room.code}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleTimerChange(e) {
    const val = Number(e.target.value);
    socket.emit("update_settings", { code: room.code, settings: { timerSeconds: val } });
  }

  return (
    <div className="lobby-wrap page-fade-enter">
      <div className="lobby-side">
        <div className="room-code-box">
          <div className="label">ROOM CODE</div>
          <div className="code">{room.code}</div>
        </div>

        <button className="btn btn-ghost full" onClick={handleCopyInvite}>
          {copied ? "✅ Link Copied!" : "📋 Copy Invite Link"}
        </button>

        <div style={{ height: 16 }} />

        {/* Host Settings Panel */}
        <div className="settings-panel">
          <label className="field-label">⏱️ Step Timer</label>
          {isHost ? (
            <select className="select-input" value={timerSeconds} onChange={handleTimerChange}>
              <option value={30}>30 Seconds (Fast)</option>
              <option value={45}>45 Seconds</option>
              <option value={60}>60 Seconds (Standard)</option>
              <option value={90}>90 Seconds (Relaxed)</option>
              <option value={0}>Unlimited Time</option>
            </select>
          ) : (
            <div className="settings-value-pill">
              {timerSeconds > 0 ? `${timerSeconds} Seconds` : "Unlimited Time"}
            </div>
          )}
        </div>

        <div style={{ height: 16 }} />

        {isHost ? (
          <button
            className="btn btn-primary full"
            disabled={n < 3}
            onClick={() => socket.emit("start_game", { code: room.code })}
          >
            ▶ Start game
          </button>
        ) : (
          <div className="pill" style={{ display: "block", textAlign: "center" }}>
            Waiting for host to start…
          </div>
        )}
        {n < 3 && <div className="error-text" style={{ marginTop: 10 }}>Need at least 3 players</div>}

        <div className="mascot-note">
          <span className="pencil-emoji">✏️</span>
          <span>3–8 players, best with friends!</span>
        </div>
      </div>

      <div className="lobby-main card">
        <div className="circle-lobby">
          {room.players.map((p, i) => {
            const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
            const radius = 42;
            const x = 50 + radius * Math.cos(angle);
            const y = 50 + radius * Math.sin(angle);
            return (
              <div key={p.id} className="player-chip" style={{ left: `${x}%`, top: `${y}%` }}>
                <div className="avatar" style={{ background: p.avatarColor }}>
                  {p.nickname.slice(0, 1).toUpperCase()}
                </div>
                <div className="player-name">
                  {p.id === room.hostId && <span className="host-crown">👑 </span>}
                  {p.nickname}
                </div>
              </div>
            );
          })}
          <div className="center-info">
            <div className="big">{n} players</div>
            <div className="small">Waiting to start…</div>
          </div>
        </div>
      </div>
    </div>
  );
}
