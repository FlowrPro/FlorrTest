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

  // Draw faded outer area
  ctx.fillStyle = "#0f6";
  ctx.globalAlpha = 0.2;
  ctx.fillRect(cameraX, cameraY, canvas.width, canvas.height);
  ctx.globalAlpha = 1;

  // Draw realistic grass gradient inside circle
  const gradient = ctx.createRadialGradient(map.x, map.y, map.radius * 0.2, map.x, map.y, map.radius);
  gradient.addColorStop(0, "#3fa34d"); // lighter center
  gradient.addColorStop(1, "#2e7d32"); // darker edge

  ctx.beginPath();
  ctx.arc(map.x, map.y, map.radius, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
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
