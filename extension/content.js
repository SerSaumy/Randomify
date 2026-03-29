(() => {
  // extension/src/content.js
  var BTN_ID = "sts-true-random-btn";
  var TOAST_ID = "sts-toast";
  function getRuntime() {
    return globalThis.browser || globalThis.chrome;
  }
  function findAnchor() {
    const shuffle = document.querySelector('button[data-testid="control-button-shuffle"]');
    if (shuffle && shuffle.parentElement) {
      return shuffle.parentElement;
    }
    const bar = document.querySelector('[data-testid="control-bar"]') || document.querySelector('div[class*="player-controls"]');
    return bar || null;
  }
  function removeToast() {
    const t = document.getElementById(TOAST_ID);
    if (t) {
      t.remove();
    }
  }
  function showToast(message, variant) {
    removeToast();
    const el = document.createElement("div");
    el.id = TOAST_ID;
    el.setAttribute("role", "status");
    el.textContent = message;
    el.className = `sts-toast sts-toast-${variant || "info"}`;
    document.body.appendChild(el);
    window.setTimeout(() => {
      el.classList.add("sts-toast-fade");
      window.setTimeout(removeToast, 400);
    }, 4200);
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
  function createButton() {
    const btn = document.createElement("button");
    btn.id = BTN_ID;
    btn.type = "button";
    btn.className = "sts-true-random";
    btn.setAttribute("aria-label", "True Random");
    btn.title = "True Random \u2014 No Bias";
    const span = document.createElement("span");
    span.className = "sts-dice";
    span.setAttribute("aria-hidden", "true");
    span.textContent = String.fromCodePoint(127922);
    btn.appendChild(span);
    return btn;
  }
  function inject() {
    if (document.getElementById(BTN_ID)) {
      return;
    }
    const anchor = findAnchor();
    if (!anchor) {
      return;
    }
    const btn = createButton();
    btn.addEventListener("click", async () => {
      setButtonLoading(btn, true);
      try {
        const runtime = getRuntime();
        const res = await new Promise((resolve) => {
          runtime.runtime.sendMessage({ type: "TRUE_RANDOM_PLAY" }, resolve);
        });
        if (res?.ok) {
          const name = res.trackName || "Unknown track";
          showToast(`Now playing: ${name}`, "success");
        } else {
          showToast(res?.message || "Something went wrong.", "error");
        }
      } catch (e) {
        showToast("Extension could not reach the background worker.", "error");
      } finally {
        setButtonLoading(btn, false);
      }
    });
    const shuffle = anchor.querySelector('button[data-testid="control-button-shuffle"]');
    if (shuffle) {
      shuffle.insertAdjacentElement("afterend", btn);
    } else {
      anchor.appendChild(btn);
    }
  }
  var scheduled = null;
  function scheduleInject() {
    if (scheduled) {
      window.clearTimeout(scheduled);
    }
    scheduled = window.setTimeout(() => {
      scheduled = null;
      inject();
    }, 300);
  }
  var observer = new MutationObserver(() => {
    scheduleInject();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scheduleInject);
  } else {
    scheduleInject();
  }
})();
