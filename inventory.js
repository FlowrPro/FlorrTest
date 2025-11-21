// inventory.js
export const inventory = new Array(18).fill(null); // full inventory
export const slots = new Array(5).fill(null);      // quick slots

const invEl = document.getElementById("inventory");
const slotsEl = document.getElementById("slots");

export function renderInventory() {
  invEl.innerHTML = "";
  inventory.forEach((item, i) => {
    const slot = document.createElement("div");
    slot.className = "slot";
    slot.textContent = item ? item.name : "";
    slot.draggable = !!item;
    slot.dataset.index = i;
    invEl.appendChild(slot);
  });
}

export function renderSlots() {
  slotsEl.innerHTML = "";
  slots.forEach((item, i) => {
    const slot = document.createElement("div");
    slot.className = "slot";
    slot.textContent = item ? item.name : "";
    slot.dataset.index = i;
    slot.dataset.type = "quick";
    slot.ondragover = e => e.preventDefault();
    slot.ondrop = e => {
      const fromIndex = e.dataTransfer.getData("index");
      const fromItem = inventory[fromIndex];
      if (fromItem) {
        slots[i] = fromItem;
        inventory[fromIndex] = null;
        renderInventory();
        renderSlots();
      }
    };
    slotsEl.appendChild(slot);
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

// Drag setup
export function enableDrag() {
  invEl.querySelectorAll(".slot").forEach(slot => {
    slot.ondragstart = e => {
      e.dataTransfer.setData("index", slot.dataset.index);
    };
  });
}
