const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

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
  // Faded outer area
  ctx.fillStyle = "#a8d5a2";
  ctx.globalAlpha = 0.2;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalAlpha = 1;

  // Garden-style gradient fixed to map center
  const gradient = ctx.createRadialGradient(map.x - cameraX, map.y - cameraY, 0, map.x - cameraX, map.y - cameraY, map.radius);
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
  ctx.save();
  ctx.translate(player.x - cameraX, player.y - cameraY);
  ctx.rotate(player.angle);
  if (player.sprite) {
    ctx.drawImage(player.sprite, -player.radius, -player.radius, player.radius * 2, player.radius * 2);
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#ff0";
    ctx.fill();
  }
  ctx.restore();
}

function gameLoop() {
  updatePlayer();

  const cameraX = player.x - canvas.width / (window.devicePixelRatio || 1) / 2;
  const cameraY = player.y - canvas.height / (window.devicePixelRatio || 1) / 2;

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
