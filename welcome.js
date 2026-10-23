document.querySelector("#app-version").textContent = `Spottr ${chrome.runtime.getManifest().version}`;
document.querySelector("#configure-shortcuts").addEventListener("click", async () => {
  try {
    await chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
  } catch {
    document.querySelector("#shortcut-status").textContent = "Could not open shortcut settings. Open chrome://extensions/shortcuts in Chrome to configure them.";
  }
});
