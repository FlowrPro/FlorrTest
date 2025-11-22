import { inventory, hotbar, renderInventory, renderHotbar, setSocket } from "./inventory.js";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// --- Fullscreen canvas setup ---
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas(); // initial call
window.addEventListener("resize", resizeCanvas);

let socket; // declare globally so other code can use it

function connectToGame() {
  const token = localStorage.getItem("sessionToken");
  const username = localStorage.getItem("username");

  if (!token || !username) {
    // Show homescreen (login/register panel stays visible)
    document.getElementById("homescreen").style.display = "block";
    return;
  }

  socket = io("https://florrtest-backend-1.onrender.com");

  // FIX: send both token and username
  socket.emit("auth", { token, username });

  socket.on("auth_success", (data) => {
    console.log("Authenticated as:", data.username);

    // Hide homescreen once authenticated
    document.getElementById("homescreen").style.display = "none";

    // Spawn player only after auth
    socket.emit("set_username", { username: data.username });

    // Pass socket into inventory system
    setSocket(socket);

    // --- Attach all socket listeners here ---
    socket.on("chat_message", ({ username, text }) => {
      const msg = document.createElement("div");
      msg.className = "chat-msg";
      msg.innerHTML = `<span class="chat-user">${username}:</span> ${text}`;
      chatMessages.appendChild(msg);
      chatMessages.scrollTop = chatMessages.scrollHeight;
      while (chatMessages.children.length > 6) {
        chatMessages.removeChild(chatMessages.firstChild);
      }
    });

    // … keep the rest of your listeners unchanged …
  });

  socket.on("auth_failed", () => {
    alert("Authentication failed. Please try again.");
    localStorage.removeItem("sessionToken");
    localStorage.removeItem("username");
    document.getElementById("homescreen").style.display = "block";
  });
}

    // World snapshot
    socket.on("world_snapshot", ({ world: w, self, players, items: its }) => {
      world = w;
      player = self || player;
      items = its;

      if (self) {
        inventory.splice(0, inventory.length, ...self.inventory);
        hotbar.splice(0, hotbar.length, ...self.hotbar);
        renderInventory();
        renderHotbar();
      }

      players.forEach(p => (otherPlayers[p.id] = p));
    });

    // Items update
    socket.on("items_update", its => { items = its; });

    // Inventory update
    socket.on("inventory_update", inv => {
      inventory.splice(0, inventory.length, ...inv);
      renderInventory();
    });

    // Hotbar update
    socket.on("hotbar_update", hb => {
      hotbar.splice(0, hotbar.length, ...hb);
      renderHotbar();
    });

    // Player update
    socket.on("player_update", p => {
      if (p.id === socket.id) {
        player.x = p.x;
        player.y = p.y;
        player.orbitAngle = p.orbitAngle;
        player.orbitDist = p.orbitDist;
        player.hotbar = [...p.hotbar];
        hotbar.splice(0, hotbar.length, ...p.hotbar);
        player.username = p.username;
      } else {
        otherPlayers[p.id] = p;
      }
    });

    // Join/leave
    socket.on("player_join", p => { otherPlayers[p.id] = p; });
    socket.on("player_leave", ({ id }) => { delete otherPlayers[id]; });

    // Death screen events
    socket.on("player_dead", () => {
      const deathScreen = document.getElementById("death-screen");
      deathScreen.classList.add("show");
      document.getElementById("gameCanvas").classList.add("blurred");
    });

    socket.on("respawn_success", () => {
      const deathScreen = document.getElementById("death-screen");
      deathScreen.classList.remove("show");
      document.getElementById("gameCanvas").classList.remove("blurred");
    });
  });

  socket.on("auth_failed", () => {
    alert("Authentication failed. Please try again.");
    localStorage.removeItem("sessionToken");
    localStorage.removeItem("username");
    document.getElementById("homescreen").style.display = "block";
  });
}

window.onload = connectToGame;

// --- CHAT SETUP ---
const chatInput = document.getElementById("chat-input");
const chatMessages = document.getElementById("chat-messages");

// Send message on Enter (when chat bar is visible)
chatInput.addEventListener("keydown", e => {
  if (e.key === "Enter" && chatInput.value.trim() !== "") {
    const text = chatInput.value.trim();
    if (socket) socket.emit("chat_message", { text });
    chatInput.value = "";
  }
});

let chatOpen = false;

// Toggle chat on Enter: open, type, Enter sends + closes
document.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    e.preventDefault(); // stop default form behavior
    if (!chatOpen) {
      chatInput.classList.remove("hidden");
      chatInput.focus();
      chatOpen = true;
    } else {
      const text = chatInput.value.trim();
      if (text !== "" && socket) {
        socket.emit("chat_message", { text });
        chatInput.value = "";
      }
      chatInput.blur();
      chatInput.classList.add("hidden");
      chatOpen = false;
    }
  }
});

// --- Player, world, camera, controls ---
let player = { 
  id: null, 
  x: 0, 
  y: 0, 
  radius: 20, 
  hotbar: [], 
  orbitAngle: 0,
  orbitDist: 56,
  leftHeld: false,
  rightHeld: false,
  username: null,
  health: 100
};

let orbitSpeed = 0.02;
let extendDist = 96;
let retractDist = 41;

// World defaults; server will provide width/height
let world = { centerX: 800, centerY: 450, mapRadius: 390, width: 1600, height: 900 };
let items = [];
let otherPlayers = {};

// --- Camera state ---
let cameraX = 0;
let cameraY = 0;
function updateCamera() {
  cameraX = player.x - canvas.width / 2;
  cameraY = player.y - canvas.height / 2;
}

// Mouse buttons
canvas.addEventListener("mousedown", e => {
  if (e.button === 0) player.leftHeld = true;
  if (e.button === 2) player.rightHeld = true;
});
canvas.addEventListener("mouseup", e => {
  if (e.button === 0) player.leftHeld = false;
  if (e.button === 2) player.rightHeld = false;
});
canvas.addEventListener("contextmenu", e => e.preventDefault());

// Inventory toggle
document.addEventListener("keydown", e => {
  if (e.key === "x") toggleInventory();
});
document.getElementById("invToggle").onclick = toggleInventory;

function toggleInventory() {
  document.getElementById("inventory").classList.toggle("hidden");
}

// Settings panel
const settingsBtn = document.getElementById("settings-btn");
const settingsPanel = document.getElementById("settings-panel");
const closeSettings = document.getElementById("close-settings");

settingsBtn.addEventListener("click", () => {
  const rect = settingsBtn.getBoundingClientRect();
  settingsPanel.style.top = `${rect.bottom + 8}px`;
  settingsPanel.style.left = `${rect.left}px`;
  settingsPanel.classList.toggle("show");
});

closeSettings.addEventListener("click", () => {
  settingsPanel.classList.remove("show");
});

// Tabs
const tabButtons = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");

tabButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    tabButtons.forEach(b => b.classList.remove("active"));
    tabContents.forEach(c => c.classList.add("hidden"));
    btn.classList.add("active");
    const tabId = "tab-" + btn.dataset.tab;
    document.getElementById(tabId).classList.remove("hidden");
  });
});

// Mouse movement toggle
let mouseMovementEnabled = false;

const toggleMouse = document.getElementById("toggle-mouse");
if (toggleMouse) {
  toggleMouse.addEventListener("change", (e) => {
    mouseMovementEnabled = e.target.checked;
  });
}

// --- Rarity assignment helper ---
function setSlotRarity(slotElement, rarity) {
  slotElement.classList.remove(
    "common","unusual","rare","epic","legendary","mythic","ultra"
  );
  slotElement.classList.add(rarity);
}

// Track mouse position
let mouseX = 0;
let mouseY = 0;
canvas.addEventListener("mousemove", (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

// Keyboard
const keys = {};
document.addEventListener("keydown", e => (keys[e.key] = true));
document.addEventListener("keyup", e => (keys[e.key] = false));

// --- Update / Game logic ---
function update() {
  // Skip update if player not yet spawned
  if (!player || !player.id) return;

  let dx = 0, dy = 0;

  if (mouseMovementEnabled) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const diffX = mouseX - centerX;
    const diffY = mouseY - centerY;
    const dist = Math.hypot(diffX, diffY);

    if (dist > 20) { // small deadzone
      dx = diffX / dist;
      dy = diffY / dist;
    }
  } else {
    if (keys["w"]) dy -= 1;
    if (keys["s"]) dy += 1;
    if (keys["a"]) dx -= 1;
    if (keys["d"]) dx += 1;
  }

  // Send movement if any
  if (dx !== 0 || dy !== 0) {
    if (socket) socket.emit("move", { dx, dy });
  }

  // Orbit distance controlled per player
  if (player.leftHeld) {
    player.orbitDist = extendDist;
  } else if (player.rightHeld) {
    player.orbitDist = retractDist;
  } else {
    player.orbitDist = 56;
  }

  if (socket) socket.emit("orbit_control", { orbitDist: player.orbitDist });

  // Item collisions
  items.forEach(item => {
    const dist = Math.hypot(player.x - item.x, player.y - item.y);
    if (dist < player.radius + item.radius) {
      if (socket) socket.emit("pickup_request", { itemId: item.id });
    }
  });

  updateCamera(); // update camera each frame
}

// --- Drawing ---
function drawPlayer(p) {
  // Body
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
  ctx.fillStyle = "orange";
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "yellow";
  ctx.stroke();

  // Username above player
  if (p.username) {
    ctx.fillStyle = "white";
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.fillText(p.username, p.x, p.y - p.radius - 10);
  }

  // Health bar above player
  if (typeof p.health === "number") {
    const barWidth = 40;
    const barHeight = 6;
    const x = p.x - barWidth / 2;
    const y = p.y + p.radius + 10;

    ctx.fillStyle = "black";
    ctx.fillRect(x, y, barWidth, barHeight);

    const healthPercent = Math.max(0, p.health) / 100;
    ctx.fillStyle = "lime";
    ctx.fillRect(x, y, barWidth * healthPercent, barHeight);

    ctx.strokeStyle = "white";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, barWidth, barHeight);
  }

  // Eyes: normal if alive, X's if dead
  if (p.health > 0) {
    const eyeOffsetX = p.radius * 0.4;
    const eyeOffsetY = p.radius * -0.3;
    const eyeRadiusX = p.radius * 0.15;
    const eyeRadiusY = p.radius * 0.25;

    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.ellipse(p.x - eyeOffsetX, p.y + eyeOffsetY, eyeRadiusX, eyeRadiusY, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(p.x + eyeOffsetX, p.y + eyeOffsetY, eyeRadiusX, eyeRadiusY, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(p.x - eyeOffsetX + eyeRadiusX * 0.4, p.y + eyeOffsetY - eyeRadiusY * 0.4, eyeRadiusX * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(p.x + eyeOffsetX + eyeRadiusX * 0.4, p.y + eyeOffsetY - eyeRadiusY * 0.4, eyeRadiusX * 0.3, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Draw X eyes when dead
    ctx.strokeStyle = "black";
    ctx.lineWidth = 3;
    const eyeOffsetX = p.radius * 0.4;
    const eyeOffsetY = p.radius * -0.3;
    const eyeSize = p.radius * 0.3;

    // Left X
    ctx.beginPath();
    ctx.moveTo(p.x - eyeOffsetX - eyeSize/2, p.y + eyeOffsetY - eyeSize/2);
    ctx.lineTo(p.x - eyeOffsetX + eyeSize/2, p.y + eyeOffsetY + eyeSize/2);
    ctx.moveTo(p.x - eyeOffsetX + eyeSize/2, p.y + eyeOffsetY - eyeSize/2);
    ctx.lineTo(p.x - eyeOffsetX - eyeSize/2, p.y + eyeOffsetY + eyeSize/2);
    ctx.stroke();

    // Right X
    ctx.beginPath();
    ctx.moveTo(p.x + eyeOffsetX - eyeSize/2, p.y + eyeOffsetY - eyeSize/2);
    ctx.lineTo(p.x + eyeOffsetX + eyeSize/2, p.y + eyeOffsetY + eyeSize/2);
    ctx.moveTo(p.x + eyeOffsetX + eyeSize/2, p.y + eyeOffsetY - eyeSize/2);
    ctx.lineTo(p.x + eyeOffsetX - eyeSize/2, p.y + eyeOffsetY + eyeSize/2);
    ctx.stroke();
  }

  // Smile or frown
  ctx.beginPath();
  const smileRadius = p.radius * 0.6;
  if (p.health > 0) {
    ctx.arc(p.x, p.y + p.radius * 0.2, smileRadius, 0.2 * Math.PI, 0.8 * Math.PI);
  } else {
    ctx.arc(p.x, p.y + p.radius * 0.5, smileRadius, 1.2 * Math.PI, 1.8 * Math.PI);
  }
  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Orbiting petals: only draw if alive and not reloading
  if (p.health > 0) {
    const equipped = p.hotbar.filter(i => i);
    if (equipped.length > 0) {
      const angleStep = (2 * Math.PI) / equipped.length;
      const now = Date.now();
      equipped.forEach((item, idx) => {
        if (item.reloadUntil && now < item.reloadUntil) return;

        const angle = p.orbitAngle + idx * angleStep;
        const baseX = p.x + (p.orbitDist || 56) * Math.cos(angle);
        const baseY = p.y + (p.orbitDist || 56) * Math.sin(angle);

        // Bounce animation: scale radius for 300ms after respawn
        let radius = 8;
        if (item.reloadUntil && now < item.reloadUntil + 300) {
          const t = (now - item.reloadUntil) / 300; // 0 → 1
          const bounce = Math.sin(t * Math.PI);     // smooth in/out
          radius = 8 + bounce * 4;                  // grow/shrink
        }

        ctx.beginPath();
        ctx.arc(baseX, baseY, radius, 0, Math.PI * 2);
        ctx.fillStyle = item.color || "cyan";
        ctx.fill();
      });
    }
  }
}

function draw() {
  ctx.setTransform(1, 0, 0, 1, 0, 0); // reset transform
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Apply camera offset for main world
  ctx.translate(-cameraX, -cameraY);

  // Background tint
  ctx.fillStyle = "rgba(0,128,0,0.25)";
  ctx.fillRect(0, 0, world.width || canvas.width, world.height || canvas.height);

  // Draw rectangular world
  ctx.fillStyle = "#2ecc71";
  ctx.fillRect(0, 0, world.width, world.height);

  ctx.strokeStyle = "#0f0";
  ctx.lineWidth = 3;
  ctx.strokeRect(0, 0, world.width, world.height);

  // --- Draw players/items in world ---
  if (player.id) {
    drawPlayer(player);
  }
  Object.values(otherPlayers).forEach(p => {
    drawPlayer(p);
  });

  items.forEach(item => {
    ctx.beginPath();
    ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
    ctx.fillStyle = item.color;
    ctx.fill();
  });

  // --- Minimap ---
  const mapWidth = 200;
  const mapHeight = 100;
  const margin = 20;
  const miniX = canvas.width - mapWidth - margin;
  const miniY = margin;

  ctx.setTransform(1, 0, 0, 1, 0, 0); // reset transform for minimap

  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(miniX, miniY, mapWidth, mapHeight);
  ctx.strokeStyle = "#fff";
  ctx.strokeRect(miniX, miniY, mapWidth, mapHeight);

  const scaleX = mapWidth / (world.width || 1);
  const scaleY = mapHeight / (world.height || 1);

  const dotX = miniX + (player.x || 0) * scaleX;
  const dotY = miniY + (player.y || 0) * scaleY;

  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(dotX, dotY, 4, 0, Math.PI * 2);
  ctx.fill();

  // Draw other players as smaller colored dots
  Object.values(otherPlayers).forEach(p => {
    const ox = miniX + p.x * scaleX;
    const oy = miniY + p.y * scaleY;
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(ox, oy, 3, 0, Math.PI * 2);
    ctx.fill();
  });
}

// --- Loop ---
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}
gameLoop();

// --- Respawn button ---
const respawnBtn = document.getElementById("respawn-btn");
if (respawnBtn) {
  respawnBtn.addEventListener("click", () => {
    if (socket) socket.emit("respawn_request");
  });
}


