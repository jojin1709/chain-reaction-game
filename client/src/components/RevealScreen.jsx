import React from "react";
import { socket } from "../socket";

export default function RevealScreen({ room, chains, revealIndex, myId }) {
  const isHost = room.hostId === myId;
  const chain = chains[revealIndex];
  const isLast = revealIndex >= chains.length - 1;

  if (!chain) return null;

  const original = chain[0];
  const final = chain[chain.length - 1];

  return (
    <div className="card" style={{ width: "100%", maxWidth: 900 }}>
      <div className="play-header">
        <div className="pill">🔗 Chain Reveal</div>
        <div className="pill">
          Chain {revealIndex + 1} of {chains.length}
        </div>
      </div>

      <div className="reveal-strip">
        {chain.map((entry, i) => (
          <div key={i} className="reveal-card">
            <div className="tag">
              {i === 0 ? "Wrote" : entry.type === "drawing" ? "Drew" : "Guessed"} · {entry.authorName}
            </div>
            {entry.type === "drawing" ? (
              <img src={entry.content} alt="" />
            ) : (
              <div className="text-content">{entry.content}</div>
            )}
          </div>
        ))}
      </div>

      <div className="reveal-vs">
        <div className="vs-box original">
          <div className="vs-label">The original</div>
          {original.content}
        </div>
        <div className="vs-box final">
          <div className="vs-label">The final guess</div>
          {final.content}
        </div>
      </div>

      {isHost && (
        <>
          <div style={{ height: 20 }} />
          {isLast ? (
            <button className="btn btn-primary full" onClick={() => socket.emit("play_again", { code: room.code })}>
              🔁 Back to lobby
            </button>
          ) : (
            <button className="btn btn-yellow full" onClick={() => socket.emit("next_reveal", { code: room.code })}>
              Next chain →
            </button>
          )}
        </>
      )}
      {!isHost && (
        <div className="pill" style={{ display: "block", textAlign: "center", marginTop: 16 }}>
          Waiting for host to continue…
        </div>
      )}
    </div>
  );
}
