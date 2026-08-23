import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { getProject, getSlugs } from '@/lib/content';
import Mermaid from '@/components/Mermaid';
import ThemeToggle from '@/components/ThemeToggle';
import ImageGallery from '@/components/ImageGallery';
import ImageSlider from '@/components/ImageSlider';

export function generateStaticParams() {
  return getSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const proj = getProject(params.slug);
  return { title: `${proj.title} · 임현지`, robots: { index: false, follow: false } };
}

export default function ProjectPage({ params }: { params: { slug: string } }) {
  const proj = getProject(params.slug);
  const images = (proj.images ?? []).map((img) =>
    typeof img === 'string' ? { src: img } : img
  );

  return (
    <article className="project-detail">
      <div className="detail-topbar">
        <Link className="back" href="/#sol">← 프로젝트 목록</Link>
        <ThemeToggle />
      </div>

      <header className="detail-head">
        <p className="eyebrow">{proj.role}{proj.period ? ` · ${proj.period}` : ''}</p>
        <h1>{proj.title}</h1>
        {proj.summary && <p className="headline">{proj.summary}</p>}
        {proj.tags && <ul className="chips small">{proj.tags.map((t) => <li key={t}>{t}</li>)}</ul>}
      </header>

      {/* 이미지: slider 또는 gallery */}
      {images.length > 0 && (
        proj.imageLayout === 'slider'
          ? <ImageSlider images={images} />
          : <ImageGallery images={images} slug={proj.slug} />
      )}

      {proj.highlights && (
        <>
          <h2>주요 작업</h2>
          <ul className="highlights big">{proj.highlights.map((h, i) => <li key={i}>{h}</li>)}</ul>
        </>
      )}

      <div className="detail-body">
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
          {proj.body}
        </ReactMarkdown>
      </div>

      <Link className="back bottom" href="/#projects">← 프로젝트 목록으로</Link>
      <Mermaid />
    </article>
  );
}
