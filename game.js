const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const player = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  radius: 30,
  speed: 3,
  petals: 5,
};

const keys = {};
window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

function movePlayer() {
  if (keys['w']) player.y -= player.speed;
  if (keys['s']) player.y += player.speed;
  if (keys['a']) player.x -= player.speed;
  if (keys['d']) player.x += player.speed;
}

function drawPlayer() {
  ctx.save();
  ctx.translate(player.x, player.y);
  for (let i = 0; i < player.petals; i++) {
    const angle = (Math.PI * 2 / player.petals) * i;
    const px = Math.cos(angle) * 40;
    const py = Math.sin(angle) * 40;
    ctx.beginPath();
    ctx.arc(px, py, 15, 0, Math.PI * 2);
    ctx.fillStyle = '#fdfd96';
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(0, 0, 20, 0, Math.PI * 2);
  ctx.fillStyle = '#ffff00';
  ctx.fill();
  ctx.restore();
}

const flowers = [];
for (let i = 0; i < 10; i++) {
  flowers.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    radius: 25,
    color: '#ff4c4c',
  });
}

function drawFlowers() {
  flowers.forEach(flower => {
    ctx.beginPath();
    ctx.arc(flower.x, flower.y, flower.radius, 0, Math.PI * 2);
    ctx.fillStyle = flower.color;
    ctx.fill();
  });
}

function drawBackground() {
  ctx.fillStyle = '#1e402f';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function gameLoop() {
  drawBackground();
  movePlayer();
  drawPlayer();
  drawFlowers();
  requestAnimationFrame(gameLoop);
}

gameLoop();
