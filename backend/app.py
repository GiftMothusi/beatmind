from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import anthropic
import json
import io
import os
from dotenv import load_dotenv
from music_engine import generate_beat_from_params, midi_to_base64, analyze_beat_quality

load_dotenv()

app = Flask(__name__)
CORS(app)

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

SYSTEM_PROMPT = """You are BeatMind, an AI music production assistant. You help users create beats and understand music theory.

When generating or modifying beats, you must respond with ONLY a valid JSON object — no preamble, no explanation outside the JSON. The JSON must contain:
{
  "beat": {
    "bpm": <number 60-180>,
    "name": "<creative beat name>",
    "description": "<1-2 sentence description>",
    "key": "<musical key e.g. C minor, F# major>",
    "tracks": [
      {
        "id": "<track id>",
        "name": "<instrument name>",
        "color": "<hex color>",
        "steps": [<16 boolean values true/false>],
        "volume": <0.0-1.0>
      }
    ]
  },
  "explanation": "<friendly explanation of what was created and why it works musically — 2-3 sentences, no jargon>",
  "theory_tip": "<one interesting music theory insight about this beat — plain English>"
}

Always include exactly these 6 tracks in this order: kick, snare, hihat_closed, hihat_open, bass, melody.
Track IDs must be exactly: kick, snare, hihat_closed, hihat_open, bass, melody.
Each steps array must have exactly 16 boolean values.

For melody and bass, use steps sparingly (3-6 active steps) to create musical phrases.
For kick/snare follow genre conventions. For hihats create interesting rhythmic patterns.

Colors to use (fixed, always use these):
- kick: #FF4757
- snare: #FFA502
- hihat_closed: #2ED573
- hihat_open: #1E90FF
- bass: #A855F7
- melody: #FF6B9D

Be encouraging, fun, and educational. Always make the beat sound good for the genre requested.
CRITICAL: Return ONLY the JSON object. No markdown, no code blocks, no extra text."""


@app.route('/api/generate', methods=['POST'])
def generate_beat():
    data = request.json
    prompt = data.get('prompt', '')
    conversation_history = data.get('history', [])

    messages = conversation_history + [{"role": "user", "content": f"Generate a beat: {prompt}"}]

    try:
        response = client.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=2000,
            system=SYSTEM_PROMPT,
            messages=messages
        )

        content = response.content[0].text.strip()
        # Strip markdown code blocks if present
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        content = content.strip()

        result = json.loads(content)
        return jsonify(result)
    except json.JSONDecodeError as e:
        return jsonify({"error": f"JSON parse error: {str(e)}", "raw": content}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/refine', methods=['POST'])
def refine_beat():
    data = request.json
    prompt = data.get('prompt', '')
    current_beat = data.get('current_beat', {})
    conversation_history = data.get('history', [])

    messages = conversation_history + [{
        "role": "user",
        "content": f"Current beat: {json.dumps(current_beat)}\n\nUser request: {prompt}\n\nModify this beat based on the request. Return the full updated beat JSON."
    }]

    try:
        response = client.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=2000,
            system=SYSTEM_PROMPT,
            messages=messages
        )

        content = response.content[0].text.strip()
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        content = content.strip()

        result = json.loads(content)
        return jsonify(result)
    except json.JSONDecodeError as e:
        return jsonify({"error": f"JSON parse error: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/ai-fix', methods=['POST'])
def ai_fix():
    data = request.json
    current_beat = data.get('beat', {})

    fix_prompt = f"""Analyse this beat and fix any musical issues to make it sound better:
{json.dumps(current_beat)}

Look for: off-beat patterns, too sparse/dense patterns, genre inconsistencies, poor groove.
Fix the issues and return the improved beat JSON with a clear explanation of what you changed."""

    try:
        response = client.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=2000,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": fix_prompt}]
        )

        content = response.content[0].text.strip()
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        content = content.strip()

        result = json.loads(content)
        return jsonify(result)
    except json.JSONDecodeError as e:
        return jsonify({"error": f"JSON parse error: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/explain', methods=['POST'])
def explain_beat():
    data = request.json
    beat = data.get('beat', {})
    question = data.get('question', 'Why does this beat work?')

    try:
        response = client.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=500,
            system="You are BeatMind, a friendly music theory teacher. Explain concepts in plain English with no jargon. Be encouraging and fun. Keep answers to 3-4 sentences.",
            messages=[{
                "role": "user",
                "content": f"Beat context: {json.dumps(beat)}\n\nQuestion: {question}"
            }]
        )
        return jsonify({"explanation": response.content[0].text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/export-midi', methods=['POST'])
def export_midi():
    data = request.json
    beat = data.get('beat', {})
    tracks = beat.get('tracks', [])
    bpm = beat.get('bpm', 120)
    key = beat.get('key', 'C minor')

    try:
        midi_bytes = generate_beat_from_params(tracks, bpm, key)
        return send_file(
            io.BytesIO(midi_bytes),
            mimetype='audio/midi',
            as_attachment=True,
            download_name=f"{beat.get('name', 'beatmind')}.mid"
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/genres', methods=['GET'])
def get_genres():
    genres = [
        {"id": "trap",      "name": "Trap",        "emoji": "🔥", "description": "Heavy 808s, fast hi-hats"},
        {"id": "lofi",      "name": "Lo-Fi",        "emoji": "☕", "description": "Chill, jazzy, relaxed"},
        {"id": "house",     "name": "House",        "emoji": "🎧", "description": "Four-on-the-floor, groovy"},
        {"id": "dnb",       "name": "Drum & Bass",  "emoji": "⚡", "description": "Fast, energetic, complex"},
        {"id": "afrobeats", "name": "Afrobeats",    "emoji": "🌍", "description": "Rhythmic, percussive, vibrant"},
        {"id": "drill",     "name": "Drill",        "emoji": "🌪️", "description": "Dark, sliding 808s, menacing"},
        {"id": "pop",       "name": "Pop",          "emoji": "✨", "description": "Catchy, clean, radio-ready"},
        {"id": "jazz",      "name": "Jazz",         "emoji": "🎷", "description": "Swung, complex, soulful"},
    ]
    return jsonify(genres)


@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "message": "BeatMind is alive 🎵"})


if __name__ == '__main__':
    app.run(debug=True, port=5000)
