"use client";
import React, { useEffect, useState } from 'react';

// Enhanced theme toggle using mw-theme key and explicit light/dark classes for override.
export const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark' | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('mw-theme');
    if (stored === 'light' || stored === 'dark') {
      apply(stored as 'light' | 'dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      apply(prefersDark ? 'dark' : 'light');
    }
  }, []);

  function apply(next: 'light' | 'dark') {
    setTheme(next);
    const root = document.documentElement;
    root.classList.remove('theme-light', 'theme-dark');
    root.classList.add(next === 'dark' ? 'theme-dark' : 'theme-light');
    try { localStorage.setItem('mw-theme', next); } catch {}
  }

  function toggle() {
    apply(theme === 'dark' ? 'light' : 'dark');
  }

  if (!theme) return null;

  return (
    <button
      onClick={toggle}
      aria-label="Toggle color theme"
      style={{
        background: theme === 'dark'? 'hsl(222 30% 22%)':'var(--gray-3)',
        color: theme === 'dark'? 'hsl(0 0% 96%)':'hsl(222 40% 20%)',
        border:'1px solid ' + (theme === 'dark'? 'hsl(222 25% 32%)':'var(--gray-6)'),
        padding:'8px 14px',
        fontSize:'0.72rem',
        fontWeight:600,
        letterSpacing:'0.5px',
        borderRadius:10,
        cursor:'pointer',
        transition:'background .25s ease, color .25s ease, border-color .25s ease'
      }}
    >{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</button>
  );
};
