'use client';

import Script from 'next/script';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

// Google Analytics 4 — 빌드 시 NEXT_PUBLIC_GA_ID가 있을 때만 동작 (없으면 아무것도 넣지 않음).
// GitHub 저장소 Settings → Secrets and variables → Actions → Variables에 NEXT_PUBLIC_GA_ID(G-XXXXXXX)를 등록하면 배포에 반영된다.
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

type Gtag = (...args: unknown[]) => void;
// gtag 스크립트가 늦게 로드돼도 이벤트가 사라지지 않도록 dataLayer 큐에 먼저 쌓는다
const gtag: Gtag = (...args) => {
  const w = window as unknown as { gtag?: Gtag; dataLayer?: unknown[] };
  if (!w.gtag) {
    w.dataLayer = w.dataLayer || [];
    // eslint-disable-next-line prefer-rest-params
    w.gtag = function () { w.dataLayer!.push(arguments); } as Gtag;
    // 큐 맨 앞에 초기화 명령을 넣어, 스크립트 로드 전 이벤트도 이 측정 ID로 전송되게 한다
    w.gtag('js', new Date());
    w.gtag('config', GA_ID, { send_page_view: false });
  }
  w.gtag(...args);
};

export default function Analytics() {
  const pathname = usePathname();

  // 클라이언트 라우팅마다 페이지뷰
  useEffect(() => {
    if (!GA_ID) return;
    gtag('event', 'page_view', { page_path: pathname, page_location: window.location.href, page_title: document.title });
  }, [pathname]);

  // 어떤 링크가 눌렸는지 — 기술 사례 · 담당 시스템 · 사이드 프로젝트 · GitHub · 이메일 등
  useEffect(() => {
    if (!GA_ID) return;
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest('a');
      if (!a) return;
      const section = a.closest('section[id], header[id], div[id]')?.id ?? '';
      gtag('event', 'link_click', {
        link_url: a.getAttribute('href') ?? '',
        link_text: (a.textContent ?? '').trim().slice(0, 60),
        section,
        page_path: window.location.pathname,
      });
    };
    document.addEventListener('click', onClick, { capture: true });
    return () => document.removeEventListener('click', onClick, { capture: true });
  }, []);

  if (!GA_ID) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
    </>
  );
}
