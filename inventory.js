// inventory.js
const inventoryEl = document.getElementById("inventory");
export const inventory = new Array(10).fill(null);

export function renderInventory() {
  inventoryEl.innerHTML = "";
  inventory.forEach((item, i) => {
    const slot = document.createElement("div");
    slot.className = "slot";
    slot.textContent = item ? item.name : "";
    inventoryEl.appendChild(slot);
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
