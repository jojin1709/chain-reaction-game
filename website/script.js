// Background Floating Particle Canvas
(function initParticles() {
  const pCanvas = document.getElementById("particle-canvas");
  if (!pCanvas) return;
  const pCtx = pCanvas.getContext("2d");

  let width = (pCanvas.width = window.innerWidth);
  let height = (pCanvas.height = window.innerHeight);

  window.addEventListener("resize", () => {
    width = pCanvas.width = window.innerWidth;
    height = pCanvas.height = window.innerHeight;
  });

  const particles = [];
  const colors = ["#2FD8C9", "#FF6B6B", "#FFD93D", "#7B5CFA"];

  for (let i = 0; i < 45; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 3 + 1,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.5 + 0.2,
    });
  }

  function animate() {
    pCtx.clearRect(0, 0, width, height);

    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      pCtx.beginPath();
      pCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      pCtx.fillStyle = p.color;
      pCtx.globalAlpha = p.alpha;
      pCtx.fill();
    });

    pCtx.globalAlpha = 1;
    requestAnimationFrame(animate);
  }

  animate();
})();

// Interactive Demo Canvas
(function initDemoCanvas() {
  const canvas = document.getElementById("demo-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  // High DPI scaling
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * 2;
  canvas.height = 320 * 2;
  ctx.scale(2, 2);

  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, rect.width, 320);

  let drawing = false;
  let currentColor = "#2A2140";
  let currentSize = 6;
  let lastPos = { x: 0, y: 0 };
  const historyStack = [];

  function saveSnapshot() {
    const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    historyStack.push(snapshot);
    if (historyStack.length > 20) historyStack.shift();
  }

  function getPos(e) {
    const cRect = canvas.getBoundingClientRect();
    const point = e.touches ? e.touches[0] : e;
    return {
      x: point.clientX - cRect.left,
      y: point.clientY - cRect.top,
    };
  }

  function start(e) {
    if (e.touches && e.cancelable) e.preventDefault();
    saveSnapshot();
    drawing = true;
    lastPos = getPos(e);
  }

  function move(e) {
    if (!drawing) return;
    if (e.touches && e.cancelable) e.preventDefault();
    const pos = getPos(e);
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = currentSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos = pos;
  }

  function stop() {
    drawing = false;
  }

  canvas.addEventListener("mousedown", start);
  canvas.addEventListener("mousemove", move);
  canvas.addEventListener("mouseup", stop);
  canvas.addEventListener("mouseleave", stop);
  canvas.addEventListener("touchstart", start, { passive: false });
  canvas.addEventListener("touchmove", move, { passive: false });
  canvas.addEventListener("touchend", stop);

  // Palette color selection
  document.querySelectorAll(".color-dot").forEach((dot) => {
    dot.addEventListener("click", () => {
      document.querySelectorAll(".color-dot").forEach((d) => d.classList.remove("active"));
      dot.classList.add("active");
      currentColor = dot.getAttribute("data-color");
    });
  });

  // Brush size slider
  const sizeRange = document.getElementById("brush-range");
  if (sizeRange) {
    sizeRange.addEventListener("input", (e) => {
      currentSize = Number(e.target.value);
    });
  }

  // Clear button
  const clearBtn = document.getElementById("clear-btn");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      saveSnapshot();
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    });
  }

  // Undo button
  const undoBtn = document.getElementById("undo-btn");
  if (undoBtn) {
    undoBtn.addEventListener("click", () => {
      if (historyStack.length > 0) {
        const snapshot = historyStack.pop();
        ctx.putImageData(snapshot, 0, 0);
      }
    });
  }
})();

// Lightbox Modal Functions
function openLightbox(imgSrc) {
  const modal = document.getElementById("lightbox-modal");
  const modalImg = document.getElementById("lightbox-img");
  if (modal && modalImg) {
    modalImg.src = imgSrc;
    modal.classList.add("active");
  }
}

function closeLightbox() {
  const modal = document.getElementById("lightbox-modal");
  if (modal) {
    modal.classList.remove("active");
  }
}
