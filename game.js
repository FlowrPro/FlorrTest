// game.js
import { inventory, hotbar, renderInventory, renderHotbar, addItem } from "./inventory.js";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let centerX = 0;
let centerY = 0;
let mapRadius = 0;

const player = { x: 0, y: 0, radius: 12, speed: 3 };
const keys = {};

// Resize-aware canvas and map
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  centerX = canvas.width / 2;
  centerY = canvas.height / 2;

  // Big circle: fit to viewport with margin
  mapRadius = Math.min(canvas.width, canvas.height) / 2 - 60;

  // If player hasn't been initialized, place at center
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

// Spawn test item
const itemsOnMap = [
  { name: "Petal", color: "cyan", x: () => player.x + 40, y: () => player.y, radius: 8 }
];

function update() {
  let dx = 0,
    dy = 0;
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
  // Items follow initial offset from player; evaluate positions lazily
  itemsOnMap.forEach((item, idx) => {
    const ix = typeof item.x === "function" ? item.x() : item.x;
    const iy = typeof item.y === "function" ? item.y() : item.y;
    const dist = Math.hypot(player.x - ix, player.y - iy);
    if (dist < player.radius + item.radius) {
      if (addItem({ name: item.name, color: item.color })) {
        itemsOnMap.splice(idx, 1);
      }
    }
  });
}

function draw() {
  // Outside area: faded green
  ctx.fillStyle = "rgba(0, 128, 0, 0.25)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Map circle: solid green floor
  ctx.beginPath();
  ctx.arc(centerX, centerY, mapRadius, 0, Math.PI * 2);
  ctx.fillStyle = "#2ecc71"; // solid green inside
  ctx.fill();

  // Boundary stroke
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

  // Items on map
  itemsOnMap.forEach(item => {
    const ix = typeof item.x === "function" ? item.x() : item.x;
    const iy = typeof item.y === "function" ? item.y() : item.y;
    ctx.beginPath();
    ctx.arc(ix, iy, item.radius, 0, Math.PI * 2);
    ctx.fillStyle = item.color;
    ctx.fill();
  });

  // Hotbar petals around player
  const equipped = hotbar.filter(i => i);
  if (equipped.length > 0) {
    const angleStep = (2 * Math.PI) / equipped.length;
    const orbitDist = player.radius + 28;
    equipped.forEach((item, idx) => {
      const angle = idx * angleStep;
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

// Init UI and loop
renderInventory();
renderHotbar();
gameLoop();

// Toggle inventory (button and keybind)
function toggleInventory() {
  const inv = document.getElementById("inventory");
  inv.classList.toggle("hidden");
}
document.getElementById("invToggle").onclick = toggleInventory;
