import React, { useEffect, useState } from "react";
import { socket } from "../socket";
import { playRevealSound } from "../utils/audio";

export default function RevealScreen({ room, chains, revealIndex, myId }) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const isHost = room.hostId === myId;
  const chain = chains[revealIndex];
  const isLast = revealIndex >= chains.length - 1;

  useEffect(() => {
    playRevealSound();
  }, [revealIndex]);

  if (!chain) return null;

  const original = chain[0];
  const final = chain[chain.length - 1];

  function handleCopyChainSummary() {
    let summary = `Chain Reaction Game (Room: ${room.code})\n\n`;
    chain.forEach((entry, i) => {
      const typeLabel = i === 0 ? "Started" : entry.type === "drawing" ? "Drew picture" : "Guessed";
      summary += `${i + 1}. ${entry.authorName} (${typeLabel}): ${entry.type === "drawing" ? "[Drawing]" : entry.content}\n`;
    });
    summary += `\nResult: "${original.content}" -> "${final.content}"`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(summary);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDownloadCollage() {
    setDownloading(true);
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const cardWidth = 600;
      const stepHeight = 220;
      const headerHeight = 140;
      const footerHeight = 100;

      canvas.width = cardWidth;
      canvas.height = headerHeight + chain.length * stepHeight + footerHeight;

      // Fill background
      ctx.fillStyle = "#FFF8ED";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Title Header
      ctx.fillStyle = "#4B2E96";
      ctx.font = "bold 32px 'Nunito', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("CHAIN REACTION 🔗", cardWidth / 2, 50);

      ctx.fillStyle = "#554A70";
      ctx.font = "600 16px 'Nunito', sans-serif";
      ctx.fillText(`Room: ${room.code} • Chain ${revealIndex + 1} of ${chains.length}`, cardWidth / 2, 85);

      // Load all drawing images first
      const imagePromises = chain.map((entry) => {
        if (entry.type === "drawing" && entry.content) {
          return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
            img.src = entry.content;
          });
        }
        return Promise.resolve(null);
      });

      const loadedImages = await Promise.all(imagePromises);

      // Draw Each Step
      let currentY = headerHeight;
      chain.forEach((entry, i) => {
        ctx.fillStyle = "#EFE8FF";
        ctx.fillRect(40, currentY, cardWidth - 80, stepHeight - 20);

        ctx.fillStyle = "#7B5CFA";
        ctx.font = "bold 14px 'Nunito', sans-serif";
        ctx.textAlign = "left";
        const label = i === 0 ? "WROTE" : entry.type === "drawing" ? "DREW" : "GUESSED";
        ctx.fillText(`STEP ${i + 1} • ${label} BY ${entry.authorName.toUpperCase()}`, 60, currentY + 30);

        if (entry.type === "drawing" && loadedImages[i]) {
          ctx.drawImage(loadedImages[i], 60, currentY + 45, cardWidth - 120, 135);
        } else {
          ctx.fillStyle = "#2A2140";
          ctx.font = "bold 22px 'Nunito', sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(`"${entry.content}"`, cardWidth / 2, currentY + 110);
        }

        currentY += stepHeight;
      });

      // Footer
      ctx.fillStyle = "#4B2E96";
      ctx.font = "bold 16px 'Nunito', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`Developed by JOJIN JOHN • chain-react.vercel.app`, cardWidth / 2, currentY + 50);

      // Trigger Download
      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `chain-reaction-${room.code}-chain-${revealIndex + 1}.png`;
      a.click();
    } catch (err) {
      console.error("Failed to generate collage", err);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="card page-fade-enter" style={{ width: "100%", maxWidth: 900 }}>
      <div className="play-header">
        <div className="pill">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: 4 }}>
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
          </svg>
          Chain Reveal
        </div>
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
              <img src={entry.content} alt="chain step drawing" />
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

      <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button className="btn btn-ghost" style={{ flex: 1 }} onClick={handleCopyChainSummary}>
          {copied ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: 4 }}>
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              Summary Copied!
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: 4 }}>
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
              </svg>
              Copy Summary
            </>
          )}
        </button>

        <button className="btn btn-ghost" style={{ flex: 1 }} onClick={handleDownloadCollage} disabled={downloading}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: 4 }}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          {downloading ? "Generating PNG..." : "Download Collage PNG"}
        </button>
      </div>

      {isHost && (
        <>
          <div style={{ height: 14 }} />
          {isLast ? (
            <button className="btn btn-primary full" onClick={() => socket.emit("play_again", { code: room.code })}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: 4 }}>
                <polyline points="1 4 1 10 7 10"></polyline>
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
              </svg>
              Back to lobby
            </button>
          ) : (
            <button className="btn btn-yellow full" onClick={() => socket.emit("next_reveal", { code: room.code })}>
              Next chain
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginLeft: 4 }}>
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
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
