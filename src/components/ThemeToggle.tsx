import React, { useEffect, useState } from 'react';

export const ThemeToggle: React.FC = () => {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('ui_theme');
      if (stored === 'dark') setDark(true);
    } catch {}
  }, []);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    if (dark) {
      root.classList.add('theme-dark');
      localStorage.setItem('ui_theme','dark');
    } else {
      root.classList.remove('theme-dark');
      localStorage.setItem('ui_theme','light');
    }
  }, [dark]);
  return (
    <button
      onClick={() => setDark(d => !d)}
      aria-label="Toggle dark theme"
      style={{
        background: dark? 'var(--blue-9)':'var(--gray-4)',
        color: dark? 'white':'var(--gray-12)',
        border:'1px solid var(--gray-6)',
        padding:'6px 10px',
        fontSize:'0.65rem',
        borderRadius:8,
        cursor:'pointer'
      }}
    >{dark? 'Dark ✓':'Dark'}</button>
  );
};
