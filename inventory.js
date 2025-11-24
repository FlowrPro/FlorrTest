export const inventory = []; // now stores { item, count } objects
export const hotbar = new Array(10).fill(null);

const invEl = document.getElementById("inventory");
const hotbarEl = document.getElementById("hotbar");

let socket = null;
export function setSocket(s) {
  socket = s;
}

function setSlotRarity(slotElement, rarity) {
  slotElement.classList.remove(
    "common", "unusual", "rare", "epic", "legendary", "mythic", "ultra"
  );
  if (rarity) slotElement.classList.add(rarity);
}

function makeIcon(slot) {
  const { item, count } = slot;
  const icon = document.createElement("div");
  icon.className = "icon";

  // ✅ Scale size dynamically
  let size = 20;
  if (item.name === "Bone") {
    // Bone petals larger
    const sizeByRarity = { common: 28, rare: 32, epic: 36, legendary: 40 };
    size = sizeByRarity[item.rarity] || 28;
  }

  icon.style.width = `${size}px`;
  icon.style.height = `${size}px`;
  icon.style.position = "relative";

  if (item.image) {
    icon.style.background = `url(${item.image}) center/contain no-repeat`;
    icon.style.borderRadius = "0";
  } else {
    icon.style.background = item.color || "white";
    icon.style.borderRadius = "50%";
  }

  icon.style.boxShadow = "0 0 6px rgba(255,255,255,0.8)";

  const tooltip = document.createElement("div");
  tooltip.className = "tooltip";
  tooltip.innerHTML = `
    <div class="tooltip-title">${item.name}</div>
    <div class="tooltip-stat">Damage: <span>${item.damage}</span></div>
    <div class="tooltip-stat">Health: <span>${item.health}/${item.maxHealth}</span></div>
    <div class="tooltip-stat">Reload: <span>${(item.reload / 1000).toFixed(1)}s</span></div>
    <div class="tooltip-stat">Rarity: <span>${item.rarity || "common"}</span></div>
    <div class="tooltip-desc">${item.description}</div>
  `;
  if (item.name === "Bone") {
    tooltip.innerHTML += `<div class="tooltip-stat">Bonus: +50% max health per Bone</div>`;
  }
  icon.appendChild(tooltip);

  if (count > 1) {
    const badge = document.createElement("div");
    badge.className = "count-badge";
    badge.textContent = `x${count}`;
    icon.appendChild(badge);
  }

  return icon;
}

export function renderInventory() {
  invEl.innerHTML = "";
  inventory.forEach((slot, i) => {
    if (!slot) return;

    const { item, count } = slot;
    const el = document.createElement("div");
    el.className = "inventory-item";
    el.dataset.index = i;
    el.dataset.type = "inventory";

    el.appendChild(makeIcon(slot));
    setSlotRarity(el, item.rarity);

    el.draggable = true;
    el.ondragstart = e => {
      e.dataTransfer.setData("index", i);
      e.dataTransfer.setData("type", "inventory");
      const img = new Image();
      img.src =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAn0B9Z0QjJkAAAAASUVORK5CYII=";
      e.dataTransfer.setDragImage(img, 0, 0);
    };

    invEl.appendChild(el);
  });
}

export function renderHotbar() {
  hotbarEl.innerHTML = "";
  hotbar.forEach((item, i) => {
    const slot = document.createElement("div");
    slot.className = "slot";
    slot.dataset.index = i;
    slot.dataset.type = "hotbar";

    if (item) {
      slot.appendChild(makeIcon({ item, count: 1 }));
      setSlotRarity(slot, item.rarity);
    } else {
      setSlotRarity(slot, null);
    }

    slot.draggable = !!item;
    slot.ondragstart = e => {
      e.dataTransfer.setData("index", i);
      e.dataTransfer.setData("type", "hotbar");
      const img = new Image();
      img.src =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAn0B9Z0QjJkAAAAASUVORK5CYII=";
      e.dataTransfer.setDragImage(img, 0, 0);
    };
    slot.ondragover = e => e.preventDefault();
    slot.ondrop = e => {
      const fromIndex = e.dataTransfer.getData("index");
      const fromType = e.dataTransfer.getData("type");
      if (fromType === "inventory") {
        socket.emit("equip_request", { invIndex: parseInt(fromIndex), hotbarIndex: i });
      } else if (fromType === "hotbar") {
        const temp = hotbar[i];
        hotbar[i] = hotbar[fromIndex];
        hotbar[fromIndex] = temp;
        renderHotbar();
      }
    };

    hotbarEl.appendChild(slot);
  });
}

invEl.ondragover = e => e.preventDefault();
invEl.ondrop = e => {
  const fromIndex = e.dataTransfer.getData("index");
  const fromType = e.dataTransfer.getData("type");
  if (fromType === "hotbar") {
    const item = hotbar[fromIndex];
    if (item) {
      const existing = inventory.find(slot =>
        slot && slot.item.name === item.name && slot.item.rarity === item.rarity
      );
      if (existing) {
        existing.count += 1;
      } else {
        const emptyIdx = inventory.findIndex(s => s === null);
        if (emptyIdx !== -1) {
          inventory[emptyIdx] = { item: { ...item }, count: 1 };
        }
      }
      hotbar[fromIndex] = null;
      renderInventory();
      renderHotbar();
      socket.emit("unequip_request", { hotbarIndex: parseInt(fromIndex) });
    }
  }
};
