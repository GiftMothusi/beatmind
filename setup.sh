#!/bin/bash
set -e

echo ""
echo "🎵  BeatMind Setup"
echo "─────────────────────────────────────"

# Check Node
if ! command -v node &>/dev/null; then
  echo "❌  Node.js not found. Install from https://nodejs.org (v18+)"; exit 1
fi
echo "✅  Node $(node -v)"

# Check Python
if ! command -v python3 &>/dev/null; then
  echo "❌  Python 3 not found. Install from https://python.org"; exit 1
fi
echo "✅  Python $(python3 --version)"

# Check .env
if [ ! -f "backend/.env" ]; then
  if [ -f "backend/.env.example" ]; then
    cp backend/.env.example backend/.env
    echo ""
    echo "⚠️   Created backend/.env from template."
    echo "    Open backend/.env and set your ANTHROPIC_API_KEY before starting."
    echo ""
  fi
fi

# Backend
echo "📦  Installing Python dependencies..."
cd backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip -q
pip install -r requirements.txt -q
deactivate
cd ..

# Frontend
echo "📦  Installing Node dependencies..."
cd frontend
npm install --legacy-peer-deps
cd ..

echo ""
echo "✅  Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Edit backend/.env and add your ANTHROPIC_API_KEY"
echo "  2. In one terminal:  ./start-backend.sh"
echo "  3. In another:       ./start-frontend.sh"
echo "  4. Open:             http://localhost:3000"
echo ""
