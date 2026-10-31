import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Inter, JetBrains_Mono } from 'next/font/google';
import ScrollReveal from '@/components/ScrollReveal';
import Analytics from '@/components/Analytics';

// 글꼴을 빌드 시 내려받아 같은 도메인에서 제공 (외부 CSS 요청 · 렌더링 차단 제거)
const inter = Inter({ subsets: ['latin'], weight: ['400', '600', '700', '800'], display: 'swap', variable: '--font-inter' });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '600', '700'], display: 'swap', variable: '--font-mono' });

export const metadata: Metadata = {
  title: '임현지 · Game Client Developer',
  description: 'Unreal Engine 기반 게임 클라이언트 개발자 포트폴리오',
  robots: { index: false, follow: false }, // 비공개 운영 (noindex)
};

// color-scheme 선언 → 모바일 브라우저 강제 다크(자동 재색조) 차단, PC·모바일 색 일치
export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: '#ffffff',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // 기본 테마는 라이트. 사용자가 다크를 선택해 저장한 경우에만 다크로 전환
  // 첫 페인트 전에 저장된 테마를 적용(플래시 방지) + color-scheme을 테마에 맞춰 즉시 지정
  // → 모바일 강제 다크(자동 재색조) 옵트아웃 및 하이드레이션 이전 상태 확정
  const themeInit = `(function(){try{var t=localStorage.getItem('theme');var l=(t!=='dark');var d=document.documentElement;if(l)d.setAttribute('data-theme','light');else d.removeAttribute('data-theme');d.style.colorScheme=l?'only light':'dark';var m=document.querySelector('meta[name=\\"theme-color\\"]');if(!m){m=document.createElement('meta');m.setAttribute('name','theme-color');d.querySelector('head').appendChild(m);}m.setAttribute('content',l?'#ffffff':'#0C1210');}catch(e){}})();`;

  return (
    <html lang="ko" data-theme="light" className={`${inter.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>
        <main>{children}</main>
        <ScrollReveal />
        <Analytics />
        <footer>
          <p>© {new Date().getFullYear()} 임현지. Built with Next.js.</p>
        </footer>
      </body>
    </html>
  );
}
