import { inventory, hotbar, renderInventory, renderHotbar, addItem } from "./inventory.js";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let centerX = 0;
let centerY = 0;
let mapRadius = 0;

const player = { x: 0, y: 0, radius: 28, speed: 3 };
const keys = {};
let orbitAngle = 0;
let orbitSpeed = 0.02; // tweak this for faster/slower rotation

// Orbit distance modifiers
let baseOrbitDist = player.radius + 28;
let orbitDist = baseOrbitDist;
let extendDist = baseOrbitDist + 40;
let retractDist = baseOrbitDist - 15;

// Resize-aware canvas and map
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

// Keyboard
document.addEventListener("keydown", e => {
  keys[e.key] = true;
  if (e.key.toLowerCase() === "x") toggleInventory();
});
document.addEventListener("keyup", e => (keys[e.key] = false));

// Mouse
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
canvas.addEventListener("contextmenu", e => e.preventDefault());

// Test petals on ground
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

  // Pickup
  itemsOnMap.forEach((item, idx) => {
    const dist = Math.hypot(player.x - item.x, player.y - item.y);
    if (dist < player.radius + item.radius) {
      if (addItem({ name: item.name, color: item.color })) {
        itemsOnMap.splice(idx, 1);
      }
    }
  });

  // Orbit distance control
  if (leftHeld) orbitDist = extendDist;
  else if (rightHeld) orbitDist = retractDist;
  else orbitDist = baseOrbitDist;

  orbitAngle += orbitSpeed;
}

function draw() {
  // Background
  ctx.fillStyle = "rgba(0, 128, 0, 0.25)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Map circle
  ctx.beginPath();
  ctx.arc(centerX, centerY, mapRadius, 0, Math.PI * 2);
  ctx.fillStyle = "#2ecc71";
  ctx.fill();
  ctx.strokeStyle = "#0f0";
  ctx.lineWidth = 3;
  ctx.stroke();

  // Player face
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.fillStyle = "orange";
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "yellow";
  ctx.stroke();

  // Eyes
  const eyeOffsetX = player.radius * 0.4;
  const eyeOffsetY = player.radius * -0.3;
  const eyeRadiusX = player.radius * 0.15;
  const eyeRadiusY = player.radius * 0.25;

  ctx.fillStyle = "black";
  ctx.beginPath();
  ctx.ellipse(player.x - eyeOffsetX, player.y + eyeOffsetY, eyeRadiusX, eyeRadiusY, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(player.x + eyeOffsetX, player.y + eyeOffsetY, eyeRadiusX, eyeRadiusY, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eye highlights
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(player.x - eyeOffsetX + eyeRadiusX * 0.4, player.y + eyeOffsetY - eyeRadiusY * 0.4, eyeRadiusX * 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(player.x + eyeOffsetX + eyeRadiusX * 0.4, player.y + eyeOffsetY - eyeRadiusY * 0.4, eyeRadiusX * 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Smile
  ctx.beginPath();
  const smileRadius = player.radius * 0.6;
  ctx.arc(player.x, player.y + player.radius * 0.2, smileRadius, 0.2 * Math.PI, 0.8 * Math.PI);
  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Items on ground
  itemsOnMap.forEach(item => {
    ctx.beginPath();
    ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
    ctx.fillStyle = item.color;
    ctx.fill();
  });

  // Orbiting petals
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

renderInventory();
renderHotbar();
gameLoop();

function toggleInventory() {
  document.getElementById("inventory").classList.toggle("hidden");
}
document.getElementById("invToggle").onclick = toggleInventory;
