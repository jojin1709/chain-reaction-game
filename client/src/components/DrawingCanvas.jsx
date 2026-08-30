import React, { useEffect, useRef, useState } from "react";

const COLORS = ["#2A2140", "#FF6B6B", "#2FD8C9", "#FFD93D", "#5B3FD9", "#FFFFFF"];

export default function DrawingCanvas({ onReady }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const historyStack = useRef([]);

  const [color, setColor] = useState(COLORS[0]);
  const [lineWidth, setLineWidth] = useState(6);
  const [canUndo, setCanUndo] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * 2;
      canvas.height = rect.height * 2;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(2, 2);
    };
    resize();
    window.addEventListener("resize", resize);
    onReady && onReady(() => canvas.toDataURL("image/png"));
    return () => window.removeEventListener("resize", resize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function saveSnapshot() {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    historyStack.current.push(snapshot);
    if (historyStack.current.length > 20) historyStack.current.shift();
    setCanUndo(true);
  }

  function undo() {
    if (historyStack.current.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const previousState = historyStack.current.pop();
    ctx.putImageData(previousState, 0, 0);
    setCanUndo(historyStack.current.length > 0);
  }

  function getPos(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    const point = e.touches ? e.touches[0] : e;
    return { x: point.clientX - rect.left, y: point.clientY - rect.top };
  }

  function start(e) {
    if (e.touches && e.cancelable) e.preventDefault();
    saveSnapshot();
    drawing.current = true;
    lastPos.current = getPos(e);
  }

  function move(e) {
    if (!drawing.current) return;
    if (e.touches && e.cancelable) e.preventDefault();
    const ctx = canvasRef.current.getContext("2d");
    const pos = getPos(e);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
  }

  function end(e) {
    if (e && e.touches && e.cancelable) e.preventDefault();
    drawing.current = false;
  }

  function clearCanvas() {
    saveSnapshot();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  return (
    <div className="canvas-wrapper">
      <canvas
        ref={canvasRef}
        className="draw-canvas"
        style={{ touchAction: "none" }}
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={end}
      />
      <div className="tool-row">
        <div className="color-palette" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {COLORS.map((c) => (
            <div
              key={c}
              className={`color-dot ${color === c ? "active" : ""}`}
              style={{ background: c, boxShadow: c === "#FFFFFF" ? "inset 0 0 0 1px #ccc" : "none" }}
              onClick={() => setColor(c)}
              title={c === "#FFFFFF" ? "Eraser" : "Color"}
            />
          ))}
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            title="Custom color picker"
            style={{
              width: 28,
              height: 28,
              padding: 0,
              border: "none",
              borderRadius: "50%",
              cursor: "pointer",
              background: "transparent",
            }}
          />
        </div>
        <input
          type="range"
          min="3"
          max="20"
          value={lineWidth}
          onChange={(e) => setLineWidth(Number(e.target.value))}
          className="size-slider"
        />
        <div className="canvas-btn-group">
          <button type="button" className="btn btn-ghost" onClick={undo} disabled={!canUndo}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: 4 }}>
              <polyline points="1 4 1 10 7 10"></polyline>
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
            </svg>
            Undo
          </button>
          <button type="button" className="btn btn-ghost" onClick={clearCanvas}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: 4 }}>
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
