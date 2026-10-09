#!/usr/bin/env bash
# Compress every GLB/GLTF in assets-src/ (or $1) into public/models/: meshopt geometry + WebP textures.
set -euo pipefail
SRC="${1:-assets-src}"
OUT="public/models"
mkdir -p "$OUT"
shopt -s nullglob

for f in "$SRC"/*.glb "$SRC"/*.gltf; do
  name="$(basename "${f%.*}")"
  npx gltf-transform optimize "$f" "$OUT/$name.glb" --compress meshopt --texture-compress webp --texture-size 2048
  echo "✓ $name.glb ($(du -h "$OUT/$name.glb" | cut -f1))"
done