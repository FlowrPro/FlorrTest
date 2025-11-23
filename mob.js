export let mobs = []; // dynamic mob list

let ctx = null; // canvas context
export function setContext(c) {
  ctx = c;
}

// --- Socket integration ---
let socket = null;
export function setSocket(s) {
  socket = s;
  socket.on("mobs_update", mobList => {
    // initialize facingAngle for new mobs
    mobs = mobList.map(m => ({
      ...m,
      facingAngle: m.facingAngle || 0
    }));
  });

  // NEW: remove mob when backend says it's dead
  socket.on("mob_dead", ({ id }) => {
    mobs = mobs.filter(m => m.id !== id);
  });
}

// --- Rendering ---
// Load mob image once
const mobImage = new Image();
mobImage.src = "/assets/mob.png"; // path to your uploaded image

export function drawMob(m) {
  if (!ctx) return;

  if (mobImage.complete) {
    ctx.save();
    ctx.translate(m.x, m.y);
    ctx.rotate(m.facingAngle || 0); // use stored angle
    ctx.drawImage(mobImage, -m.radius, -m.radius, m.radius * 2, m.radius * 2);
    ctx.restore();
  } else {
    // fallback circle until image loads
    ctx.beginPath();
    ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
    ctx.fillStyle = m.color || "purple";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "black";
    ctx.stroke();
  }

  // Draw rarity label above mob
  ctx.fillStyle = "white";
  ctx.font = "12px Arial";
  ctx.textAlign = "center";
  ctx.fillText(m.rarity, m.x, m.y - m.radius - 6);

  // Health bar
  const barWidth = 50;
  const barHeight = 6;
  const x = m.x - barWidth / 2;
  const y = m.y - m.radius - 20;

  ctx.fillStyle = "black";
  ctx.fillRect(x, y, barWidth, barHeight);

  const healthPercent = Math.max(0, m.health) / m.maxHealth;
  ctx.fillStyle = "lime";
  ctx.fillRect(x, y, barWidth * healthPercent, barHeight);

  ctx.strokeStyle = "white";
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, barWidth, barHeight);

  // --- Hitbox overlay (toggle from game.js) ---
  if (typeof showHitboxesEnabled === "function" && showHitboxesEnabled()) {
    ctx.beginPath();
    ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

// --- Draw all mobs ---
export function renderMobs(player) {
  mobs.forEach(m => drawMob(m));
}
