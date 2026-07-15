'use client';
import { useEffect } from 'react';

// .mermaid 블록을 클라이언트에서 렌더 (테마 토글 시 재렌더)
export default function Mermaid() {
  useEffect(() => {
    let sources: string[] = [];
    let mermaidMod: typeof import('mermaid').default | null = null;

    async function render() {
      const nodes = Array.from(document.querySelectorAll<HTMLElement>('.mermaid'));
      if (!nodes.length) return;
      if (!mermaidMod) mermaidMod = (await import('mermaid')).default;
      if (!sources.length) sources = nodes.map(n => n.textContent || '');
      const isDark = !document.documentElement.getAttribute('data-theme');
      mermaidMod.initialize({
        startOnLoad: false,
        theme: isDark ? 'dark' : 'neutral',
        securityLevel: 'loose',
        flowchart: { curve: 'basis', useMaxWidth: true },
      });
      nodes.forEach((n, i) => { n.removeAttribute('data-processed'); n.innerHTML = sources[i]; });
      await mermaidMod.run({ nodes });
    }

    render();
    const onTheme = () => setTimeout(render, 60);
    window.addEventListener('themechange', onTheme);
    return () => window.removeEventListener('themechange', onTheme);
  }, []);

  return null;
}
