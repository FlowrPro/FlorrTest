import { inventory, hotbar, renderInventory, renderHotbar, setSocket } from "./inventory.js";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
// --- Fullscreen canvas setup ---
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas(); // initial call
window.addEventListener("resize", resizeCanvas);

const socket = io("https://florrtest-backend-1.onrender.com"); // replace with your backend URL
setSocket(socket);

let player = { id: null, x: 0, y: 0, radius: 28, hotbar: [], orbitAngle: 0 };
let orbitSpeed = 0.02;
let orbitDist = 56;
let extendDist = 96;
let retractDist = 41;
let leftHeld = false;
let rightHeld = false;
let world = { centerX: 800, centerY: 450, mapRadius: 390 };
let items = [];
let otherPlayers = {};

canvas.addEventListener("mousedown", e => {
  if (e.button === 0) leftHeld = true;
  if (e.button === 2) rightHeld = true;
});
canvas.addEventListener("mouseup", e => {
  if (e.button === 0) leftHeld = false;
  if (e.button === 2) rightHeld = false;
});
canvas.addEventListener("contextmenu", e => e.preventDefault());

document.addEventListener("keydown", e => {
  if (e.key === "x") toggleInventory();
});
document.getElementById("invToggle").onclick = toggleInventory;

function toggleInventory() {
  document.getElementById("inventory").classList.toggle("hidden");
}

const keys = {};
document.addEventListener("keydown", e => (keys[e.key] = true));
document.addEventListener("keyup", e => (keys[e.key] = false));

function update() {
  let dx = 0, dy = 0;
  if (keys["w"]) dy -= 1;
  if (keys["s"]) dy += 1;
  if (keys["a"]) dx -= 1;
  if (keys["d"]) dx += 1;
  if (dx !== 0 || dy !== 0) socket.emit("move", { dx, dy });

  orbitDist = leftHeld ? extendDist : rightHeld ? retractDist : 56;

  // --- NEW: check for item collisions ---
  items.forEach(item => {
    const dist = Math.hypot(player.x - item.x, player.y - item.y);
    if (dist < player.radius + item.radius) {
      socket.emit("pickup_request", { itemId: item.id });
    }
  });
}

function draw() {
  // Clear background
  ctx.fillStyle = "rgba(0,128,0,0.25)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Camera offset (centered on player)
  const cameraX = player.x - canvas.width / 2;
  const cameraY = player.y - canvas.height / 2;

  // Draw world map (relative to camera)
  ctx.beginPath();
  ctx.arc(world.width / 2 - cameraX, world.height / 2 - cameraY, world.mapRadius, 0, Math.PI * 2);
  ctx.fillStyle = "#2ecc71";
  ctx.fill();
  ctx.strokeStyle = "#0f0";
  ctx.lineWidth = 3;
  ctx.stroke();

  // Draw player
  if (player.id) {
    ctx.beginPath();
    ctx.arc(player.x - cameraX, player.y - cameraY, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = "orange";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "yellow";
    ctx.stroke();

    // Orbiting petals
    const equipped = hotbar.filter(i => i);
    if (equipped.length > 0) {
      const angleStep = (2 * Math.PI) / equipped.length;
      equipped.forEach((item, idx) => {
        const angle = player.orbitAngle + idx * angleStep;
        const x = player.x + orbitDist * Math.cos(angle);
        const y = player.y + orbitDist * Math.sin(angle);
        ctx.beginPath();
        ctx.arc(x - cameraX, y - cameraY, 8, 0, Math.PI * 2);
        ctx.fillStyle = item.color || "cyan";
        ctx.fill();
      });
    }
  }

  // Items on ground
  items.forEach(item => {
    ctx.beginPath();
    ctx.arc(item.x - cameraX, item.y - cameraY, item.radius, 0, Math.PI * 2);
    ctx.fillStyle = item.color;
    ctx.fill();
  });

  // Other players
  Object.values(otherPlayers).forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x - cameraX, p.y - cameraY, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = "blue";
    ctx.fill();
    ctx.strokeStyle = "white";
    ctx.stroke();
  });
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}
gameLoop();

// --- Socket events ---
socket.on("world_snapshot", ({ world: w, self, players, items: its }) => {
  world = w;
  player = self;
  items = its;
  inventory.splice(0, inventory.length, ...self.inventory);
  hotbar.splice(0, hotbar.length, ...self.hotbar);
  renderInventory();
  renderHotbar();
  players.forEach(p => (otherPlayers[p.id] = p));
});

socket.on("items_update", its => {
  items = its;
});

socket.on("inventory_update", inv => {
  inventory.splice(0, inventory.length, ...inv);
  renderInventory();
});

socket.on("hotbar_update", hb => {
  hotbar.splice(0, hotbar.length, ...hb);
  renderHotbar();
});

socket.on("player_update", p => {
  if (p.id === socket.id) {
    player.x = p.x;
    player.y = p.y;
    player.orbitAngle = p.orbitAngle;
    hotbar.splice(0, hotbar.length, ...p.hotbar);
  } else {
    otherPlayers[p.id] = p;
  }
});

socket.on("player_join", p => {
  otherPlayers[p.id] = p;
});

socket.on("player_leave", ({ id }) => {
  delete otherPlayers[id];
});
