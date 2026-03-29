const TOAST_ID = 'sts-toast';

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

function removeAutoPlayFlag() {
  const url = new URL(window.location.href);
  url.searchParams.delete('randomify_auto_play');
  window.history.replaceState({}, document.title, url.toString());
}

function attemptAutoPlay() {
  let attempts = 0;
  const maxAttempts = 15; // Wait up to ~7.5 seconds

  const interval = setInterval(() => {
    attempts += 1;
    const trackRows = document.querySelectorAll('div[data-testid="tracklist-row"]');

    if (trackRows.length > 3) {
      clearInterval(interval);
      const randomIndex = Math.floor(Math.random() * trackRows.length);
      const selectedRow = trackRows[randomIndex];

      const playBtn = selectedRow.querySelector('button[data-testid="play-button"], button[aria-label^="Play"]');
      if (playBtn) {
        playBtn.click();
        showToast('Randomify: Playing track!');
      } else {
        const dblClickEvent = new MouseEvent('dblclick', { bubbles: true, cancelable: true, view: window });
        selectedRow.dispatchEvent(dblClickEvent);
        showToast('Randomify: Playing track!');
      }
    } else if (attempts >= maxAttempts) {
      clearInterval(interval);
      showToast('Randomify: Could not find tracks to play.');
    }
  }, 500);
}

function init() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('randomify_auto_play') === 'true') {
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
