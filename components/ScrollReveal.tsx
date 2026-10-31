'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

// 스크롤 등장 효과 — 카드류가 화면에 들어올 때 아래에서 떠오르며 나타난다.
// JS가 동작할 때만 <html>에 .reveal-ready를 붙여 숨김 상태를 만든다 (JS 없음 · 동작 줄이기 설정이면 그대로 표시).
const TARGETS = [
  '.ci-list > li', '.sys-row', '.sp-card-sm', '.sp-card-xs', '.lh-item', '.lst-row',
  '.detail-body .case', '.detail-body > h2', '.detail-body > h3', '.detail-body .shot-row', '.detail-body img.diagram',
].join(',');

export default function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const root = document.documentElement;
    root.classList.add('reveal-ready');

    const els = Array.from(document.querySelectorAll<HTMLElement>(TARGETS));
    // 같은 부모 안에서 순서대로 조금씩 늦게 등장 (최대 5단계)
    const order = new Map<Element, number>();
    els.forEach((el) => {
      const p = el.parentElement;
      const i = p ? (order.get(p) ?? 0) : 0;
      if (p) order.set(p, i + 1);
      el.style.setProperty('--reveal-delay', `${Math.min(i, 5) * 60}ms`);
      el.classList.add('reveal');
    });

    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target as HTMLElement;
        el.classList.add('is-visible');
        io.unobserve(el);
        // 등장 애니메이션이 끝난 뒤 hover용 빠른 transition으로 교체
        const delay = parseInt(el.style.getPropertyValue('--reveal-delay') || '0', 10);
        window.setTimeout(() => el.classList.add('settled'), 650 + delay);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach((el) => io.observe(el));

    return () => io.disconnect();
  }, [pathname]);

  return null;
}
