import React, { useState } from 'react';
import { Play, Pause, Save, Download, ChevronDown, Music } from 'lucide-react';
import './Header.css';

export default function Header({
  beatName, bpm, isPlaying, onTogglePlay, onBpmChange,
  onSave, onShowSaved, savedBeats, showSaved, onLoadBeat, onExportMidi
}) {
  const [editingBpm, setEditingBpm] = useState(false);
  const [bpmInput, setBpmInput]     = useState(bpm);

  const commitBpm = () => {
    const val = parseInt(bpmInput, 10);
    if (!isNaN(val) && val >= 40 && val <= 220) onBpmChange(val);
    setEditingBpm(false);
  };

  return (
    <header className="header">
      {/* Logo */}
      <div className="header-logo">
        <div className="logo-icon"><Music size={14} /></div>
        <span className="logo-text">BEAT<span className="logo-accent">MIND</span></span>
      </div>

      {/* Beat name */}
      <div className="beat-name-display">
        <span className="beat-name">{beatName}</span>
      </div>

      {/* Transport */}
      <div className="transport">
        <div className="bpm-control">
          <span className="transport-label">BPM</span>
          {editingBpm ? (
            <input
              className="bpm-input"
              type="number"
              value={bpmInput}
              onChange={e => setBpmInput(e.target.value)}
              onBlur={commitBpm}
              onKeyDown={e => e.key === 'Enter' && commitBpm()}
              min={40} max={220}
              autoFocus
            />
          ) : (
            <button className="bpm-value" onClick={() => { setEditingBpm(true); setBpmInput(bpm); }}>
              {bpm}
            </button>
          )}
        </div>

        <input
          type="range"
          className="bpm-slider"
          min={60} max={200}
          value={bpm}
          onChange={e => onBpmChange(parseInt(e.target.value, 10))}
        />

        <button className={`play-btn ${isPlaying ? 'playing' : ''}`} onClick={onTogglePlay}>
          {isPlaying
            ? <Pause size={16} fill="currentColor" />
            : <Play  size={16} fill="currentColor" />}
        </button>
      </div>

      {/* Actions */}
      <div className="header-actions">
        <button className="action-btn" onClick={onSave}>
          <Save size={14} /><span>Save</span>
        </button>

        <div className="saved-dropdown">
          <button className={`action-btn ${showSaved ? 'active' : ''}`} onClick={onShowSaved}>
            <span>Library</span><ChevronDown size={12} />
          </button>

          {showSaved && (
            <div className="saved-list">
              <div className="saved-list-header">Saved Beats</div>
              {savedBeats.length === 0
                ? <div className="saved-empty">No saved beats yet</div>
                : savedBeats.map(b => (
                    <button key={b.id} className="saved-item" onClick={() => onLoadBeat(b)}>
                      <span className="saved-item-name">{b.name}</span>
                      <span className="saved-item-meta">{b.bpm} BPM · {b.savedAt}</span>
                    </button>
                  ))
              }
            </div>
          )}
        </div>

        <button className="action-btn" onClick={onExportMidi}>
          <Download size={14} /><span>MIDI</span>
        </button>
      </div>
    </header>
  );
}
