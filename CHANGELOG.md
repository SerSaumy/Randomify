# Changelog

All notable changes to this project are documented in this file.

## v1.0.1

- Switch fully to zero-setup URL navigation + DOM auto-click architecture.
- Background now only builds a random search URL and opens/updates a Spotify tab.
- Content script watches search results with `MutationObserver`, chooses a random row, and clicks its play button with fallback events.
- Remove API/token/auth requirements; keep manifest permissions minimal (`tabs`, `scripting`, `storage`).

## v1.0.0

Initial release under the Randomify name.

- Chrome Manifest V3 and Firefox Manifest V2 builds
- 100% client-side DOM automation (no Spotify Web API, OAuth, PKCE, or backend server)
- Random search query generation with anti-repetition logic
- Content script auto-clicks a random Play button from Spotify search results
- Jest test suite for randomness and deduplication logic
- GitHub Releases publish `dist/randomify-chrome.zip` for easy download
