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
    </div>
  );
}
