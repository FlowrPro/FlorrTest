export const inventory = new Array(24).fill(null);
export const hotbar = new Array(10).fill(null);

const invEl = document.getElementById("inventory");
const hotbarEl = document.getElementById("hotbar");

let socket = null;
export function setSocket(s) {
  socket = s;
}

// Apply rarity class per slot (only when item exists)
function setSlotRarity(slotElement, rarity) {
  slotElement.classList.remove(
    "common","unusual","rare","epic","legendary","mythic","ultra"
  );
  if (rarity) slotElement.classList.add(rarity);
}

function makeIcon(item) {
  const icon = document.createElement("div");
  icon.className = "icon";
  if (item?.color) icon.style.background = item.color;

  // Tooltip with structured stats
  if (item) {
    const tooltip = document.createElement("div");
    tooltip.className = "tooltip";
    tooltip.innerHTML = `
  <div class="tooltip-title">${item.name}</div>
  <div class="tooltip-stat">Damage: <span>${item.damage}</span></div>
  <div class="tooltip-stat">Health: <span>${item.health}/${item.maxHealth}</span></div>
  <div class="tooltip-stat">Reload: <span>${(item.reload/1000).toFixed(1)}s</span></div>
  <div class="tooltip-stat">Rarity: <span>${item.rarity || "common"}</span></div>
  <div class="tooltip-desc">${item.description}</div>
`;
    icon.appendChild(tooltip);
  }

  return icon;
}

export function renderInventory() {
  invEl.innerHTML = "";
  inventory.forEach((item, i) => {
    const slot = document.createElement("div");
    slot.className = "slot";
    slot.dataset.index = i;
    slot.dataset.type = "inventory";

    // Always visible; apply rarity only if item present
    if (item) {
      slot.appendChild(makeIcon(item));
      setSlotRarity(slot, item.rarity);
    } else {
      setSlotRarity(slot, null); // ensure no leftover rarity class
    }

    slot.draggable = !!item;
    slot.ondragstart = e => {
      e.dataTransfer.setData("index", i);
      e.dataTransfer.setData("type", "inventory");
    };

    invEl.appendChild(slot);
  });
}

// Render hotbar slots with per-slot rarity
export function renderHotbar() {
  hotbarEl.innerHTML = "";
  hotbar.forEach((item, i) => {
    const slot = document.createElement("div");
    slot.className = "slot";
    slot.dataset.index = i;
    slot.dataset.type = "hotbar";

    // Always visible; apply rarity only if item present
    if (item) {
      slot.appendChild(makeIcon(item));
      setSlotRarity(slot, item.rarity);
    } else {
      setSlotRarity(slot, null); // ensure no leftover rarity class
    }

    slot.draggable = !!item;
    slot.ondragstart = e => {
      e.dataTransfer.setData("index", i);
      e.dataTransfer.setData("type", "hotbar");
    };
    slot.ondragover = e => e.preventDefault();
    slot.ondrop = e => {
      const fromIndex = e.dataTransfer.getData("index");
      const fromType = e.dataTransfer.getData("type");
      if (fromType === "inventory") {
        socket.emit("equip_request", { invIndex: parseInt(fromIndex), hotbarIndex: i });
      } else if (fromType === "hotbar") {
        // local swap between hotbar slots
        const temp = hotbar[i];
        hotbar[i] = hotbar[fromIndex];
        hotbar[fromIndex] = temp;
        renderHotbar();
      }
    };

    hotbarEl.appendChild(slot);
  });
}

// Container-level drop: unequip from hotbar back to inventory
invEl.ondragover = e => e.preventDefault();
invEl.ondrop = e => {
  const fromIndex = e.dataTransfer.getData("index");
  const fromType = e.dataTransfer.getData("type");
  if (fromType === "hotbar") {
    socket.emit("unequip_request", { hotbarIndex: parseInt(fromIndex) });
  }
};
