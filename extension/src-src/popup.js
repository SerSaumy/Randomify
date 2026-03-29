/* global chrome */
document.getElementById('randomize').addEventListener('click', async () => {
  const btn = document.getElementById('randomize');
  const status = document.getElementById('status');
  btn.disabled = true;
  status.textContent = 'Opening Spotify...';

  chrome.runtime.sendMessage({ type: 'RANDOMIZE_AND_PLAY' }, (response) => {
    if (response && response.ok) {
      window.close(); // Close popup when done
    } else {
      status.textContent = 'Failed to open Spotify.';
      btn.disabled = false;
    }
  });
});
