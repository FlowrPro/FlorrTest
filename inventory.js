// inventory.js
export const inventory = new Array(24).fill(null); // main inventory
export const hotbar = new Array(10).fill(null);    // hotbar slots

const invEl = document.getElementById("inventory");
const hotbarEl = document.getElementById("hotbar");

export function renderInventory() {
  invEl.innerHTML = "";
  inventory.forEach((item, i) => {
    const slot = document.createElement("div");
    slot.className = "slot";
    slot.textContent = item ? item.name : "";
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
    slot.textContent = item ? item.name : "";
    slot.dataset.index = i;
    slot.dataset.type = "hotbar";
    slot.ondragover = e => e.preventDefault();
    slot.ondrop = e => {
      const fromIndex = e.dataTransfer.getData("index");
      const fromType = e.dataTransfer.getData("type");
      if (fromType === "inventory") {
        const fromItem = inventory[fromIndex];
        if (fromItem) {
          hotbar[i] = fromItem;
          inventory[fromIndex] = null;
          renderInventory();
          renderHotbar();
        }
      }
    };
    hotbarEl.appendChild(slot);
  });
}

export function addItem(item) {
  const emptyIndex = inventory.findIndex(s => s === null);
  if (emptyIndex !== -1) {
    inventory[emptyIndex] = item;
    renderInventory();
    return true;
  }
  return false;
}
