# 🎵 BeatMind — AI Beat Studio

A prompt-driven AI beat builder. Describe a vibe, watch your beat animate to life, then refine it conversationally. Powered by Claude AI, built with React + Python Flask.

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18+ → https://nodejs.org
- **Python** 3.9+
- **Anthropic API key** → https://console.anthropic.com

### 1. Run setup
```bash
chmod +x setup.sh start-backend.sh start-frontend.sh
./setup.sh
```

### 2. Add your API key
```bash
# Edit backend/.env
ANTHROPIC_API_KEY=sk-ant-...your key here...
```

### 3. Start both servers (two terminals)
```bash
# Terminal 1
./start-backend.sh

# Terminal 2
./start-frontend.sh
```

### 4. Open http://localhost:3000 🎉

---

## 🎛 How to Use

| Action | How |
|--------|-----|
| Generate a beat | Type a description and hit **Generate Beat** |
| Quick genre | Click any genre button (Trap, Lo-Fi, House, etc.) |
| Refine your beat | Type follow-up prompts — "make it darker", "faster hi-hats" |
| Toggle steps manually | Click any step in the grid |
| Play / Stop | Header play button or adjust BPM slider |
| AI Fix | Hit **AI Fix Beat** to auto-improve the pattern |
| Ask a question | Type in **Ask AI** — learn music theory as you go |
| Save | Hit **Save**, reload from **Library** |
| Export | Download as **.mid** MIDI file |

---

## 🗂 Project Structure

```
beatmind/
├── backend/
│   ├── app.py              Flask API (5 endpoints)
│   ├── music_engine.py     MIDI generation + beat analysis
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.js          Main app + Tone.js audio engine
│   │   └── components/
│   │       ├── Header.js         Transport controls, BPM, save/export
│   │       ├── Sequencer.js      16-step animated beat grid
│   │       ├── PromptPanel.js    AI prompt input + history
│   │       ├── GenreSelector.js  Quick genre buttons
│   │       ├── TrackControls.js  Per-track volume sliders
│   │       └── AIInsightPanel.js AI Fix + theory explanations
│   └── package.json
├── setup.sh
├── start-backend.sh
├── start-frontend.sh
└── README.md
```

---

## 💡 Prompt Tips

The more specific, the better:
- ✅ `"jazzy lofi, 85bpm, vinyl crackle, minor pentatonic melody"`
- ✅ `"aggressive UK drill, dark, sliding 808s, 140bpm"`
- ✅ `"afrobeats meets house, 120bpm, percussive and groovy"`
- ❌ `"cool beat"` — too vague

Refinement prompts that work well:
- `"the kick is too busy — simplify it"`
- `"add more energy to the hi-hats"`
- `"make the melody more melodic"`
- `"shift the snare to beat 2 and 4"`

---

## 🔧 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/generate` | Generate beat from prompt |
| `POST` | `/api/refine` | Refine existing beat |
| `POST` | `/api/ai-fix` | Auto-fix beat quality |
| `POST` | `/api/explain` | Answer music theory question |
| `POST` | `/api/export-midi` | Download beat as MIDI |
| `GET`  | `/api/genres` | Genre presets |
| `GET`  | `/api/health` | Health check |

---

Built with React · Flask · Tone.js · Claude AI
