import React, { useEffect, useRef, useState } from "react";
import { socket } from "../socket";
import DrawingCanvas from "./DrawingCanvas";

export default function PlayScreen({ room, assignment, progress }) {
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const getDataUrlRef = useRef(null);

  useEffect(() => {
    setText("");
    setSubmitted(false);
  }, [assignment?.step]);

  if (!assignment) {
    return (
      <div className="card waiting-overlay" style={{ background: "rgba(255,255,255,0.08)", color: "white" }}>
        <div className="big">Get ready…</div>
      </div>
    );
  }

  const { isDrawStep, previous, step } = assignment;
  const total = progress?.total || room.players.length;

  function submit(content) {
    if (submitted) return;
    setSubmitted(true);
    socket.emit("submit_step", { code: room.code, content });
  }

  function handleTextSubmit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    submit(text.trim());
  }

  function handleDrawSubmit() {
    if (!getDataUrlRef.current) return;
    submit(getDataUrlRef.current());
  }

  return (
    <div className="card" style={{ width: "100%", maxWidth: 560 }}>
      <div className="play-header">
        <div className="pill">Round step {step + 1}</div>
        <div className="pill">
          {progress?.submitted || 0}/{total} submitted
        </div>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${((progress?.submitted || 0) / total) * 100}%` }} />
      </div>
      <div style={{ height: 18 }} />

      {submitted ? (
        <div className="waiting-overlay" style={{ color: "var(--ink)" }}>
          <div className="big">Nice! ✅</div>
          <div>Waiting for the rest of the group…</div>
        </div>
      ) : step === 0 ? (
        <form onSubmit={handleTextSubmit}>
          <label className="field-label">Write a short phrase for someone else to draw</label>
          <input
            type="text"
            value={text}
            maxLength={60}
            placeholder="e.g. A cat wearing sunglasses"
            onChange={(e) => setText(e.target.value)}
            autoFocus
          />
          <div style={{ height: 16 }} />
          <button className="btn btn-primary full">Submit phrase</button>
        </form>
      ) : isDrawStep ? (
        <>
          <div className="prev-phrase-box">{previous?.content}</div>
          <DrawingCanvas onReady={(fn) => (getDataUrlRef.current = fn)} />
          <div style={{ height: 14 }} />
          <button className="btn btn-secondary full" onClick={handleDrawSubmit}>
            Submit drawing
          </button>
        </>
      ) : (
        <form onSubmit={handleTextSubmit}>
          <div className="prev-drawing-frame">
            <img src={previous?.content} alt="drawing to guess" />
          </div>
          <label className="field-label">What is this a drawing of?</label>
          <input
            type="text"
            value={text}
            maxLength={60}
            placeholder="Take your best guess…"
            onChange={(e) => setText(e.target.value)}
            autoFocus
          />
          <div style={{ height: 16 }} />
          <button className="btn btn-primary full">Submit guess</button>
        </form>
      )}
    </div>
  );
}
