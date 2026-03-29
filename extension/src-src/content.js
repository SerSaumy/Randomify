/* global chrome */

const TOAST_ID = 'sts-toast';
const BTN_ID = 'sts-true-random-btn';
const BTN_FLOATING_ID = 'sts-true-random-floating-btn';
const MAX_AUTORETRY = 2;

function showToast(message) {
  const t = document.getElementById(TOAST_ID);
  if (t) t.remove();
  const el = document.createElement('div');
  el.id = TOAST_ID;
  el.textContent = message;
  el.style.cssText = [
    'position:fixed',
    'bottom:20px',
    'right:20px',
    'background:#1db954',
    'color:white',
    'padding:12px 24px',
    'border-radius:8px',
    'z-index:9999',
    'font-family:sans-serif',
    'font-weight:bold',
    'box-shadow:0 4px 12px rgba(0,0,0,0.5)',
  ].join('; ');
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

function findUiAnchor() {
  const shuffle = document.querySelector('button[data-testid="control-button-shuffle"]');
  if (shuffle?.parentElement) return shuffle.parentElement;
  return document.querySelector('[data-testid="control-bar"]') || document.querySelector('footer') || null;
}

function setButtonLoading(btn, loading) {
  if (loading) {
    btn.classList.add('sts-spin');
    btn.setAttribute('aria-busy', 'true');
  } else {
    btn.classList.remove('sts-spin');
    btn.removeAttribute('aria-busy');
  }
}

function createRandomifyButton() {
  const btn = document.createElement('button');
  btn.id = BTN_ID;
  btn.type = 'button';
  btn.className = 'sts-true-random';
  btn.setAttribute('aria-label', 'Randomify');
  btn.title = 'Randomify — True Random';
  const span = document.createElement('span');
  span.className = 'sts-dice';
  span.setAttribute('aria-hidden', 'true');
  span.textContent = String.fromCodePoint(0x1f3b2);
  btn.appendChild(span);
  return btn;
}

function ensureInjectedButton() {
  if (document.getElementById(BTN_ID) || document.getElementById(BTN_FLOATING_ID)) return;
  const anchor = findUiAnchor();

  const btn = createRandomifyButton();
  btn.addEventListener('click', () => {
    setButtonLoading(btn, true);
    showToast('Randomify: Searching...');
    chrome.runtime.sendMessage({ type: 'RANDOMIZE_AND_PLAY' }, (res) => {
      if (!res?.ok) showToast('Randomify: Failed to start.');
      setButtonLoading(btn, false);
    });
  });

  if (!anchor) {
    btn.id = BTN_FLOATING_ID;
    btn.classList.add('sts-floating');
    document.body.appendChild(btn);
    return;
  }

  const shuffle = anchor.querySelector?.('button[data-testid="control-button-shuffle"]');
  if (shuffle) shuffle.insertAdjacentElement('afterend', btn);
  else anchor.appendChild(btn);
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
    clientY: y,
  };
  const down = new PointerEvent('pointerdown', {
    ...opts,
    pointerId: 1,
    pointerType: 'mouse',
    isPrimary: true,
  });
  const up = new PointerEvent('pointerup', {
    ...opts,
    pointerId: 1,
    pointerType: 'mouse',
    isPrimary: true,
  });
  const click = new MouseEvent('click', opts);
  target.dispatchEvent(down);
  target.dispatchEvent(up);
  target.dispatchEvent(click);
}

function removeAutoPlayFlag() {
  const url = new URL(window.location.href);
  url.searchParams.delete('randomify_auto_play');
  window.history.replaceState({}, document.title, url.toString());
}

function attemptAutoPlay() {
  let done = false;
  const retries = Number(sessionStorage.getItem('randomify_retry') || '0');
  const observer = new MutationObserver(() => {
    if (done) return;
    const rows = [...document.querySelectorAll('div[data-testid="tracklist-row"]')];
    if (rows.length < 4) return;

    const selectedRow = rows[Math.floor(Math.random() * rows.length)];
    const playBtn = selectedRow.querySelector('button[data-testid="play-button"], button[aria-label^="Play"]');
    if (playBtn) {
      playBtn.click();
      window.setTimeout(() => {
        const aria = (playBtn.getAttribute('aria-label') || '').toLowerCase();
        if (!aria.includes('pause')) {
          clickWithFallback(playBtn);
        }
      }, 120);
      showToast('Randomify: Playing track!');
    } else {
      const dblClickEvent = new MouseEvent('dblclick', { bubbles: true, cancelable: true, view: window });
      selectedRow.dispatchEvent(dblClickEvent);
      showToast('Randomify: Playing track!');
    }

    done = true;
    observer.disconnect();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.setTimeout(() => {
    if (!done) {
      observer.disconnect();
      if (retries < MAX_AUTORETRY) {
        sessionStorage.setItem('randomify_retry', String(retries + 1));
        showToast('Randomify: No tracks found. Retrying...');
        chrome.runtime.sendMessage({ type: 'RANDOMIZE_AND_PLAY' });
      } else {
        sessionStorage.setItem('randomify_retry', '0');
        showToast('Randomify: No tracks found for this search.');
      }
    }
  }, 8000);
}

function init() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('randomify_auto_play') === 'true') {
    if (!sessionStorage.getItem('randomify_retry')) {
      sessionStorage.setItem('randomify_retry', '0');
    }
    removeAutoPlayFlag();
    showToast('Randomify: Searching...');
    attemptAutoPlay();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Keep the button mounted across Spotify SPA changes.
const injectObserver = new MutationObserver(() => {
  ensureInjectedButton();
});
injectObserver.observe(document.documentElement, { childList: true, subtree: true });

ensureInjectedButton();
