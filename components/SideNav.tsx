'use client';
import { useEffect, useRef, useState } from 'react';

export interface NavItem {
  id: string;
  label: string;
  indent?: boolean;
}

interface Props {
  items: NavItem[];
}

export default function SideNav({ items }: Props) {
  const [activeId, setActiveId] = useState<string>('');
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (items.length === 0) return;

    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      const visible = entries.filter((e) => e.isIntersecting);
      if (visible.length > 0) {
        const top = visible.reduce((a, b) =>
          a.boundingClientRect.top < b.boundingClientRect.top ? a : b
        );
        setActiveId(top.target.id);
      }
    };

    observerRef.current = new IntersectionObserver(handleIntersect, {
      rootMargin: '-60px 0px -55% 0px',
      threshold: 0,
    });

    items.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observerRef.current!.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - window.innerHeight / 3;
      window.scrollTo({ top: y, behavior: 'smooth' });
      history.replaceState(null, '', `#${id}`);
      setActiveId(id);
    }
  };

  return (
    <nav className="side-nav" aria-label="페이지 내 이동">
      <ul className="toc-list">
        {items.map(({ id, label, indent }) => (
          <li key={id} className={`toc-item${indent ? ' toc-level-3' : ' toc-level-2'}`}>
            <a
              href={`#${id}`}
              className={`toc-link${activeId === id ? ' toc-active' : ''}`}
              onClick={(e) => handleClick(e, id)}
            >
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
