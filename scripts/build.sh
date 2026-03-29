#!/usr/bin/env bash
set -euo pipefail
TARGET="${1:-chrome}"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
node "$DIR/build.mjs" "$TARGET"
