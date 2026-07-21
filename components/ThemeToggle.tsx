'use client';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [light, setLight] = useState(false);

  // DOM(data-theme)을 단일 진실 소스로 사용 → 여러 토글 인스턴스 간 상태 동기화
  useEffect(() => {
    const sync = () => setLight(document.documentElement.getAttribute('data-theme') === 'light');
    sync();
    window.addEventListener('themechange', sync);
    return () => window.removeEventListener('themechange', sync);
  }, []);

  function toggle() {
    const el = document.documentElement;
    const next = el.getAttribute('data-theme') !== 'light';
    if (next) { el.setAttribute('data-theme', 'light'); el.style.colorScheme = 'light'; localStorage.setItem('theme', 'light'); }
    else { el.removeAttribute('data-theme'); el.style.colorScheme = 'dark'; localStorage.setItem('theme', 'dark'); }
    setLight(next);
    window.dispatchEvent(new Event('themechange'));
  }

  return (
    <button id="theme-toggle" aria-label="테마 전환" onClick={toggle}>{light ? '☀️' : '🌙'}</button>
  );
}
