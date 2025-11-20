const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

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
  ctx.save();
  ctx.translate(-cameraX, -cameraY);

  // Faded outer area
  ctx.fillStyle = "#a8d5a2"; // same green, faded
  ctx.globalAlpha = 0.2;
  ctx.fillRect(cameraX, cameraY, canvas.width, canvas.height);
  ctx.globalAlpha = 1;

  // Garden-style radial gradient (light center, dark edge)
  const gradient = ctx.createRadialGradient(map.x, map.y, 0, map.x, map.y, map.radius);
  gradient.addColorStop(0, "#c8facc"); // light mint green
  gradient.addColorStop(1, "#7bbf7b"); // deeper garden green

  ctx.beginPath();
  ctx.arc(map.x, map.y, map.radius, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();

  // Clip to circle for grass and flowers
  ctx.clip();

  drawGrass(map.x, map.y, map.radius);
  drawFlowerPatches(map.x, map.y, map.radius);

  ctx.restore();
}
function drawGrass(cx, cy, radius) {
  const density = 800;
  for (let i = 0; i < density; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * radius;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;

    const length = 4 + Math.random() * 4;
    const angleOffset = (Math.random() - 0.5) * 0.5;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle + angleOffset) * length, y + Math.sin(angle + angleOffset) * length);
    ctx.strokeStyle = Math.random() < 0.5 ? "#4e944f" : "#3b7d3b";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}
function drawFlowerPatches(cx, cy, radius) {
  const patchCount = 15;
  for (let i = 0; i < patchCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * (radius - 50);
    const px = cx + Math.cos(angle) * r;
    const py = cy + Math.sin(angle) * r;

    drawFlowerPatch(px, py);
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
    ctx.rotate((Math.PI * 2) / petalCount);
    ctx.beginPath();
    ctx.ellipse(0, radius / 2, radius / 2, radius, 0, 0, Math.PI * 2);
    ctx.fillStyle = petalColor;
    ctx.fill();
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

  const cameraX = player.x - canvas.width / 2;
  const cameraY = player.y - canvas.height / 2;

  drawBackground(cameraX, cameraY);
  drawPlayer(cameraX, cameraY);

  requestAnimationFrame(gameLoop);
}

player.x = map.x;
player.y = map.y;
gameLoop();
