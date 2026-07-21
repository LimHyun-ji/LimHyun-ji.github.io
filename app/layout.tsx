import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '임현지 · Game Client Developer',
  description: 'Unreal Engine 기반 게임 클라이언트 개발자 포트폴리오',
  robots: { index: false, follow: false }, // 비공개 운영 (noindex)
};

// color-scheme 선언 → 모바일 브라우저 강제 다크(자동 재색조) 차단, PC·모바일 색 일치
export const viewport: Viewport = {
  colorScheme: 'dark light',
  themeColor: '#0C1210',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // 첫 페인트 전에 저장된 테마를 적용(플래시 방지) + color-scheme을 테마에 맞춰 즉시 지정
  // → 모바일 강제 다크(자동 재색조) 옵트아웃 및 하이드레이션 이전 상태 확정
  const themeInit = `(function(){try{var t=localStorage.getItem('theme');var l=(t==='light');var d=document.documentElement;if(l)d.setAttribute('data-theme','light');d.style.colorScheme=l?'light':'dark';}catch(e){}})();`;

  return (
    <html lang="ko">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>
        <main>{children}</main>
        <footer>
          <p>© {new Date().getFullYear()} 임현지. Built with Next.js.</p>
        </footer>
      </body>
    </html>
  );
}
