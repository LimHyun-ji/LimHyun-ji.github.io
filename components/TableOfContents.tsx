'use client';
import { useEffect, useRef, useState } from 'react';

export interface Heading {
  id: string;
  text: string;
  level: number;
}

interface Props {
  headings: Heading[];
}

export default function TableOfContents({ headings }: Props) {
  const [activeId, setActiveId] = useState<string>('');
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (headings.length === 0) return;

    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      const visible = entries.filter((e) => e.isIntersecting);
      if (visible.length > 0) {
        const top = visible.reduce((a, b) =>
          a.boundingClientRect.top < b.boundingClientRect.top ? a : b
        );
        setActiveId(top.target.id);
      }
    };

    // DOM 렌더링 완료 후 observer 연결
    const timer = setTimeout(() => {
      observerRef.current = new IntersectionObserver(handleIntersect, {
        rootMargin: '-60px 0px -60% 0px',
        threshold: 0,
      });

      headings.forEach(({ id }) => {
        const el = document.getElementById(id);
        if (el) observerRef.current!.observe(el);
      });
    }, 100);

    return () => {
      clearTimeout(timer);
      observerRef.current?.disconnect();
    };
  }, [headings]);

  if (headings.length === 0) return null;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - window.innerHeight / 3;
      window.scrollTo({ top: y, behavior: 'smooth' });
      // URL 해시 업데이트
      history.replaceState(null, '', `#${id}`);
      setActiveId(id);
    }
  };

  return (
    <nav className="toc-sidebar" aria-label="목차">
      <p className="toc-title">목차</p>
      <ul className="toc-list">
        {headings.map(({ id, text, level }) => (
          <li key={id} className={`toc-item toc-level-${level}`}>
            <a
              href={`#${id}`}
              className={`toc-link${activeId === id ? ' toc-active' : ''}`}
              onClick={(e) => handleClick(e, id)}
            >
              {text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
