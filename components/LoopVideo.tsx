'use client';

import { useEffect, useRef, useState } from 'react';

// GIF 대체용 반복 영상 — 화면 근처에 올 때만 src를 넣어 내려받고, 화면 밖이면 일시정지.
// 소리 없는 자동 재생이라 모바일에서도 GIF처럼 동작한다. (동작 줄이기 설정이면 첫 프레임에서 정지)
export default function LoopVideo({ src, alt, className }: { src: string; alt?: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setNear(true);
        if (!reduce) v.play().catch(() => {});
      } else {
        v.pause();
      }
    }, { rootMargin: '200px 0px' });
    io.observe(v);
    return () => io.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      className={className}
      src={near ? src : undefined}
      muted
      loop
      playsInline
      autoPlay
      preload="none"
      aria-label={alt}
      title={alt}
    />
  );
}

/** .gif 경로면 같은 이름의 .mp4 경로를 돌려준다 (없으면 null) */
export function gifToVideo(src?: string): string | null {
  if (!src || !/\.gif$/i.test(src)) return null;
  return src.replace(/\.gif$/i, '.mp4');
}
