function renderShortcut(shortcut) {
  return String(shortcut || "Not set")
    .replaceAll("Command", "⌘")
    .replaceAll("MacCtrl", "⌃")
    .replaceAll("Ctrl", "⌃")
    .replaceAll("Shift", "⇧")
    .replaceAll("Option", "⌥")
    .replaceAll("Alt", "⌥")
    .replaceAll("+", " ");
}

try {
  const response = await chrome.runtime.sendMessage({ type: "qa-get-shortcuts" });
  if (!response?.ok) throw new Error(response?.error || "Shortcut settings are unavailable.");
  document.querySelector("#capture-shortcut").textContent = renderShortcut(response.result.capture);
  document.querySelector("#note-shortcut").textContent = renderShortcut(response.result.note);
} catch (error) {
  document.querySelector("#capture-shortcut").textContent = "Unavailable";
  document.querySelector("#note-shortcut").textContent = "Unavailable";
  document.querySelector("#settings-status").textContent = error instanceof Error ? error.message : "Could not read Chrome shortcut settings.";
}

document.querySelector("#configure").addEventListener("click", () => {
  void chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
});
