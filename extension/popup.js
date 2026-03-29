(() => {
  // extension/src/popup.js
  function getRuntime() {
    return globalThis.browser || globalThis.chrome;
  }
  var LOGIN_URL = "http://localhost:8888/login";
  function qs(id) {
    return document.getElementById(id);
  }
  function setVisible(el, on) {
    if (!el) return;
    el.classList.toggle("hidden", !on);
  }
  async function sendMessage(msg) {
    const runtime = getRuntime();
    return new Promise((resolve) => {
      runtime.runtime.sendMessage(msg, resolve);
    });
  }
  function renderStatus(res) {
    const loading = qs("state-loading");
    const connected = qs("state-connected");
    const disconnected = qs("state-disconnected");
    const playActivity = qs("play-activity");
    const headerSpinner = qs("header-spinner");
    if (!res?.ok) {
      setVisible(loading, false);
      setVisible(connected, false);
      setVisible(disconnected, true);
      setVisible(playActivity, false);
      return;
    }
    setVisible(loading, false);
    const showConnected = res.connected === true;
    setVisible(connected, showConnected);
    setVisible(disconnected, !showConnected);
    if (showConnected) {
      const nameEl = qs("account-name");
      if (res.displayName) {
        nameEl.textContent = res.displayName;
        nameEl.classList.remove("hidden");
      } else {
        nameEl.textContent = "";
        nameEl.classList.add("hidden");
      }
      const lastEl = qs("last-track");
      if (res.lastTrack) {
        lastEl.textContent = `Last played: ${res.lastTrack}`;
        lastEl.classList.remove("hidden");
      } else {
        lastEl.textContent = "";
        lastEl.classList.add("hidden");
      }
    }
    const pending = res.playPending === true;
    setVisible(playActivity, pending);
    if (headerSpinner) {
      headerSpinner.classList.toggle("spinning", pending);
    }
  }
  async function refreshStatus() {
    const res = await sendMessage({ type: "GET_STATUS" });
    renderStatus(res);
  }
  function wireStorageListener() {
    const runtime = getRuntime();
    try {
      runtime.storage.onChanged.addListener(() => {
        refreshStatus().catch(() => {
        });
      });
    } catch {
    }
  }
  function openLogin() {
    const runtime = getRuntime();
    if (runtime.tabs?.create) {
      runtime.tabs.create({ url: LOGIN_URL });
      return;
    }
    globalThis.open(LOGIN_URL, "_blank", "noopener,noreferrer");
  }
  qs("connect")?.addEventListener("click", openLogin);
  qs("reauth")?.addEventListener("click", openLogin);
  wireStorageListener();
  refreshStatus().catch(() => {
    renderStatus({ ok: false });
  });
})();
