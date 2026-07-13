#!/bin/sh

command -v xclip >/dev/null 2>&1 || { echo "no xclip"; exit 1; }

for format in image/png image/jpeg image/gif image/webp; do
  if xclip -selection clipboard -target "$format" -o >/dev/null 2>&1; then
    xclip -selection clipboard -target "$format" -o >"$1" 2>/dev/null
    echo "$1"
    exit 0
  fi
done

echo ""
