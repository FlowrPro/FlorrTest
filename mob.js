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
    mobs = mobList;
  });

  // NEW: remove mob when backend says it's dead
  socket.on("mob_dead", ({ id }) => {
    mobs = mobs.filter(m => m.id !== id);
  });
}

// --- Rendering ---
export function drawMob(m) {
  if (!ctx) return;

  ctx.beginPath();
  ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
  ctx.fillStyle = m.color || "purple";
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "black";
  ctx.stroke();

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
}

// --- Draw all mobs ---
export function renderMobs() {
  mobs.forEach(drawMob);
}
