import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './GenreSelector.css';

const API = 'http://localhost:5000/api';

const FALLBACK = [
  { id: "trap",      name: "Trap",    emoji: "🔥" },
  { id: "lofi",      name: "Lo-Fi",   emoji: "☕" },
  { id: "house",     name: "House",   emoji: "🎧" },
  { id: "dnb",       name: "D&B",     emoji: "⚡" },
  { id: "afrobeats", name: "Afro",    emoji: "🌍" },
  { id: "drill",     name: "Drill",   emoji: "🌪️" },
  { id: "pop",       name: "Pop",     emoji: "✨" },
  { id: "jazz",      name: "Jazz",    emoji: "🎷" },
];

export default function GenreSelector({ onSelect, isLoading }) {
  const [genres, setGenres]   = useState(FALLBACK);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    axios.get(`${API}/genres`).then(r => setGenres(r.data)).catch(() => {});
  }, []);

  const pick = (genre) => {
    setSelected(genre.id);
    onSelect(genre);
    setTimeout(() => setSelected(null), 2000);
  };

  return (
    <div className="genre-selector">
      <span className="panel-label">Quick Genre</span>
      <div className="genre-grid">
        {genres.map(g => (
          <button
            key={g.id}
            className={`genre-btn ${selected === g.id ? 'selected' : ''}`}
            onClick={() => pick(g)}
            disabled={isLoading}
            title={g.description || g.name}
          >
            <span className="genre-emoji">{g.emoji}</span>
            <span className="genre-name">{g.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
