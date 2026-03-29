(() => {
  // extension/src-src/content.js
  var TOAST_ID = "sts-toast";
  var BTN_ID = "sts-true-random-btn";
  function showToast(message) {
    const t = document.getElementById(TOAST_ID);
    if (t) t.remove();
    const el = document.createElement("div");
    el.id = TOAST_ID;
    el.textContent = message;
    el.style.cssText = [
      "position:fixed",
      "bottom:20px",
      "right:20px",
      "background:#1db954",
      "color:white",
      "padding:12px 24px",
      "border-radius:8px",
      "z-index:9999",
      "font-family:sans-serif",
      "font-weight:bold",
      "box-shadow:0 4px 12px rgba(0,0,0,0.5)"
    ].join("; ");
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 4e3);
  }
  function findUiAnchor() {
    const shuffle = document.querySelector('button[data-testid="control-button-shuffle"]');
    if (shuffle?.parentElement) return shuffle.parentElement;
    return document.querySelector('[data-testid="control-bar"]') || document.querySelector("footer") || null;
  }
  function setButtonLoading(btn, loading) {
    if (loading) {
      btn.classList.add("sts-spin");
      btn.setAttribute("aria-busy", "true");
    } else {
      btn.classList.remove("sts-spin");
      btn.removeAttribute("aria-busy");
    }
  }
  function createRandomifyButton() {
    const btn = document.createElement("button");
    btn.id = BTN_ID;
    btn.type = "button";
    btn.className = "sts-true-random";
    btn.setAttribute("aria-label", "Randomify");
    btn.title = "Randomify \u2014 True Random";
    const span = document.createElement("span");
    span.className = "sts-dice";
    span.setAttribute("aria-hidden", "true");
    span.textContent = String.fromCodePoint(127922);
    btn.appendChild(span);
    return btn;
  }
  function ensureInjectedButton() {
    if (document.getElementById(BTN_ID)) return;
    const anchor = findUiAnchor();
    if (!anchor) return;
    const btn = createRandomifyButton();
    btn.addEventListener("click", async () => {
      setButtonLoading(btn, true);
      showToast("Randomify: Searching...");
      chrome.runtime.sendMessage({ type: "RANDOMIZE_AND_PLAY" }, (res) => {
        if (!res?.ok) showToast("Randomify: Failed to start.");
        setButtonLoading(btn, false);
      });
    });
    const shuffle = anchor.querySelector?.('button[data-testid="control-button-shuffle"]');
    if (shuffle) shuffle.insertAdjacentElement("afterend", btn);
    else anchor.appendChild(btn);
  }
  function sendToBackground(message) {
    try {
      chrome.runtime.sendMessage(message);
    } catch {
    }
  }
  function isPausedPlayButton(btn) {
    const aria = (btn.getAttribute("aria-label") || "").toLowerCase();
    return aria.startsWith("play");
  }
  function clickWithFallback(target) {
    const rect = target.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const opts = {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: x,
      clientY: y
    };
    const down = new PointerEvent("pointerdown", {
      ...opts,
      pointerId: 1,
      pointerType: "mouse",
      isPrimary: true
    });
    const up = new PointerEvent("pointerup", {
      ...opts,
      pointerId: 1,
      pointerType: "mouse",
      isPrimary: true
    });
    const click = new MouseEvent("click", opts);
    target.dispatchEvent(down);
    target.dispatchEvent(up);
    target.dispatchEvent(click);
  }
  function detectAdOrLimit() {
    const text = (document.body?.innerText || "").toLowerCase();
    const adDetected = text.includes("advertisement") || text.includes("ad break");
    const limitDetected = text.includes("daily limit") || text.includes("on-demand") || text.includes("can only play") || text.includes("shuffle") && text.includes("free");
    return { adDetected, limitDetected };
  }
  function setMutedForAd(muted) {
    const tabId = Number(new URLSearchParams(window.location.search).get("randomify_tab_id"));
    if (Number.isFinite(tabId)) {
      sendToBackground({ type: "RANDOMIFY_TAB_MUTE", tabId, muted });
    }
  }
  function removeAutoPlayFlag() {
    const url = new URL(window.location.href);
    url.searchParams.delete("randomify_auto_play");
    window.history.replaceState({}, document.title, url.toString());
  }
  function attemptAutoPlay() {
    let done = false;
    let mutedForAd = false;
    function tick() {
      if (done) return;
      const { adDetected, limitDetected } = detectAdOrLimit();
      if (adDetected && !mutedForAd) {
        mutedForAd = true;
        setMutedForAd(true);
      } else if (!adDetected && mutedForAd) {
        mutedForAd = false;
        setMutedForAd(false);
      }
      if (limitDetected) {
        done = true;
        showToast("Randomify: Free limit reached. Can't force on-demand play.");
        sendToBackground({ type: "RANDOMIFY_DAILY_LIMIT" });
        return;
      }
      const playBtn = document.querySelector('[data-testid="play-button"]');
      if (playBtn && isPausedPlayButton(playBtn)) {
        done = true;
        clickWithFallback(playBtn);
        showToast("Randomify: Playing track!");
        return;
      }
      window.setTimeout(tick, 500);
    }
    tick();
  }
  function init() {
    const params = new URLSearchParams(window.location.search);
    if (params.get("randomify_auto_play") === "true") {
      removeAutoPlayFlag();
      showToast("Randomify: Searching...");
      attemptAutoPlay();
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
  chrome.runtime?.onMessage?.addListener((message, _sender, sendResponse) => {
    if (message?.type === "RANDOMIFY_PING") {
      sendResponse({ ok: true, ts: Date.now() });
      return false;
    }
    return false;
  });
  var injectObserver = new MutationObserver(() => {
    ensureInjectedButton();
  });
  injectObserver.observe(document.documentElement, { childList: true, subtree: true });
  ensureInjectedButton();
})();
