import React from 'react';
import { Volume2 } from 'lucide-react';
import './TrackControls.css';

export default function TrackControls({ tracks, onVolumeChange }) {
  return (
    <div className="track-controls">
      <span className="panel-label">Track Levels</span>
      <div className="track-list">
        {tracks.map((track, i) => (
          <div key={track.id} className="track-row">
            <div className="track-info">
              <div className="track-dot" style={{ background: track.color, boxShadow: `0 0 6px ${track.color}` }} />
              <span className="track-label">{track.name}</span>
            </div>
            <div className="volume-row">
              <Volume2 size={10} color="var(--text-muted)" />
              <input
                type="range"
                className="vol-slider"
                min={0} max={1} step={0.01}
                value={track.volume}
                onChange={e => onVolumeChange(i, parseFloat(e.target.value))}
                style={{ '--tc': track.color }}
              />
              <span className="vol-value">{Math.round(track.volume * 100)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
