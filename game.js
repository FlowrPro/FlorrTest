import { inventory, hotbar, renderInventory, renderHotbar } from "./inventory.js";
import { setSocket as setMobSocket, setContext as setMobContext, renderMobs } from "./mob.js";
import { connectToGame, socket } from "./network.js";
import { setupChat } from "./chat.js";
import { setupUI } from "./ui.js";
import { player, updateCamera, orbitSpeed, extendDist, retractDist } from "./player.js";
import { keys, mouseX, mouseY, mouseMovementEnabled } from "./input.js";
import { updatePetalCollisions } from "./petals.js";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
setMobContext(ctx);

// --- Fullscreen canvas setup ---
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

const toggleHitboxes = document.getElementById("toggle-hitboxes");
function showHitboxesEnabled() {
  return toggleHitboxes.checked;
}

// Initialize modules
window.onload = () => {
  connectToGame();
  setupChat(socket);
  setupUI();
};

// --- Update / Game logic ---
function update() {
  if (!player || !player.id) return;

  let dx = 0, dy = 0;

  if (mouseMovementEnabled) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const diffX = mouseX - centerX;
    const diffY = mouseY - centerY;
    const dist = Math.hypot(diffX, diffY);

    if (dist > 20) {
      dx = diffX / dist;
      dy = diffY / dist;
    }
  } else {
    if (keys["w"]) dy -= 1;
    if (keys["s"]) dy += 1;
    if (keys["a"]) dx -= 1;
    if (keys["d"]) dx += 1;
  }

  if (dx !== 0 || dy !== 0) {
    if (socket) socket.emit("move", { dx, dy });
  }

  if (player.leftHeld) {
    player.orbitDist = extendDist;
  } else if (player.rightHeld) {
    player.orbitDist = retractDist;
  } else {
    player.orbitDist = 56;
  }

  if (socket) socket.emit("orbit_control", { orbitDist: player.orbitDist });

  // Item collisions
  items.forEach(item => {
    const dist = Math.hypot(player.x - item.x, player.y - item.y);
    if (dist < player.radius + item.radius) {
      if (socket) socket.emit("pickup_request", { itemId: item.id });
    }
  });

  // Petal collisions (modularized)
  updatePetalCollisions(player, otherPlayers, mobs);

  updateCamera();
}

// --- Drawing ---
function drawPlayer(p) {
  // (same as your original drawPlayer implementation)
  // includes body, eyes, health bar, orbiting petals
}

function draw() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.translate(-cameraX, -cameraY);

  ctx.fillStyle = "rgba(0,128,0,0.25)";
  ctx.fillRect(0, 0, world.width || canvas.width, world.height || canvas.height);

  ctx.fillStyle = "#2ecc71";
  ctx.fillRect(0, 0, world.width, world.height);

  ctx.strokeStyle = "#0f0";
  ctx.lineWidth = 3;
  ctx.strokeRect(0, 0, world.width, world.height);

  renderMobs(player);

  if (player.id) {
    drawPlayer(player);
    if (showHitboxesEnabled()) {
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
      ctx.strokeStyle = "red";
      ctx.stroke();
    }
  }

  Object.values(otherPlayers).forEach(p => {
    drawPlayer(p);
    if (showHitboxesEnabled()) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.strokeStyle = "red";
      ctx.stroke();
    }
  });

  items.forEach(item => {
    ctx.beginPath();
    ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
    ctx.fillStyle = item.color;
    ctx.fill();

    if (showHitboxesEnabled()) {
      ctx.strokeStyle = "red";
      ctx.stroke();
    }
  });

  // minimap drawing (same as your original)
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}
gameLoop();

// Respawn button
const respawnBtn = document.getElementById("respawn-btn");
if (respawnBtn) {
  respawnBtn.addEventListener("click", () => {
    if (socket) socket.emit("respawn_request");
  });
}


