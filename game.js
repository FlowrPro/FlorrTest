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

const socket = io("https://florrtest-backend-1.onrender.com"); 
setSocket(socket);

let player = { 
  id: null, 
  x: 0, 
  y: 0, 
  radius: 20, 
  hotbar: [], 
  orbitAngle: 0,
  orbitDist: 56,       // per-player orbit distance
  leftHeld: false,     // per-player input state
  rightHeld: false,
  username: null
};
let orbitSpeed = 0.02;
let extendDist = 96;
let retractDist = 41;
let world = { centerX: 800, centerY: 450, mapRadius: 390 };
let items = [];
let otherPlayers = {};

// --- Camera state ---
let cameraX = 0;
let cameraY = 0;
function updateCamera() {
  cameraX = player.x - canvas.width / 2;
  cameraY = player.y - canvas.height / 2;
}

canvas.addEventListener("mousedown", e => {
  if (e.button === 0) player.leftHeld = true;
  if (e.button === 2) player.rightHeld = true;
});
canvas.addEventListener("mouseup", e => {
  if (e.button === 0) player.leftHeld = false;
  if (e.button === 2) player.rightHeld = false;
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

  // Orbit distance controlled per player
  if (player.leftHeld) {
    player.orbitDist = extendDist;
  } else if (player.rightHeld) {
    player.orbitDist = retractDist;
  } else {
    player.orbitDist = 56;
  }

  socket.emit("orbit_control", { orbitDist: player.orbitDist });

  // Item collisions
  items.forEach(item => {
    const dist = Math.hypot(player.x - item.x, player.y - item.y);
    if (dist < player.radius + item.radius) {
      socket.emit("pickup_request", { itemId: item.id });
    }
  });

  updateCamera(); // NEW: update camera each frame
}

function drawPlayer(p) {
  // Body
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
  ctx.fillStyle = "orange";
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "yellow";
  ctx.stroke();

  // Username above player
  if (p.username) {
    ctx.fillStyle = "white";
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.fillText(p.username, p.x, p.y - p.radius - 10);
  }
    // Health bar above player
  if (typeof p.health === "number") {
    const barWidth = 40;
    const barHeight = 6;
    const x = p.x - barWidth / 2;
    const y = p.y + p.radius + 10; // BELOW player

    // Background
    ctx.fillStyle = "black";
    ctx.fillRect(x, y, barWidth, barHeight);

    // Current health
    const healthPercent = Math.max(0, p.health) / 100;
    ctx.fillStyle = "lime";
    ctx.fillRect(x, y, barWidth * healthPercent, barHeight);

    // Border
    ctx.strokeStyle = "white";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, barWidth, barHeight);
  }
  // Eyes
  const eyeOffsetX = p.radius * 0.4;
  const eyeOffsetY = p.radius * -0.3;
  const eyeRadiusX = p.radius * 0.15;
  const eyeRadiusY = p.radius * 0.25;

  ctx.fillStyle = "black";
  ctx.beginPath();
  ctx.ellipse(p.x - eyeOffsetX, p.y + eyeOffsetY, eyeRadiusX, eyeRadiusY, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(p.x + eyeOffsetX, p.y + eyeOffsetY, eyeRadiusX, eyeRadiusY, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eye highlights
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(p.x - eyeOffsetX + eyeRadiusX * 0.4, p.y + eyeOffsetY - eyeRadiusY * 0.4, eyeRadiusX * 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(p.x + eyeOffsetX + eyeRadiusX * 0.4, p.y + eyeOffsetY - eyeRadiusY * 0.4, eyeRadiusX * 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Smile
  ctx.beginPath();
  const smileRadius = p.radius * 0.6;
  ctx.arc(p.x, p.y + p.radius * 0.2, smileRadius, 0.2 * Math.PI, 0.8 * Math.PI);
  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Orbiting petals
  const equipped = p.hotbar.filter(i => i);
  if (equipped.length > 0) {
    const angleStep = (2 * Math.PI) / equipped.length;
    equipped.forEach((item, idx) => {
      const angle = p.orbitAngle + idx * angleStep;
      const x = p.x + (p.orbitDist || 56) * Math.cos(angle);
      const y = p.y + (p.orbitDist || 56) * Math.sin(angle);
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fillStyle = item.color || "cyan";
      ctx.fill();
    });
  }
}

function draw() {
  ctx.setTransform(1, 0, 0, 1, 0, 0); // reset transform
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Apply camera offset
  ctx.translate(-cameraX, -cameraY);

  ctx.fillStyle = "rgba(0,128,0,0.25)";
  ctx.fillRect(0, 0, world.width || canvas.width, world.height || canvas.height);

  ctx.beginPath();
  ctx.arc(world.centerX, world.centerY, world.mapRadius, 0, Math.PI * 2);
  ctx.fillStyle = "#2ecc71";
  ctx.fill();
  ctx.strokeStyle = "#0f0";
  ctx.lineWidth = 3;
  ctx.stroke();

  if (player.id) {
    drawPlayer(player);
  }

  Object.values(otherPlayers).forEach(p => {
    drawPlayer(p);
  });

  items.forEach(item => {
    ctx.beginPath();
    ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
    ctx.fillStyle = item.color;
    ctx.fill();
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
    player.orbitDist = p.orbitDist;
    player.hotbar = [...p.hotbar];
    hotbar.splice(0, hotbar.length, ...p.hotbar);
    player.username = p.username;
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

// --- Homescreen Play Button ---
const playBtn = document.getElementById("play-btn");
if (playBtn) {
  playBtn.addEventListener("click", () => {
    const usernameInput = document.getElementById("username");
    const username = usernameInput.value.trim();
    if (!username) {
      alert("Please enter a username!");
      return;
    }

    const homescreen = document.getElementById("homescreen");
    homescreen.classList.add("fade-out");

    setTimeout(() => {
      homescreen.style.display = "none";
      socket.emit("set_username", { username });
    }, 800); // matches CSS transition duration
  });
}
