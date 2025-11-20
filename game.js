const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const keys = {};
window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

const map = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  radius: 800
};

const player = {
  x: map.x,
  y: map.y,
  radius: 20,
  speed: 3,
  angle: 0,
  sprite: null
};

function loadSprite() {
  const img = new Image();
  img.src = "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Simple_flower_icon.svg/1024px-Simple_flower_icon.svg.png"; // Placeholder flower
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

  player.angle = Math.atan2(dy, dx);
}

function drawMap() {
  ctx.beginPath();
  ctx.arc(map.x, map.y, map.radius, 0, Math.PI * 2);
  ctx.fillStyle = "#444";
  ctx.fill();
  ctx.strokeStyle = "#888";
  ctx.lineWidth = 5;
  ctx.stroke();
}

function drawPlayer() {
  if (player.sprite) {
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);
    ctx.drawImage(player.sprite, -player.radius, -player.radius, player.radius * 2, player.radius * 2);
    ctx.restore();
  } else {
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#ff0";
    ctx.fill();
  }
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawMap();
  updatePlayer();
  drawPlayer();
  requestAnimationFrame(gameLoop);
}

gameLoop();
