const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const worldItems = [
  {
    type: "redPetal",
    x: map.x + 60,
    y: map.y + 40,
    radius: 12,
    icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Simple_flower_icon.svg/1024px-Simple_flower_icon.svg.png"
  }
];
canvas.addEventListener("contextmenu", e => e.preventDefault()); // Makes right clicking NOT show up context menu
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

const keys = {};
window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);
window.addEventListener("keydown", e => {
  keys[e.key.toLowerCase()] = true;

  const num = parseInt(e.key);
  if (!isNaN(num) && num >= 1 && num <= 10) {
    selectedSlotIndex = num === 10 ? 9 : num - 1;
    updateHotbarUI();
  }
});
const map = {
  x: 0,
  y: 0,
  radius: 800
};

const player = {
  x: 0,
  y: 0,
  radius: 20,
  speed: 3,
  angle: 0,
  sprite: null
};

const grassBlades = [];
const flowerPatches = [];

function loadSprite() {
  const img = new Image();
  img.src = "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Simple_flower_icon.svg/1024px-Simple_flower_icon.svg.png";
  img.onload = () => player.sprite = img;
}
loadSprite();

function updatePlayer() {
  let dx = 0, dy = 0;
  if (keys["w"]) dy -= player.speed;
  if (keys["s"]) dy += player.speed;
  if (keys["a"]) dx -= player.speed;
  if (keys["d"]) dx += player.speed;

  const newX = player.x + dx;
  const newY = player.y + dy;

  const distFromCenter = Math.hypot(newX - map.x, newY - map.y);
  if (distFromCenter + player.radius < map.radius) {
    player.x = newX;
    player.y = newY;
  }

  if (dx !== 0 || dy !== 0) {
    player.angle = Math.atan2(dy, dx);
  }
}

function drawBackground(cameraX, cameraY) {
  ctx.fillStyle = "#a8d5a2";
  ctx.globalAlpha = 0.2;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalAlpha = 1;

  const gradient = ctx.createRadialGradient(
    map.x - cameraX,
    map.y - cameraY,
    0,
    map.x - cameraX,
    map.y - cameraY,
    map.radius
  );
  gradient.addColorStop(0, "#c8facc");
  gradient.addColorStop(1, "#7bbf7b");

  ctx.beginPath();
  ctx.arc(map.x - cameraX, map.y - cameraY, map.radius, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();
}

function generateGrass(count, areaWidth, areaHeight, offsetX, offsetY) {
  for (let i = 0; i < count; i++) {
    const x = Math.random() * areaWidth + offsetX;
    const y = Math.random() * areaHeight + offsetY;
    const length = 4 + Math.random() * 4;
    const angle = Math.random() * Math.PI * 2;
    const angleOffset = (Math.random() - 0.5) * 0.5;
    const color = Math.random() < 0.5 ? "#4e944f" : "#3b7d3b";

    grassBlades.push({ x, y, length, angle, angleOffset, color });
  }
}

function drawGrass(cameraX, cameraY) {
  for (const blade of grassBlades) {
    ctx.beginPath();
    ctx.moveTo(blade.x - cameraX, blade.y - cameraY);
    ctx.lineTo(
      blade.x - cameraX + Math.cos(blade.angle + blade.angleOffset) * blade.length,
      blade.y - cameraY + Math.sin(blade.angle + blade.angleOffset) * blade.length
    );
    ctx.strokeStyle = blade.color;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function generateFlowerPatches(count, areaWidth, areaHeight, offsetX, offsetY) {
  for (let i = 0; i < count; i++) {
    const x = Math.random() * areaWidth + offsetX;
    const y = Math.random() * areaHeight + offsetY;
    flowerPatches.push({ x, y });
  }
}

function drawFlowerPatches(cameraX, cameraY) {
  for (const patch of flowerPatches) {
    drawFlowerPatch(patch.x - cameraX, patch.y - cameraY);
  }
}

function drawFlowerPatch(x, y) {
  const flowers = 5 + Math.floor(Math.random() * 5);
  for (let i = 0; i < flowers; i++) {
    const offsetX = (Math.random() - 0.5) * 30;
    const offsetY = (Math.random() - 0.5) * 30;
    drawFlower(x + offsetX, y + offsetY);
  }
}

function drawFlower(x, y) {
  const petalCount = 6;
  const radius = 6;
  const petalColor = ["#ff69b4", "#ffa07a", "#ffd700"][Math.floor(Math.random() * 3)];

  ctx.save();
  ctx.translate(x, y);

  for (let i = 0; i < petalCount; i++) {
    ctx.save();
    ctx.rotate((Math.PI * 2 * i) / petalCount);
    ctx.beginPath();
    ctx.ellipse(0, radius / 2, radius / 2, radius, 0, 0, Math.PI * 2);
    ctx.fillStyle = petalColor;
    ctx.fill();
    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.restore();
}

function drawPlayer(cameraX, cameraY) {
  const px = player.x - cameraX;
  const py = player.y - cameraY;
  const r = player.radius;

  ctx.save();
  ctx.translate(px, py);

  // Outer yellow ring
  ctx.beginPath();
  ctx.arc(0, 0, r + 4, 0, Math.PI * 2);
  ctx.fillStyle = "#ffcc00";
  ctx.fill();

  // Inner orange face
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = "#ff9900";
  ctx.fill();

  // Eye direction based on movement
  let dx = 0, dy = 0;
  if (keys["w"]) dy -= 1;
  if (keys["s"]) dy += 1;
  if (keys["a"]) dx -= 1;
  if (keys["d"]) dx += 1;

  const eyeOffsetX = r * 0.4;
  const eyeOffsetY = -r * 0.3;
  const eyeRadius = r * 0.2;
  const eyeLookOffset = 2;

  const eyeDirX = dx * eyeLookOffset;
  const eyeDirY = dy * eyeLookOffset;

  // Eyes
  ctx.beginPath();
  ctx.arc(-eyeOffsetX + eyeDirX, eyeOffsetY + eyeDirY, eyeRadius, 0, Math.PI * 2);
  ctx.arc(eyeOffsetX + eyeDirX, eyeOffsetY + eyeDirY, eyeRadius, 0, Math.PI * 2);
  ctx.fillStyle = "#000";
  ctx.fill();

  // Eye highlights
  const highlightRadius = eyeRadius * 0.4;
  ctx.beginPath();
  ctx.arc(-eyeOffsetX + eyeDirX - highlightRadius / 2, eyeOffsetY + eyeDirY - highlightRadius / 2, highlightRadius, 0, Math.PI * 2);
  ctx.arc(eyeOffsetX + eyeDirX - highlightRadius / 2, eyeOffsetY + eyeDirY - highlightRadius / 2, highlightRadius, 0, Math.PI * 2);
  ctx.fillStyle = "#fff";
  ctx.fill();

  // Smile
  ctx.beginPath();
  ctx.arc(0, r * 0.3, r * 0.3, 0.2 * Math.PI, 0.8 * Math.PI);
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.restore();
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  updatePlayer();

  const dpr = window.devicePixelRatio || 1;
  const cameraX = Math.floor(player.x - canvas.width / dpr / 2);
  const cameraY = Math.floor(player.y - canvas.height / dpr / 2);

  drawBackground(cameraX, cameraY);
  drawGrass(cameraX, cameraY);
  drawFlowerPatches(cameraX, cameraY);
  drawPlayer(cameraX, cameraY);

  requestAnimationFrame(gameLoop);
}

// Initialize world
player.x = map.x;
player.y = map.y;

const worldSize = 3000;
generateGrass(2000, worldSize, worldSize, map.x - worldSize / 2, map.y - worldSize / 2);
generateFlowerPatches(50, worldSize, worldSize, map.x - worldSize / 2, map.y - worldSize / 2);

gameLoop();
// Simulate assigning a petal to slot 1
assignItemToHotbar({
  type: "redPetal",
  icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Simple_flower_icon.svg/1024px-Simple_flower_icon.svg.png"
});

// Start of inventory system
const inventoryButton = document.getElementById("inventory-button");
const inventoryPanel = document.getElementById("inventory-panel");

inventoryButton.addEventListener("click", () => {
  inventoryPanel.hidden = !inventoryPanel.hidden;
});
const inventoryGrid = document.getElementById("inventory-grid");

// Simulate petals/items
const petalCount = 40; // Change this number to test scrolling
for (let i = 0; i < petalCount; i++) {
  const slot = document.createElement("div");
  slot.style.width = "40px";
  slot.style.height = "40px";
  slot.style.backgroundColor = "#555";
  slot.style.border = "1px solid #999";
  slot.style.borderRadius = "4px";
  inventoryGrid.appendChild(slot);
}
const hotbarSlots = Array(10).fill(null); // 10 slots, initially empty
let selectedSlotIndex = 0;

// Render hotbar items and selection
function updateHotbarUI() {
  const hotbarElements = document.querySelectorAll(".hotbar-slot");
  hotbarElements.forEach((el, i) => {
    el.style.outline = i === selectedSlotIndex ? "2px solid #fff" : "none";
    el.style.backgroundImage = hotbarSlots[i]?.icon ? `url(${hotbarSlots[i].icon})` : "none";
    el.style.backgroundSize = "cover";
    el.style.backgroundPosition = "center";
  });
}

// Assign item to first empty slot
function assignItemToHotbar(item) {
  const index = hotbarSlots.findIndex(slot => slot === null);
  if (index !== -1) {
    hotbarSlots[index] = item;
    updateHotbarUI();
  }
}
