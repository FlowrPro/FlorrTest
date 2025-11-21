export const inventory = new Array(24).fill(null);
export const hotbar = new Array(10).fill(null);

const invEl = document.getElementById("inventory");
const hotbarEl = document.getElementById("hotbar");

let socket = null;
export function setSocket(s) {
  socket = s;
}

function makeIcon(item) {
  const icon = document.createElement("div");
  icon.className = "icon";
  if (item?.color) icon.style.background = item.color;

  // Tooltip with stats
  if (item) {
    const tooltip = document.createElement("div");
    tooltip.className = "tooltip";
    tooltip.innerText =
      `${item.name}\nDamage: ${item.damage}\nHealth: ${item.health}\n${item.description}`;
    icon.appendChild(tooltip);
  }

  return icon;
}

export function renderInventory() {
  invEl.innerHTML = "";
  inventory.forEach((item, i) => {
    const slot = document.createElement("div");
    slot.className = "slot";
    if (item) slot.appendChild(makeIcon(item));
    slot.draggable = !!item;
    slot.dataset.index = i;
    slot.dataset.type = "inventory";
    slot.ondragstart = e => {
      e.dataTransfer.setData("index", i);
      e.dataTransfer.setData("type", "inventory");
    };
    invEl.appendChild(slot);
  });
}

export function renderHotbar() {
  hotbarEl.innerHTML = "";
  hotbar.forEach((item, i) => {
    const slot = document.createElement("div");
    slot.className = "slot";
    if (item) slot.appendChild(makeIcon(item));
    slot.dataset.index = i;
    slot.dataset.type = "hotbar";
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
        hotbar[i] = hotbar[fromIndex];
        hotbar[fromIndex] = null;
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
    socket.emit("unequip_request", { hotbarIndex: parseInt(fromIndex) });
  }
};
