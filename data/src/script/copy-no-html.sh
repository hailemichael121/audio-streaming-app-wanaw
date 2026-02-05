#!/bin/bash

SRC="$1"
DEST="${2:-jsons}"

if [ -z "$SRC" ]; then
  echo "Usage: ./copy-no-html.sh <source-dir> [dest-dir]"
  exit 1
fi

# Absolute paths
SRC="$(cd "$SRC" && pwd)"
DEST="$(mkdir -p "$DEST" && cd "$DEST" && pwd)"

# Recreate directory structure (SKIP root dir)
find "$SRC" -mindepth 1 -type d | while read -r dir; do
  rel="${dir#$SRC/}"
  mkdir -p "$DEST/$rel"
done

# Copy files except .html
find "$SRC" -type f ! -name "*.html" | while read -r file; do
  rel="${file#$SRC/}"
  mkdir -p "$DEST/$(dirname "$rel")"
  cp "$file" "$DEST/$rel"
done

echo "✔ Recursively copied from '$SRC' to '$DEST' (HTML omitted, no dummy dirs)"

# usage:  ./copy-no-html.sh ../html/ jsons 