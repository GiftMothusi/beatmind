import React, { useState, useRef } from 'react';
import { Send, Wand2, RefreshCw } from 'lucide-react';
import './PromptPanel.css';

const SUGGESTIONS = [
  "dark trap beat, 140bpm, heavy 808s",
  "chill lofi hip hop, rainy day vibes",
  "upbeat afrobeats, tropical energy",
  "aggressive UK drill, minor key",
  "jazzy boom bap, smooth and soulful",
  "euphoric house music, 128bpm",
];

export default function PromptPanel({ onGenerate, onRefine, isLoading, hasBeat }) {
  const [prompt, setPrompt]     = useState('');
  const [history, setHistory]   = useState([]);
  const textareaRef             = useRef(null);

  const submit = () => {
    const msg = prompt.trim();
    if (!msg || isLoading) return;
    setHistory(prev => [...prev, msg]);
    hasBeat ? onRefine(msg) : onGenerate(msg);
    setPrompt('');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
  };

  return (
    <div className="prompt-panel">
      <div className="prompt-header">
        <span className="panel-label">AI Prompt</span>
        {hasBeat && <span className="mode-badge">Refine mode</span>}
      </div>

      {/* Quick suggestions — only before first beat */}
      {!hasBeat && (
        <div className="suggestions">
          {SUGGESTIONS.map((s, i) => (
            <button key={i} className="suggestion" onClick={() => { setPrompt(s); textareaRef.current?.focus(); }}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Prompt history */}
      {history.length > 0 && (
        <div className="history">
          {history.slice(-4).map((msg, i) => (
            <div key={i} className="history-item">{msg}</div>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="prompt-input-area">
        <textarea
          ref={textareaRef}
          className="prompt-textarea"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={handleKey}
          placeholder={hasBeat
            ? "Describe changes... e.g. 'make it darker', 'add more energy'"
            : "Describe your beat... e.g. 'dark trap, 140bpm, heavy bass'"}
          rows={3}
          disabled={isLoading}
        />
        <button className={`prompt-btn ${isLoading ? 'loading' : ''}`} onClick={submit} disabled={isLoading || !prompt.trim()}>
          {isLoading
            ? <><RefreshCw size={14} className="spin" /><span>Generating...</span></>
            : hasBeat
              ? <><Wand2 size={14} /><span>Refine Beat</span></>
              : <><Send  size={14} /><span>Generate Beat</span></>
          }
        </button>
      </div>
    </div>
  );
}
