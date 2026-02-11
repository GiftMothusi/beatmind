const { cors } = require('./_lib/anthropic');
const Midi = require('jsmidgen');

const DRUM_NOTES = {
  kick: 36,
  snare: 38,
  hihat_closed: 42,
  hihat_open: 46,
};

const SCALE_NOTES = {
  'C':  [48, 50, 52, 53, 55, 57, 59, 60],
  'C#': [49, 51, 53, 54, 56, 58, 60, 61],
  'D':  [50, 52, 54, 55, 57, 59, 61, 62],
  'D#': [51, 53, 55, 56, 58, 60, 62, 63],
  'E':  [52, 54, 56, 57, 59, 61, 63, 64],
  'F':  [53, 55, 57, 58, 60, 62, 64, 65],
  'F#': [54, 56, 58, 59, 61, 63, 65, 66],
  'G':  [55, 57, 59, 60, 62, 64, 66, 67],
  'G#': [56, 58, 60, 61, 63, 65, 67, 68],
  'A':  [57, 59, 61, 62, 64, 66, 68, 69],
  'A#': [58, 60, 62, 63, 65, 67, 69, 70],
  'B':  [59, 61, 63, 64, 66, 68, 70, 71],
};

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { beat = {} } = req.body;
  const tracks = beat.tracks || [];
  const bpm = beat.bpm || 120;
  const key = beat.key || 'C minor';
  const rootKey = key.split(' ')[0] || 'C';
  const scale = SCALE_NOTES[rootKey] || SCALE_NOTES['C'];

  try {
    const file = new Midi.File();
    const drumTrack = new Midi.Track();
    const melodyTrack = new Midi.Track();

    file.addTrack(drumTrack);
    file.addTrack(melodyTrack);

    drumTrack.setTempo(bpm);
    melodyTrack.setTempo(bpm);

    const stepTicks = 32; // 16th note in ticks (128 ticks per beat / 4)

    for (const track of tracks) {
      const trackId = track.id || '';
      const steps = track.steps || new Array(16).fill(false);
      const volume = Math.round((track.volume || 0.8) * 127);

      if (trackId === 'melody' || trackId === 'bass') {
        let noteIdx = 0;
        for (let i = 0; i < steps.length; i++) {
          if (steps[i]) {
            let note = scale[noteIdx % scale.length];
            if (trackId === 'bass') note -= 12;
            melodyTrack.addNote(0, note, stepTicks, 0, volume);
            noteIdx++;
          } else {
            melodyTrack.addNoteOff(0, 60, stepTicks, 0);
          }
        }
      } else {
        const drumNote = DRUM_NOTES[trackId] || 36;
        for (let i = 0; i < steps.length; i++) {
          if (steps[i]) {
            drumTrack.addNote(9, drumNote, stepTicks, 0, volume);
          } else {
            drumTrack.addNoteOff(9, drumNote, stepTicks, 0);
          }
        }
      }
    }

    const midiBytes = file.toBytes();
    const buffer = Buffer.from(midiBytes, 'binary');

    res.setHeader('Content-Type', 'audio/midi');
    res.setHeader('Content-Disposition', `attachment; filename="${beat.name || 'beatmind'}.mid"`);
    return res.status(200).send(buffer);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
