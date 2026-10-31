'use client';

import { useEffect, useRef } from 'react';
import sizes from '@/lib/videoSizes.json';

// GIF 대체용 반복 영상 — 소리 없는 자동 재생이라 모바일에서도 GIF처럼 동작한다.
// - width/height를 미리 지정해 로딩 중 레이아웃 밀림(CLS) 방지 (lib/videoSizes.json)
// - 화면 밖이면 일시정지, 동작 줄이기 설정이면 첫 프레임에서 정지
export default function LoopVideo({ src, alt, className }: { src: string; alt?: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const size = (sizes as Record<string, number[]>)[src];

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { v.pause(); return; }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) v.play().catch(() => {}); else v.pause();
    }, { rootMargin: '100px 0px' });
    io.observe(v);
    return () => io.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      className={className}
      src={src}
      width={size?.[0]}
      height={size?.[1]}
      style={{ height: 'auto' }}
      muted
      loop
      playsInline
      autoPlay
      preload="metadata"
      aria-label={alt}
      title={alt}
    />
  );
}
