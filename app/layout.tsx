import type { Metadata, Viewport } from 'next';
import './globals.css';
import ThemeToggle from '@/components/ThemeToggle';

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
  return (
    <html lang="ko">
      <body>
        <ThemeToggle />
        <main>{children}</main>
        <footer>
          <p>© {new Date().getFullYear()} 임현지. Built with Next.js.</p>
        </footer>
      </body>
    </html>
  );
}
