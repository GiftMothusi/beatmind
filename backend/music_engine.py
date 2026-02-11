"""
BeatMind Music Engine
Handles MIDI generation and beat analysis utilities
"""
import base64
import io
from midiutil import MIDIFile

# Instrument MIDI note mappings (General MIDI drum map)
DRUM_NOTES = {
    "kick": 36,
    "snare": 38,
    "hihat_closed": 42,
    "hihat_open": 46,
    "bass": 35,
    "clap": 39,
    "rim": 37,
    "crash": 49,
    "ride": 51,
}

# Scale note mappings
SCALE_NOTES = {
    "C":  [48, 50, 52, 53, 55, 57, 59, 60],
    "C#": [49, 51, 53, 54, 56, 58, 60, 61],
    "D":  [50, 52, 54, 55, 57, 59, 61, 62],
    "D#": [51, 53, 55, 56, 58, 60, 62, 63],
    "E":  [52, 54, 56, 57, 59, 61, 63, 64],
    "F":  [53, 55, 57, 58, 60, 62, 64, 65],
    "F#": [54, 56, 58, 59, 61, 63, 65, 66],
    "G":  [55, 57, 59, 60, 62, 64, 66, 67],
    "G#": [56, 58, 60, 61, 63, 65, 67, 68],
    "A":  [57, 59, 61, 62, 64, 66, 68, 69],
    "A#": [58, 60, 62, 63, 65, 67, 69, 70],
    "B":  [59, 61, 63, 64, 66, 68, 70, 71],
}


def generate_beat_from_params(tracks, bpm=120, key="C"):
    """Generate a MIDI file from beat parameters"""
    midi = MIDIFile(2)

    midi.addTempo(0, 0, bpm)
    midi.addTrackName(0, 0, "Drums")
    midi.addTempo(1, 0, bpm)
    midi.addTrackName(1, 0, "Melody/Bass")
    midi.addProgramChange(1, 0, 0, 38)

    step_duration = 0.25

    root_key = key.split()[0] if " " in key else key
    scale = SCALE_NOTES.get(root_key, SCALE_NOTES["C"])

    for track in tracks:
        track_id = track.get("id", "")
        steps = track.get("steps", [False] * 16)
        volume = int(track.get("volume", 0.8) * 127)

        if track_id in ["melody", "bass"]:
            note_idx = 0
            for i, active in enumerate(steps):
                if active:
                    note = scale[note_idx % len(scale)]
                    if track_id == "bass":
                        note -= 12
                    time = i * step_duration
                    midi.addNote(1, 0, note, time, step_duration * 1.8, volume)
                    note_idx += 1
        else:
            drum_note = DRUM_NOTES.get(track_id, 36)
            for i, active in enumerate(steps):
                if active:
                    time = i * step_duration
                    midi.addNote(0, 9, drum_note, time, step_duration * 0.9, volume)

    buffer = io.BytesIO()
    midi.writeFile(buffer)
    buffer.seek(0)
    return buffer.getvalue()


def midi_to_base64(midi_bytes):
    """Convert MIDI bytes to base64 string"""
    return base64.b64encode(midi_bytes).decode('utf-8')


def analyze_beat_quality(tracks, bpm):
    """Analyse a beat and return quality issues and suggestions"""
    issues = []
    suggestions = []

    kick_track = next((t for t in tracks if t["id"] == "kick"), None)
    snare_track = next((t for t in tracks if t["id"] == "snare"), None)

    if kick_track:
        kick_count = sum(1 for s in kick_track.get("steps", []) if s)
        if kick_count == 0:
            issues.append("No kick drum pattern detected")
        elif kick_count > 8:
            issues.append("Kick drum pattern may be too busy")
            suggestions.append("Try a simpler kick pattern for better groove")

    if snare_track:
        snare_steps = snare_track.get("steps", [])
        if len(snare_steps) >= 13:
            if not snare_steps[4] and not snare_steps[12]:
                suggestions.append("Consider placing snare on beats 2 and 4 for more groove")

    if bpm < 60:
        issues.append("BPM is very slow — consider increasing it")
    elif bpm > 200:
        issues.append("BPM is very fast — consider slowing down")

    return {"issues": issues, "suggestions": suggestions}
