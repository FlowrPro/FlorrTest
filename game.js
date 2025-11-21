// game.js
import { inventory, hotbar, renderInventory, renderHotbar, addItem } from "./inventory.js";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let centerX = 0;
let centerY = 0;
let mapRadius = 0;

const player = { x: 0, y: 0, radius: 12, speed: 3 };
const keys = {};
let orbitAngle = 0;
let orbitSpeed = 0.02; // tweakable rotation speed

// Orbit distance modifiers
let baseOrbitDist = player.radius + 28;
let orbitDist = baseOrbitDist;
let extendDist = baseOrbitDist + 40; // when left click held
let retractDist = baseOrbitDist - 15; // when right click held

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  centerX = canvas.width / 2;
  centerY = canvas.height / 2;
  mapRadius = Math.min(canvas.width, canvas.height) / 2 - 60;

  if (player.x === 0 && player.y === 0) {
    player.x = centerX;
    player.y = centerY;
  }
}
window.addEventListener("resize", resize);
resize();

document.addEventListener("keydown", e => {
  keys[e.key] = true;
  if (e.key.toLowerCase() === "x") toggleInventory();
});
document.addEventListener("keyup", e => (keys[e.key] = false));

// Mouse controls
let leftHeld = false;
let rightHeld = false;
canvas.addEventListener("mousedown", e => {
  if (e.button === 0) leftHeld = true;
  if (e.button === 2) rightHeld = true;
});
canvas.addEventListener("mouseup", e => {
  if (e.button === 0) leftHeld = false;
  if (e.button === 2) rightHeld = false;
});
// Prevent context menu on right click
canvas.addEventListener("contextmenu", e => e.preventDefault());

// --- Spawn test petals on ground ---
const itemsOnMap = [
  { name: "Petal", color: "cyan", x: centerX + 60, y: centerY, radius: 8 },
  { name: "Petal", color: "red", x: centerX - 80, y: centerY + 40, radius: 8 }
];

function update() {
  let dx = 0, dy = 0;
  if (keys["w"]) dy -= player.speed;
  if (keys["s"]) dy += player.speed;
  if (keys["a"]) dx -= player.speed;
  if (keys["d"]) dx += player.speed;

  player.x += dx;
  player.y += dy;

  // Keep inside circle
  const distFromCenter = Math.hypot(player.x - centerX, player.y - centerY);
  if (distFromCenter > mapRadius - player.radius) {
    const angle = Math.atan2(player.y - centerY, player.x - centerX);
    player.x = centerX + (mapRadius - player.radius) * Math.cos(angle);
    player.y = centerY + (mapRadius - player.radius) * Math.sin(angle);
  }

  // Pickup check
  itemsOnMap.forEach((item, idx) => {
    const dist = Math.hypot(player.x - item.x, player.y - item.y);
    if (dist < player.radius + item.radius) {
      if (addItem({ name: item.name, color: item.color })) {
        itemsOnMap.splice(idx, 1);
      }
    }
  });

  // Orbit angle update
  orbitAngle += orbitSpeed;

  // Orbit distance control
  if (leftHeld) {
    orbitDist = extendDist;
  } else if (rightHeld) {
    orbitDist = retractDist;
  } else {
    orbitDist = baseOrbitDist;
  }
}

function draw() {
  // Outside faded green
  ctx.fillStyle = "rgba(0, 128, 0, 0.25)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Map circle solid green
  ctx.beginPath();
  ctx.arc(centerX, centerY, mapRadius, 0, Math.PI * 2);
  ctx.fillStyle = "#2ecc71";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(centerX, centerY, mapRadius, 0, Math.PI * 2);
  ctx.strokeStyle = "#0f0";
  ctx.lineWidth = 3;
  ctx.stroke();

  // Player
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.fillStyle = "#ff0";
  ctx.fill();

  // Items on ground
  itemsOnMap.forEach(item => {
    ctx.beginPath();
    ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
    ctx.fillStyle = item.color;
    ctx.fill();
  });

  // Equipped petals orbit player
  const equipped = hotbar.filter(i => i);
  if (equipped.length > 0) {
    const angleStep = (2 * Math.PI) / equipped.length;
    equipped.forEach((item, idx) => {
      const angle = orbitAngle + idx * angleStep;
      const x = player.x + orbitDist * Math.cos(angle);
      const y = player.y + orbitDist * Math.sin(angle);
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fillStyle = item.color || "cyan";
      ctx.fill();
    });
  }
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

// Init
renderInventory();
renderHotbar();
gameLoop();

function toggleInventory() {
  document.getElementById("inventory").classList.toggle("hidden");
}
document.getElementById("invToggle").onclick = toggleInventory;
