#!/bin/bash
cd "$(dirname "$0")/backend"

if [ ! -d "venv" ]; then
  echo "❌  venv not found — run ./setup.sh first"; exit 1
fi

if [ ! -f ".env" ]; then
  echo "❌  backend/.env not found — copy .env.example and add your ANTHROPIC_API_KEY"; exit 1
fi

if grep -q "your_api_key_here" .env; then
  echo "❌  Please set your ANTHROPIC_API_KEY in backend/.env"; exit 1
fi

echo "🎵  BeatMind Backend → http://localhost:5000"
source venv/bin/activate
python app.py
