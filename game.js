const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Replace with your actual Render backend URL
const socket = io("https://florrtest-backend.onrender.com");

let playerId = null;
let inventory = [];

const map = { x: 0, y: 0, radius: 800 };

const player = {
  x: 0,
  y: 0,
  radius: 20,
  speed: 3,
  angle: 0,
  sprite: null
};

const worldItems = [
  {
    type: "redPetal",
    x: map.x + 60,
    y: map.y + 40,
    radius: 12,
    icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Simple_flower_icon.svg/1024px-Simple_flower_icon.svg.png"
  }
];

canvas.addEventListener("contextmenu", e => e.preventDefault());

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
window.addEventListener("keydown", e => {
  keys[e.key.toLowerCase()] = true;

  const num = parseInt(e.key);
  if (!isNaN(num) && num >= 1 && num <= 10) {
    selectedSlotIndex = num === 10 ? 9 : num - 1;
    updateHotbarUI();
  }
});
window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

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

function drawPlayer(cameraX, cameraY) {
  const px = player.x - cameraX;
  const py = player.y - cameraY;
  const r = player.radius;

  ctx.save();
  ctx.translate(px, py);

  ctx.beginPath();
  ctx.arc(0, 0, r + 4, 0, Math.PI * 2);
  ctx.fillStyle = "#ffcc00";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = "#ff9900";
  ctx.fill();

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

  ctx.beginPath();
  ctx.arc(-eyeOffsetX + eyeDirX, eyeOffsetY + eyeDirY, eyeRadius, 0, Math.PI * 2);
  ctx.arc(eyeOffsetX + eyeDirX, eyeOffsetY + eyeDirY, eyeRadius, 0, Math.PI * 2);
  ctx.fillStyle = "#000";
  ctx.fill();

  const highlightRadius = eyeRadius * 0.4;
  ctx.beginPath();
  ctx.arc(-eyeOffsetX + eyeDirX - highlightRadius / 2, eyeOffsetY + eyeDirY - highlightRadius / 2, highlightRadius, 0, Math.PI * 2);
  ctx.arc(eyeOffsetX + eyeDirX - highlightRadius / 2, eyeOffsetY + eyeDirY - highlightRadius / 2, highlightRadius, 0, Math.PI * 2);
  ctx.fillStyle = "#fff";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(0, r * 0.3, r * 0.3, 0.2 * Math.PI, 0.8 * Math.PI);
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.restore();
}

function drawWorldItems(cameraX, cameraY) {
  for (const item of worldItems) {
    const px = item.x - cameraX;
    const py = item.y - cameraY;

    ctx.beginPath();
    ctx.arc(px, py, item.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();

    if (!item._img) {
      item._img = new Image();
      item._img.src = item.icon;
      item._img.onload = () => item._img._loaded = true;
      item._img.onerror = () => item._img._failed = true;
    }

    if (item._img._loaded) {
      ctx.drawImage(item._img, px - item.radius, py - item.radius, item.radius * 2, item.radius * 2);
    }
  }
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  updatePlayer();

  socket.emit("move", { x: player.x, y: player.y });

  for (let i = worldItems.length - 1; i >= 0; i--) {
    const item = worldItems[i];
    const dist = Math.hypot(player.x - item.x, player.y - item.y);
    if (dist < player.radius + item.radius) {
      socket.emit("pickupItem", { type: item.type, icon: item.icon });
      worldItems.splice(i, 1);
    }
  }

  const dpr = window.devicePixelRatio || 1;
  const cameraX = Math.floor(player.x - canvas.width / dpr / 2);
  const cameraY = Math.floor(player.y - canvas.height / dpr / 2);

  drawBackground(cameraX, cameraY);
  drawGrass(cameraX, cameraY);
  drawFlowerPatches(cameraX, cameraY);
  drawPlayer(cameraX, cameraY);
  drawWorldItems(cameraX, cameraY);

  requestAnimationFrame(gameLoop);
}

function drawBackground(cameraX, cameraY) {
  ctx.fillStyle = "#a8d5a2";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawGrass() {}
function drawFlowerPatches() {}

window.addEventListener("DOMContentLoaded", () => {
  const inventoryButton = document.getElementById("inventory-button");
  const inventoryPanel = document.getElementById("inventory-panel");
  const inventoryGrid = document.getElementById("inventory-grid");
  window.inventoryGrid = inventoryGrid;

  inventoryButton.addEventListener("click", () => {
    inventoryPanel.hidden = !inventoryPanel.hidden;
  });

  for (let i = 0; i < 40; i++) {
    const slot = document.createElement("div");
    slot.className = "inventory-slot";
    slot.dataset.filled = "false";
    slot.style.width = "40px";
    slot.style.height = "40px";
    slot.style.backgroundColor = "#555";
    slot.style.border = "1px solid #999";
    slot.style.borderRadius = "4px";
    slot.style.backgroundSize = "cover";
    slot.style.backgroundPosition = "center";
    inventoryGrid.appendChild(slot);
  }
});

function updateInventoryUI() {
  const slots = window.inventoryGrid?.children;
  if (!slots) return;

  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    const item = inventory[i];
    if (item) {
      slot.style.backgroundImage = `url(${item.icon})`;
      slot.style.backgroundSize = "cover";
      slot.style.backgroundPosition = "center";
            slot.dataset.filled = "true";
    } else {
      slot.style.backgroundImage = "none";
      slot.dataset.filled = "false";
    }
  }
}

// Socket event listeners
socket.on("connect", () => {
  console.log("Connected to server:", socket.id);
});

socket.on("init", data => {
  player.x = data.x;
  player.y = data.y;
  inventory = data.inventory || [];
  updateInventoryUI();
});

socket.on("inventoryUpdate", newInventory => {
  inventory = newInventory;
  updateInventoryUI();
});

socket.on("playerMoved", ({ id, x, y }) => {
  // Optional: render other players here
});

socket.on("playerDisconnected", id => {
  // Optional: remove disconnected player visuals
});
