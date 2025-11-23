export function setupUI() {
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

  document.addEventListener("keydown", e => {
    if (e.key === "x") toggleInventory();
  });
  document.getElementById("invToggle").onclick = toggleInventory;
}

function toggleInventory() {
  document.getElementById("inventory").classList.toggle("hidden");
}
