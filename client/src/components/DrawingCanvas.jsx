import React, { useEffect, useRef, useState } from "react";

const COLORS = ["#2A2140", "#FF6B6B", "#2FD8C9", "#FFD93D", "#5B3FD9", "#FFFFFF"];

export default function DrawingCanvas({ onReady }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const [color, setColor] = useState(COLORS[0]);
  const [lineWidth, setLineWidth] = useState(5);

  useEffect(() => {
    const canvas = canvasRef.current;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const prev = canvas.toDataURL ? canvas.toDataURL() : null;
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

  function getPos(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    const point = e.touches ? e.touches[0] : e;
    return { x: point.clientX - rect.left, y: point.clientY - rect.top };
  }

  function start(e) {
    drawing.current = true;
    lastPos.current = getPos(e);
  }
  function move(e) {
    if (!drawing.current) return;
    e.preventDefault();
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
  function end() {
    drawing.current = false;
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        className="draw-canvas"
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={end}
      />
      <div className="tool-row">
        {COLORS.map((c) => (
          <div
            key={c}
            className={`color-dot ${color === c ? "active" : ""}`}
            style={{ background: c, boxShadow: c === "#FFFFFF" ? "inset 0 0 0 1px #ddd" : "none" }}
            onClick={() => setColor(c)}
          />
        ))}
        <input
          type="range"
          min="2"
          max="14"
          value={lineWidth}
          onChange={(e) => setLineWidth(Number(e.target.value))}
        />
        <button type="button" className="btn btn-ghost" onClick={clearCanvas}>
          🗑 Clear
        </button>
      </div>
    </div>
  );
}
