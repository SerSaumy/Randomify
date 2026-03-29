(() => {
  // extension/src/popup.js
  function getRuntime() {
    return globalThis.browser || globalThis.chrome;
  }
  function qs(id) {
    return document.getElementById(id);
  }
  async function sendMessage(message) {
    const runtime = getRuntime();
    return new Promise((resolve) => {
      runtime.runtime.sendMessage(message, resolve);
    });
  }
  async function refreshLastQuery() {
    const status = qs("status");
    const last = qs("last-query");
    const res = await sendMessage({ type: "GET_LAST_QUERY" });
    if (!res?.ok) {
      status.textContent = "Ready.";
      last.textContent = "";
      return;
    }
    status.textContent = "Ready.";
    last.textContent = res.lastQuery ? `Last query: ${res.lastQuery}` : "";
  }
  qs("randomize")?.addEventListener("click", async () => {
    const btn = qs("randomize");
    const status = qs("status");
    btn.disabled = true;
    status.textContent = "Opening Spotify search...";
    try {
      const res = await sendMessage({ type: "RANDOMIZE_AND_PLAY" });
      if (res?.ok) {
        status.textContent = "Sent. Random search opened.";
        await refreshLastQuery();
      } else {
        status.textContent = res?.message || "Could not open Spotify.";
      }
    } catch {
      status.textContent = "Background worker not reachable.";
    } finally {
      btn.disabled = false;
    }
  });
  refreshLastQuery().catch(() => {
    const status = qs("status");
    status.textContent = "Ready.";
  });
})();
