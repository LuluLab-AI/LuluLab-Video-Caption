#!/usr/bin/env bash
set -e

echo "Checking dependencies..."

node_bin="${LULULAB_NODE:-$(command -v node || true)}"
if [[ -z "$node_bin" ]] || ! "$node_bin" -e 'process.exit(Number(process.versions.node.split(".")[0]) >= 20 ? 0 : 1)' >/dev/null 2>&1; then
  echo "❌ Node.js 20+ not found. Install Node.js 20 or newer, or set LULULAB_NODE."
  exit 1
fi
if [[ ! -f "$(dirname "$0")/lululab_cli.mjs" ]]; then
  echo "❌ Bundled LuluLab CLI not found."
  exit 1
fi
echo "✅ Node.js found: $("$node_bin" --version)"

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "❌ FFmpeg not found. Install with: brew install ffmpeg"
  exit 1
else
  echo "✅ FFmpeg found: $(ffmpeg -version | head -n 1)"
fi

if ! command -v whisper >/dev/null 2>&1; then
  echo "❌ Whisper CLI not found. Install with: pip install -U openai-whisper"
  exit 1
else
  echo "✅ Whisper found: $(command -v whisper)"
fi

if ! python3 -c 'import cv2' >/dev/null 2>&1; then
  echo "⚠️  OpenCV not found. Burned-in subtitle removal requires: pip install opencv-python-headless"
else
  echo "✅ OpenCV found"
fi

echo "All dependencies are ready."
