import React, { useEffect, useRef, useState } from "react";
import { socket } from "../socket";
import DrawingCanvas from "./DrawingCanvas";
import { playSubmitSound, playTickSound } from "../utils/audio";
import { getRandomStarterPrompt, sanitizeProfanity, validateText } from "../utils/profanity";

export default function PlayScreen({ room, assignment, progress }) {
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(() => assignment?.timerSeconds || 60);

  const getDataUrlRef = useRef(null);
  const timerRef = useRef(null);
  const submittedRef = useRef(false);

  const totalTimerSeconds = assignment?.timerSeconds || 60;

  function submit(content) {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitted(true);
    clearInterval(timerRef.current);
    playSubmitSound();
    socket.emit("submit_step", { code: room.code, content });
  }

  function handleAutoSubmitOnExpiry() {
    if (submittedRef.current) return;
    if (assignment?.isDrawStep && getDataUrlRef.current) {
      const dataUrl = getDataUrlRef.current();
      submit(dataUrl);
    } else {
      const fallback = text.trim() ? sanitizeProfanity(text.trim()) : "(time expired)";
      submit(fallback);
    }
  }

  // Handle timer countdown
  useEffect(() => {
    setText("");
    setSubmitted(false);
    submittedRef.current = false;
    setError("");
    getDataUrlRef.current = null;

    if (!assignment) return;

    const initialTime = assignment.timerSeconds ?? 60;
    if (initialTime <= 0) {
      setTimeLeft(0);
      return;
    }

    setTimeLeft(initialTime);
    clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmitOnExpiry();
          return 0;
        }
        if (prev <= 10) {
          playTickSound();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignment?.step, assignment?.timerSeconds]);

  if (!assignment) {
    return (
      <div className="card waiting-overlay" style={{ background: "rgba(255,255,255,0.08)", color: "white" }}>
        <div className="big">Get ready…</div>
      </div>
    );
  }

  const { isDrawStep, previous, step } = assignment;
  const total = progress?.total || room.players.length;

  function handleTextSubmit(e) {
    e.preventDefault();
    const valResult = validateText(text);
    if (!valResult.valid) {
      setError(valResult.error);
      return;
    }
    setError("");
    const clean = sanitizeProfanity(valResult.cleanText);
    submit(clean);
  }

  function handleDrawSubmit() {
    if (!getDataUrlRef.current) return;
    submit(getDataUrlRef.current());
  }

  function handleStarterPrompt() {
    const prompt = getRandomStarterPrompt();
    setText(prompt);
    setError("");
  }

  const timerPercent = totalTimerSeconds > 0 ? (timeLeft / totalTimerSeconds) * 100 : 100;
  const isTimeWarning = timeLeft <= 10 && totalTimerSeconds > 0;

  return (
    <div className="card page-fade-enter" style={{ width: "100%", maxWidth: 560 }}>
      <div className="play-header">
        <div className="pill">Round step {step + 1}</div>
        {totalTimerSeconds > 0 && (
          <div className={`pill timer-badge ${isTimeWarning ? "warning" : ""}`}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: 4 }}>
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            {timeLeft}s
          </div>
        )}
        <div className="pill">
          {progress?.submitted || 0}/{total} submitted
        </div>
      </div>

      {totalTimerSeconds > 0 && (
        <div className="progress-track">
          <div
            className={`progress-fill ${isTimeWarning ? "timer-warning" : ""}`}
            style={{ width: `${timerPercent}%` }}
          />
        </div>
      )}
      <div style={{ height: 18 }} />

      {submitted ? (
        <div className="waiting-overlay" style={{ color: "var(--ink)" }}>
          <div className="big">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: 6 }}>
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            Submitted!
          </div>
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
            onChange={(e) => {
              setText(e.target.value);
              setError("");
            }}
            autoFocus
          />

          <div className="prompt-suggestion-row">
            <button type="button" className="btn-link-prompt" onClick={handleStarterPrompt}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: 4 }}>
                <path d="M9 18h6"></path>
                <path d="M10 22h4"></path>
                <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1.55.6 2.97 1.5 4 .76.76 1.23 1.52 1.41 2.5"></path>
              </svg>
              Need an idea? Click for a starter prompt
            </button>
          </div>

          {error && <div className="error-text">{error}</div>}

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
            onChange={(e) => {
              setText(e.target.value);
              setError("");
            }}
            autoFocus
          />

          {error && <div className="error-text">{error}</div>}

          <div style={{ height: 16 }} />
          <button className="btn btn-primary full">Submit guess</button>
        </form>
      )}
    </div>
  );
}
