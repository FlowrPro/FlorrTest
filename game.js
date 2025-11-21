// game.js
import { inventory, hotbar, renderInventory, renderHotbar, addItem } from "./inventory.js";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const mapRadius = 250;
const player = { x: 300, y: 300, radius: 10, speed: 3 };
const keys = {};

document.addEventListener("keydown", e => {
  keys[e.key] = true;
  if (e.key.toLowerCase() === "x") toggleInventory();
});
document.addEventListener("keyup", e => keys[e.key] = false);

// Spawn test item
const itemsOnMap = [
  { name: "Petal", color: "cyan", x: player.x + 40, y: player.y, radius: 8 }
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
  const distFromCenter = Math.hypot(player.x - 300, player.y - 300);
  if (distFromCenter > mapRadius - player.radius) {
    const angle = Math.atan2(player.y - 300, player.x - 300);
    player.x = 300 + (mapRadius - player.radius) * Math.cos(angle);
    player.y = 300 + (mapRadius - player.radius) * Math.sin(angle);
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
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Map circle
  ctx.beginPath();
  ctx.arc(300, 300, mapRadius, 0, Math.PI * 2);
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
    ctx.beginPath();
    ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
    ctx.fillStyle = item.color;
    ctx.fill();
  });

  // Hotbar petals around player
  const equipped = hotbar.filter(i => i);
  const angleStep = (2 * Math.PI) / equipped.length;
  equipped.forEach((item, idx) => {
    const angle = idx * angleStep;
    const dist = player.radius + 25;
    const x = player.x + dist * Math.cos(angle);
    const y = player.y + dist * Math.sin(angle);
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fillStyle = item.color || "cyan";
    ctx.fill();
  });
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

// Toggle inventory
function toggleInventory() {
  document.getElementById("inventory").classList.toggle("hidden");
}
document.getElementById("invToggle").onclick = toggleInventory;
