import React, { useState } from 'react';
import { Sparkles, Lightbulb, Zap, MessageCircle } from 'lucide-react';
import axios from 'axios';
import './AIInsightPanel.css';

const API = 'http://localhost:5000/api';

const TYPE = {
  generate: { icon: '✨', label: 'Generated', color: 'var(--accent-pink)' },
  refine:   { icon: '🔧', label: 'Refined',   color: 'var(--accent-cyan)' },
  fix:      { icon: '⚡', label: 'AI Fixed',  color: 'var(--accent-amber)' },
  error:    { icon: '⚠️', label: 'Error',     color: '#ff4757' },
};

export default function AIInsightPanel({ insight, isFixing, onAIFix, beat }) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer]     = useState(null);
  const [isAsking, setIsAsking] = useState(false);

  const hasBeat = beat.tracks.some(t => t.steps.some(s => s));

  const askQuestion = async () => {
    if (!question.trim()) return;
    setIsAsking(true);
    try {
      const res = await axios.post(`${API}/explain`, { beat, question: question.trim() });
      setAnswer(res.data.explanation);
    } catch {
      setAnswer("Couldn't reach the backend — make sure it's running.");
    }
    setIsAsking(false);
    setQuestion('');
  };

  const cfg = insight ? (TYPE[insight.type] || TYPE.generate) : null;

  return (
    <div className="insight-panel">

      {/* AI Fix */}
      <div className="fix-section">
        <span className="panel-label">AI Assistant</span>
        <button
          className={`fix-btn ${isFixing ? 'fixing' : ''}`}
          onClick={onAIFix}
          disabled={isFixing || !hasBeat}
        >
          {isFixing
            ? <><div className="fix-spinner" /><span>Analysing...</span></>
            : <><Zap size={14} /><span>AI Fix Beat</span></>
          }
        </button>
      </div>

      {/* Insight card */}
      {insight && cfg && (
        <div className="insight-card" style={{ '--ic': cfg.color }}>
          <div className="insight-head">
            <span>{cfg.icon}</span>
            <span className="insight-badge" style={{ color: cfg.color }}>{cfg.label}</span>
          </div>
          {insight.explanation && <p className="insight-text">{insight.explanation}</p>}
          {insight.theory_tip && (
            <div className="theory-tip">
              <Lightbulb size={11} color="var(--accent-amber)" />
              <p className="theory-text">{insight.theory_tip}</p>
            </div>
          )}
        </div>
      )}

      {/* Ask AI */}
      <div className="ask-section">
        <div className="ask-head">
          <MessageCircle size={10} color="var(--text-muted)" />
          <span className="panel-label">Ask AI</span>
        </div>
        <div className="ask-row">
          <input
            className="ask-input"
            type="text"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && askQuestion()}
            placeholder="Why does this groove? What's swing?"
            disabled={isAsking}
          />
          <button className="ask-btn" onClick={askQuestion} disabled={isAsking || !question.trim()}>
            {isAsking ? '…' : '→'}
          </button>
        </div>
        {answer && (
          <div className="ask-answer">
            <div className="ask-answer-label">
              <Sparkles size={10} color="var(--accent-cyan)" />
              <span>BeatMind says</span>
            </div>
            <p className="ask-answer-text">{answer}</p>
          </div>
        )}
      </div>

    </div>
  );
}
