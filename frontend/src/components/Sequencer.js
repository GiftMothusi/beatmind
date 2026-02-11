import React from 'react';
import './Sequencer.css';

export default function Sequencer({ beat, currentStep, isPlaying, buildAnimation, onStepToggle }) {
  const hasBeat = beat.tracks.some(t => t.steps.some(s => s));

  return (
    <div className="sequencer">
      {/* Info bar */}
      <div className="seq-info-bar">
        <div className="seq-info-item">
          <span className="seq-info-label">KEY</span>
          <span className="seq-info-value">{beat.key}</span>
        </div>
        <div className="seq-description">{beat.description}</div>
        <div className="seq-info-item">
          <span className="seq-info-label">STEPS</span>
          <span className="seq-info-value">16</span>
        </div>
      </div>

      {/* Ruler */}
      <div className="seq-ruler">
        <div className="seq-label-spacer" />
        <div className="seq-steps-row">
          {Array(16).fill(null).map((_, i) => (
            <div key={i} className={`seq-ruler-cell ${currentStep === i ? 'active' : ''} ${i % 4 === 0 ? 'beat' : ''}`}>
              {i % 4 === 0 ? Math.floor(i / 4) + 1 : '·'}
            </div>
          ))}
        </div>
      </div>

      {/* Tracks */}
      <div className="seq-tracks">
        {beat.tracks.map((track, trackIdx) => (
          <div
            key={track.id}
            className={`seq-track ${buildAnimation ? 'building' : ''}`}
            style={{ '--track-color': track.color, '--track-idx': trackIdx }}
          >
            <div className="seq-track-label">
              <div className="track-dot" style={{ background: track.color, boxShadow: `0 0 8px ${track.color}` }} />
              <span className="track-name">{track.name}</span>
            </div>

            <div className="seq-steps-row">
              {track.steps.map((active, stepIdx) => (
                <button
                  key={stepIdx}
                  className={[
                    'seq-step',
                    active ? 'active' : '',
                    currentStep === stepIdx && isPlaying ? 'current' : '',
                    stepIdx % 4 === 0 ? 'beat-start' : '',
                  ].filter(Boolean).join(' ')}
                  style={{ '--step-color': track.color }}
                  onClick={() => onStepToggle(trackIdx, stepIdx)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {!hasBeat && (
        <div className="seq-empty">
          <div className="seq-empty-icon">🎵</div>
          <div className="seq-empty-title">Your canvas awaits</div>
          <div className="seq-empty-sub">Type a prompt or pick a genre to generate your beat</div>
        </div>
      )}
    </div>
  );
}
