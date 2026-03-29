(() => {
  // extension/src/popup.js
  function getRuntime() {
    return globalThis.browser || globalThis.chrome;
  }
  function setStatus(text) {
    const el = document.getElementById("status");
    if (el) {
      el.textContent = text;
    }
  }
  async function refreshStatus() {
    const runtime = getRuntime();
    const res = await new Promise((resolve) => {
      runtime.runtime.sendMessage({ type: "GET_STATUS" }, resolve);
    });
    if (res?.ok && res.connected) {
      setStatus("Connected: tokens are stored in the extension.");
    } else {
      setStatus("Not connected: import a session from the local server.");
    }
  }
  document.getElementById("import")?.addEventListener("click", async () => {
    setStatus("Importing\u2026");
    const runtime = getRuntime();
    const res = await new Promise((resolve) => {
      runtime.runtime.sendMessage({ type: "IMPORT_SESSION" }, resolve);
    });
    if (res?.ok) {
      setStatus("Imported successfully.");
    } else {
      setStatus(res?.error || "Import failed. Is the server running on port 8888?");
    }
  });
  refreshStatus().catch(() => {
    setStatus("Could not read extension status.");
  });
})();
