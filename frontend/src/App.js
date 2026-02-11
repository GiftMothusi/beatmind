import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  start as toneStart,
  getContext,
  getTransport,
  getDraw,
  Reverb,
  Limiter,
  MembraneSynth,
  NoiseSynth,
  MetalSynth,
  Synth,
  PolySynth,
  Sequence,
  gainToDb,
} from 'tone';
import Header from './components/Header';
import PromptPanel from './components/PromptPanel';
import Sequencer from './components/Sequencer';
import TrackControls from './components/TrackControls';
import AIInsightPanel from './components/AIInsightPanel';
import GenreSelector from './components/GenreSelector';
import './App.css';

const API = 'http://localhost:5000/api';

const DEFAULT_BEAT = {
  bpm: 120,
  name: "New Beat",
  description: "Start by typing a prompt or selecting a genre below",
  key: "C minor",
  tracks: [
    { id: "kick",         name: "Kick",    color: "#FF4757", steps: Array(16).fill(false), volume: 0.9 },
    { id: "snare",        name: "Snare",   color: "#FFA502", steps: Array(16).fill(false), volume: 0.8 },
    { id: "hihat_closed", name: "Hi-Hat",  color: "#2ED573", steps: Array(16).fill(false), volume: 0.6 },
    { id: "hihat_open",   name: "Open HH", color: "#1E90FF", steps: Array(16).fill(false), volume: 0.5 },
    { id: "bass",         name: "Bass",    color: "#A855F7", steps: Array(16).fill(false), volume: 0.85 },
    { id: "melody",       name: "Melody",  color: "#FF6B9D", steps: Array(16).fill(false), volume: 0.7 },
  ]
};

const BASS_NOTES  = ['C2', 'D2', 'E2', 'F2', 'G2', 'A2', 'B2', 'C3'];
const MELODY_NOTES = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];

export default function App() {
  const [beat, setBeat]                         = useState(DEFAULT_BEAT);
  const [isPlaying, setIsPlaying]               = useState(false);
  const [currentStep, setCurrentStep]           = useState(-1);
  const [isLoading, setIsLoading]               = useState(false);
  const [isFixing, setIsFixing]                 = useState(false);
  const [insight, setInsight]                   = useState(null);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [savedBeats, setSavedBeats]             = useState([]);
  const [showSaved, setShowSaved]               = useState(false);
  const [buildAnimation, setBuildAnimation]     = useState(false);

  const synthsRef    = useRef({});
  const sequencerRef = useRef(null);
  const beatRef      = useRef(beat);
  const noteCounters = useRef({});

  useEffect(() => { beatRef.current = beat; }, [beat]);

  // ── Init Tone.js synths ──────────────────────────────────────────────────
  useEffect(() => {
    const reverb  = new Reverb({ decay: 1.5, wet: 0.15 }).toDestination();
    const limiter = new Limiter(-3).toDestination();

    synthsRef.current = {
      kick: new MembraneSynth({
        pitchDecay: 0.05,
        octaves: 6,
        envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.1 },
      }).connect(limiter),

      snare: new NoiseSynth({
        noise: { type: 'white' },
        envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.05 },
      }).connect(reverb),

      hihat_closed: new MetalSynth({
        frequency: 400,
        envelope: { attack: 0.001, decay: 0.05, release: 0.01 },
        harmonicity: 5.1,
        modulationIndex: 32,
        resonance: 4000,
        octaves: 1.5,
      }).connect(limiter),

      hihat_open: new MetalSynth({
        frequency: 400,
        envelope: { attack: 0.001, decay: 0.3, release: 0.1 },
        harmonicity: 5.1,
        modulationIndex: 32,
        resonance: 4000,
        octaves: 1.5,
      }).connect(reverb),

      bass: new Synth({
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.01, decay: 0.3, sustain: 0.4, release: 0.2 },
      }).connect(limiter),

      melody: new PolySynth(Synth, {
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.02, decay: 0.2, sustain: 0.5, release: 0.4 },
      }).connect(reverb),
    };

    return () => {
      Object.values(synthsRef.current).forEach(s => { try { s.dispose(); } catch (e) {} });
      try { reverb.dispose();  } catch (e) {}
      try { limiter.dispose(); } catch (e) {}
    };
  }, []);

  // ── Trigger a single instrument hit ─────────────────────────────────────
  const triggerInstrument = (trackId, noteIndex, volume) => {
    const synth = synthsRef.current[trackId];
    if (!synth) return;
    try {
      const vol = Math.max(0.01, Math.min(1, volume));
      if (trackId === 'kick') {
        synth.volume.value = gainToDb(vol);
        synth.triggerAttackRelease('C1', '8n');
      } else if (trackId === 'snare') {
        synth.volume.value = gainToDb(vol * 0.5);
        synth.triggerAttackRelease('8n');
      } else if (trackId === 'hihat_closed') {
        synth.volume.value = gainToDb(vol * 0.3);
        synth.triggerAttackRelease('32n');
      } else if (trackId === 'hihat_open') {
        synth.volume.value = gainToDb(vol * 0.3);
        synth.triggerAttackRelease('8n');
      } else if (trackId === 'bass') {
        const note = BASS_NOTES[noteIndex % BASS_NOTES.length];
        synth.volume.value = gainToDb(vol * 0.7);
        synth.triggerAttackRelease(note, '8n');
      } else if (trackId === 'melody') {
        const note = MELODY_NOTES[noteIndex % MELODY_NOTES.length];
        synth.volume.value = gainToDb(vol * 0.6);
        synth.triggerAttackRelease(note, '8n');
      }
    } catch (e) {
      console.warn('Audio trigger error:', e);
    }
  };

  // ── Start sequencer ──────────────────────────────────────────────────────
  const startSequencer = async () => {
    await toneStart();
    await getContext().resume();

    getTransport().stop();
    getTransport().cancel();

    getTransport().bpm.value = beatRef.current.bpm;
    noteCounters.current = {};

    sequencerRef.current = new Sequence(
      (time, stepIdx) => {
        const currentBeat = beatRef.current;

        currentBeat.tracks.forEach(track => {
          if (track.steps[stepIdx]) {
            if (noteCounters.current[track.id] === undefined) {
              noteCounters.current[track.id] = 0;
            }
            const idx = noteCounters.current[track.id];
            getDraw().schedule(() => {
              triggerInstrument(track.id, idx, track.volume);
              noteCounters.current[track.id]++;
            }, time);
          }
        });

        getDraw().schedule(() => {
          setCurrentStep(stepIdx);
        }, time);
      },
      [...Array(16).keys()],
      '16n'
    );

    sequencerRef.current.start(0);
    getTransport().start();
    setIsPlaying(true);
  };

  // ── Stop sequencer ───────────────────────────────────────────────────────
  const stopSequencer = () => {
    if (sequencerRef.current) {
      try { sequencerRef.current.stop(); sequencerRef.current.dispose(); } catch (e) {}
      sequencerRef.current = null;
    }
    try { getTransport().stop(); } catch (e) {}
    setIsPlaying(false);
    setCurrentStep(-1);
  };

  const togglePlay = () => {
    if (isPlaying) stopSequencer();
    else startSequencer();
  };

  // ── Beat building animation helper ───────────────────────────────────────
  const animateBeatIn = (newBeat) => {
    // Start with empty steps
    setBeat({ ...newBeat, tracks: newBeat.tracks.map(t => ({ ...t, steps: Array(16).fill(false) })) });
    setBuildAnimation(true);
    setTimeout(() => setBuildAnimation(false), 2500);

    // Stagger each active step appearing
    newBeat.tracks.forEach((track, trackIdx) => {
      track.steps.forEach((active, stepIdx) => {
        if (active) {
          setTimeout(() => {
            setBeat(prev => {
              const tracks = prev.tracks.map((t, ti) => {
                if (ti !== trackIdx) return t;
                const steps = [...t.steps];
                steps[stepIdx] = true;
                return { ...t, steps };
              });
              return { ...prev, tracks };
            });
          }, trackIdx * 100 + stepIdx * 25);
        }
      });
    });
  };

  // ── API calls ─────────────────────────────────────────────────────────────
  const handleGenerate = async (prompt) => {
    setIsLoading(true);
    try {
      const res = await axios.post(`${API}/generate`, {
        prompt,
        history: conversationHistory,
      });
      if (res.data.beat) {
        animateBeatIn(res.data.beat);
        setInsight({ explanation: res.data.explanation, theory_tip: res.data.theory_tip, type: 'generate' });
        setConversationHistory(prev => [
          ...prev,
          { role: 'user',      content: `Generate a beat: ${prompt}` },
          { role: 'assistant', content: JSON.stringify(res.data) },
        ]);
      }
    } catch (err) {
      setInsight({ explanation: "Couldn't reach the backend — make sure it's running on port 5000.", type: 'error' });
    }
    setIsLoading(false);
  };

  const handleRefine = async (prompt) => {
    setIsLoading(true);
    try {
      const res = await axios.post(`${API}/refine`, {
        prompt,
        current_beat: beat,
        history: conversationHistory,
      });
      if (res.data.beat) {
        setBeat(res.data.beat);
        setInsight({ explanation: res.data.explanation, theory_tip: res.data.theory_tip, type: 'refine' });
        setConversationHistory(prev => [
          ...prev,
          { role: 'user',      content: prompt },
          { role: 'assistant', content: JSON.stringify(res.data) },
        ]);
      }
    } catch (err) {
      setInsight({ explanation: "Refinement failed — check the backend.", type: 'error' });
    }
    setIsLoading(false);
  };

  const handleAIFix = async () => {
    setIsFixing(true);
    try {
      const res = await axios.post(`${API}/ai-fix`, { beat });
      if (res.data.beat) {
        setBeat(res.data.beat);
        setInsight({ explanation: res.data.explanation, theory_tip: res.data.theory_tip, type: 'fix' });
      }
    } catch (err) {
      setInsight({ explanation: "AI Fix failed — check the backend.", type: 'error' });
    }
    setIsFixing(false);
  };

  const handleStepToggle = (trackIndex, stepIndex) => {
    setBeat(prev => ({
      ...prev,
      tracks: prev.tracks.map((t, i) => {
        if (i !== trackIndex) return t;
        const steps = [...t.steps];
        steps[stepIndex] = !steps[stepIndex];
        return { ...t, steps };
      }),
    }));
  };

  const handleVolumeChange = (trackIndex, volume) => {
    setBeat(prev => ({
      ...prev,
      tracks: prev.tracks.map((t, i) => i === trackIndex ? { ...t, volume } : t),
    }));
  };

  const handleBpmChange = (newBpm) => {
    setBeat(prev => ({ ...prev, bpm: newBpm }));
    try { getTransport().bpm.value = newBpm; } catch (e) {}
  };

  const handleSave = () => {
    setSavedBeats(prev => [
      { ...beat, savedAt: new Date().toLocaleTimeString(), id: Date.now() },
      ...prev.slice(0, 9),
    ]);
  };

  const handleLoadBeat = (savedBeat) => {
    setBeat(savedBeat);
    setShowSaved(false);
  };

  const handleGenreSelect = (genre) => {
    handleGenerate(`${genre.name} beat — ${genre.description}`);
  };

  const handleExportMidi = async () => {
    try {
      const res = await axios.post(`${API}/export-midi`, { beat }, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${beat.name || 'beatmind'}.mid`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      console.warn('MIDI export failed:', e);
    }
  };

  const hasBeat = beat.tracks.some(t => t.steps.some(s => s));

  return (
    <div className="app">
      <Header
        beatName={beat.name}
        bpm={beat.bpm}
        isPlaying={isPlaying}
        onTogglePlay={togglePlay}
        onBpmChange={handleBpmChange}
        onSave={handleSave}
        onShowSaved={() => setShowSaved(v => !v)}
        savedBeats={savedBeats}
        showSaved={showSaved}
        onLoadBeat={handleLoadBeat}
        onExportMidi={handleExportMidi}
      />

      <div className="main-layout">
        <aside className="left-panel">
          <PromptPanel
            onGenerate={handleGenerate}
            onRefine={handleRefine}
            isLoading={isLoading}
            hasBeat={hasBeat}
          />
          <GenreSelector onSelect={handleGenreSelect} isLoading={isLoading} />
        </aside>

        <main className="center-panel">
          <Sequencer
            beat={beat}
            currentStep={currentStep}
            isPlaying={isPlaying}
            buildAnimation={buildAnimation}
            onStepToggle={handleStepToggle}
          />
        </main>

        <aside className="right-panel">
          <TrackControls
            tracks={beat.tracks}
            onVolumeChange={handleVolumeChange}
          />
          <AIInsightPanel
            insight={insight}
            isFixing={isFixing}
            onAIFix={handleAIFix}
            beat={beat}
          />
        </aside>
      </div>
    </div>
  );
}
