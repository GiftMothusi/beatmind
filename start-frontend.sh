#!/bin/bash
cd "$(dirname "$0")/frontend"

if [ ! -d "node_modules" ]; then
  echo "❌  node_modules not found — run ./setup.sh first"; exit 1
fi

echo "🎵  BeatMind Frontend → http://localhost:3000"
npm start
