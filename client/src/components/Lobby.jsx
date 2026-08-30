import React, { useState } from "react";
import { socket } from "../socket";

export default function Lobby({ room, myId }) {
  const [copied, setCopied] = useState(false);
  const isHost = room.hostId === myId;
  const n = room.players.length;
  const timerSeconds = room.settings?.timerSeconds ?? 60;
  const maxPlayers = room.settings?.maxPlayers ?? 8;

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

  function handleMaxPlayersChange(e) {
    const val = Number(e.target.value);
    socket.emit("update_settings", { code: room.code, settings: { maxPlayers: val } });
  }

  return (
    <div className="lobby-wrap page-fade-enter">
      <div className="lobby-side">
        <div className="room-code-box">
          <div className="label">ROOM CODE</div>
          <div className="code">{room.code}</div>
        </div>

        <button className="btn btn-ghost full" onClick={handleCopyInvite}>
          {copied ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: 4 }}>
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              Link Copied!
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: 4 }}>
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
              </svg>
              Copy Invite Link
            </>
          )}
        </button>

        <div style={{ height: 14 }} />

        {/* Host Settings Panel */}
        <div className="settings-panel">
          <label className="field-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: 4 }}>
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            Step Timer
          </label>
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

          <div style={{ height: 10 }} />

          <label className="field-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: 4 }}>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            Max Players Limit
          </label>
          {isHost ? (
            <select className="select-input" value={maxPlayers} onChange={handleMaxPlayersChange}>
              <option value={2}>2 Players (Duel)</option>
              <option value={3}>3 Players</option>
              <option value={4}>4 Players</option>
              <option value={6}>6 Players</option>
              <option value={8}>8 Players (Standard)</option>
              <option value={10}>10 Players</option>
              <option value={12}>12 Players (Large Group)</option>
            </select>
          ) : (
            <div className="settings-value-pill">
              Max {maxPlayers} Players
            </div>
          )}
        </div>

        <div style={{ height: 14 }} />

        {isHost ? (
          <button
            className="btn btn-primary full"
            disabled={n < 2}
            onClick={() => socket.emit("start_game", { code: room.code })}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ verticalAlign: "middle", marginRight: 4 }}>
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            Start game
          </button>
        ) : (
          <div className="pill" style={{ display: "block", textAlign: "center" }}>
            Waiting for host to start…
          </div>
        )}
        {n < 2 && <div className="error-text" style={{ marginTop: 10 }}>Need at least 2 players</div>}

        <div className="mascot-note">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: 4 }}>
            <path d="M12 20h9"></path>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
          </svg>
          <span>2–12 players, best with friends!</span>
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
                  {p.id === room.hostId && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#FFD93D" style={{ verticalAlign: "middle", marginRight: 2 }}>
                      <path d="M2 4l3 12h14l3-12-6 7-4-8-4 8-6-7z"></path>
                    </svg>
                  )}
                  {p.nickname}
                </div>
              </div>
            );
          })}
          <div className="center-info">
            <div className="big">{n} / {maxPlayers} players</div>
            <div className="small">{n < 2 ? "Waiting for 2nd player..." : "Ready to start!"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
