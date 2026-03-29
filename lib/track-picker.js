/**
 * Builds randomized Spotify search query strings for DOM-driven playback flow.
 */

import {
  pickUniform,
} from './randomness.js';

const QUERY_TEMPLATES = [
  'top hits',
  'viral songs',
  'popular songs',
  'today top hits',
  'indie pop',
  'chill vibes',
  'lofi beats',
  'summer hits',
  'party mix',
  'workout mix',
  'romantic songs',
  'throwback hits',
  'hip hop hits',
  'dance pop',
  'rock classics',
  'rnb hits',
  'focus music',
  'sleep music',
  'jazz vibes',
  'instrumental chill',
];

const ARTIST_SEEDS = [
  'the weeknd',
  'dua lipa',
  'billie eilish',
  'arijit singh',
  'taylor swift',
  'drake',
  'ed sheeran',
  'coldplay',
  'bruno mars',
  'ariana grande',
  'post malone',
  'shreya ghoshal',
];

/**
 * Returns a search query string for URL navigation.
 * @returns {string}
 */
export function buildRandomSearchQuery() {
  const mode = Math.random();
  if (mode < 0.65) {
    return pickUniform(QUERY_TEMPLATES);
  }
  return pickUniform(ARTIST_SEEDS);
}
