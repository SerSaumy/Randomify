# Contributing

Thank you for improving Randomify. This document describes how we expect changes to be proposed and reviewed.

## Principles

- Keep changes focused on the described problem. Avoid unrelated refactors in the same pull request.
- Match existing formatting and naming. Run `npm run lint` before you submit.
- Add or update tests when behavior changes. Prefer unit tests in `tests/` for pure logic.

## Workflow

1. Fork the repository and create a feature branch from `main`.
2. Implement the change with clear commit messages written as full sentences.
3. Run `npm test` and `npm run lint`.
4. Open a pull request that explains the user impact and any tradeoffs you considered.

## Releases (maintainers)

We publish a downloadable zip for Chrome as a GitHub Release asset.

- **Tag format**: `vX.Y.Z` (for example `v1.0.1`)
- **What happens**: CI builds and uploads `dist/randomify-chrome.zip` to the Release
- **Local check**: run `npm run build` and verify `dist/randomify-chrome.zip` exists

## Security

Never commit real `.env` files, keys, or other secrets. Randomify does not require Spotify developer credentials or tokens.

## Code review

Maintainers may request tests, documentation updates, or smaller pull requests. Please keep discussion technical and respectful.
