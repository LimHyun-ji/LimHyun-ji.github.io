'use client';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [light, setLight] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light') { document.documentElement.setAttribute('data-theme', 'light'); setLight(true); }
  }, []);

  function toggle() {
    const next = !light;
    setLight(next);
    if (next) { document.documentElement.setAttribute('data-theme', 'light'); localStorage.setItem('theme', 'light'); }
    else { document.documentElement.removeAttribute('data-theme'); localStorage.setItem('theme', 'dark'); }
    window.dispatchEvent(new Event('themechange'));
  }

  return (
    <button id="theme-toggle" aria-label="테마 전환" onClick={toggle}>{light ? '☀️' : '🌙'}</button>
  );
}
