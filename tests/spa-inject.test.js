/**
 * Simulated DOM lifecycle for the content script injection pattern.
 */

import { describe, test, expect } from '@jest/globals';
import { JSDOM } from 'jsdom';

describe('SPA style reinjection', () => {
  test('reinserts control after its anchor is replaced', async () => {
    const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
      pretendToBeVisual: true,
    });
    const { window } = dom;
    const { document } = window;

    const root = document.getElementById('root');
    const bar = document.createElement('div');
    bar.setAttribute('data-testid', 'control-bar');
    const shuffle = document.createElement('button');
    shuffle.setAttribute('data-testid', 'control-button-shuffle');
    bar.appendChild(shuffle);
    root.appendChild(bar);

    const inject = () => {
      if (document.getElementById('sts-test-btn')) {
        return;
      }
      const shuffleEl = document.querySelector('button[data-testid="control-button-shuffle"]');
      if (!shuffleEl?.parentElement) {
        return;
      }
      const btn = document.createElement('button');
      btn.id = 'sts-test-btn';
      shuffleEl.insertAdjacentElement('afterend', btn);
    };

    inject();
    expect(document.getElementById('sts-test-btn')).not.toBeNull();

    const nextBar = document.createElement('div');
    nextBar.setAttribute('data-testid', 'control-bar');
    const nextShuffle = document.createElement('button');
    nextShuffle.setAttribute('data-testid', 'control-button-shuffle');
    nextBar.appendChild(nextShuffle);
    root.replaceChild(nextBar, bar);

    inject();
    expect(document.getElementById('sts-test-btn')).not.toBeNull();
  });
});
