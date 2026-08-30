import React, { useEffect, useState } from "react";
import { socket } from "./socket";
import Home from "./components/Home";
import Lobby from "./components/Lobby";
import PlayScreen from "./components/PlayScreen";
import RevealScreen from "./components/RevealScreen";

export default function App() {
  const [myId, setMyId] = useState(socket.id);
  const [room, setRoom] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [progress, setProgress] = useState(null);
  const [revealData, setRevealData] = useState(null);

  useEffect(() => {
    function onConnect() {
      setMyId(socket.id);
    }
    function onRoomUpdate(data) {
      setRoom(data);
      if (data.phase === "lobby") {
        setAssignment(null);
        setProgress(null);
        setRevealData(null);
      }
    }
    function onYourTurn(data) {
      setAssignment(data);
      setProgress((prev) => ({ submitted: 0, total: (prev && prev.total) || 0 }));
    }
    function onProgress(data) {
      setProgress(data);
    }
    function onChainReveal(data) {
      setRevealData(data);
    }

    socket.on("connect", onConnect);
    socket.on("room_update", onRoomUpdate);
    socket.on("your_turn", onYourTurn);
    socket.on("progress_update", onProgress);
    socket.on("chain_reveal", onChainReveal);

    return () => {
      socket.off("connect", onConnect);
      socket.off("room_update", onRoomUpdate);
      socket.off("your_turn", onYourTurn);
      socket.off("progress_update", onProgress);
      socket.off("chain_reveal", onChainReveal);
    };
  }, []);

  function handleJoined() {
    // room_update event will populate state
  }

  let content;
  if (!room) {
    content = <Home onJoined={handleJoined} />;
  } else if (room.phase === "lobby") {
    content = <Lobby room={room} myId={myId} />;
  } else if (room.phase === "reveal" && revealData) {
    content = <RevealScreen room={room} chains={revealData.chains} revealIndex={revealData.revealIndex} myId={myId} />;
  } else {
    content = <PlayScreen room={room} assignment={assignment} progress={progress} />;
  }

  return (
    <div className="app-shell">
      <div className="chain-bg-motif" />
      {content}
      <footer className="dev-footer">
        <span>Developed by <strong>JOJIN JOHN</strong></span>
        <span style={{ opacity: 0.4 }}>•</span>
        <a
          href="https://www.linkedin.com/in/jojin-john/"
          target="_blank"
          rel="noopener noreferrer"
          className="dev-linkedin-link"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 4 }}>
            <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
          </svg>
          LinkedIn Profile ↗
        </a>
      </footer>
    </div>
  );
}
