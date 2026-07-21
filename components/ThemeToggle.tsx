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
    if (next) { el.setAttribute('data-theme', 'light'); localStorage.setItem('theme', 'light'); }
    else { el.removeAttribute('data-theme'); localStorage.setItem('theme', 'dark'); }
    // 'only light' 필수 — 모바일 강제 다크 옵트아웃. 주소창 색(theme-color)도 동기화
    el.style.colorScheme = next ? 'only light' : 'dark';
    let m = document.querySelector('meta[name="theme-color"]');
    if (!m) { m = document.createElement('meta'); m.setAttribute('name', 'theme-color'); document.head.appendChild(m); }
    m.setAttribute('content', next ? '#ffffff' : '#0C1210');
    setLight(next);
    window.dispatchEvent(new Event('themechange'));
  }

  return (
    <button id="theme-toggle" aria-label="테마 전환" onClick={toggle}>{light ? '☀️' : '🌙'}</button>
  );
}
