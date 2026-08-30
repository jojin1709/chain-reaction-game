import React from "react";
import { socket } from "../socket";

export default function Lobby({ room, myId }) {
  const isHost = room.hostId === myId;
  const n = room.players.length;

  return (
    <div className="lobby-wrap">
      <div className="lobby-side">
        <div className="room-code-box">
          <div className="label">ROOM CODE</div>
          <div className="code">{room.code}</div>
        </div>
        <button
          className="btn btn-ghost full"
          onClick={() => {
            navigator.clipboard?.writeText(room.code);
          }}
        >
          📋 Copy invite code
        </button>
        <div style={{ height: 12 }} />
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
            const radius = 42; // percent
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
