import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeRaw from 'rehype-raw';
import { getSideDetail, getSideSlugs } from '@/lib/sideContent';
import ThemeToggle from '@/components/ThemeToggle';
import DocPreview from '@/components/DocPreview';

export function generateStaticParams() {
  return getSideSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const d = getSideDetail(params.slug);
  return { title: `${d.title} · 임현지`, robots: { index: false, follow: false } };
}

function ytEmbed(url?: string): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]+)/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

export default function SideProjectPage({ params }: { params: { slug: string } }) {
  const d = getSideDetail(params.slug);
  const embed = ytEmbed(d.video || d.links?.video);
  const docUrl = d.links?.doc || undefined;

  return (
    <article className="project-detail">
      <div className="detail-topbar">
        <Link className="back" href="/#side">← 사이드 프로젝트</Link>
        <ThemeToggle />
      </div>

      <header className="detail-head">
        <p className="eyebrow">Side Project{d.engine ? ` · ${d.engine}` : ''}{d.period ? ` · ${d.period}` : ''}</p>
        <h1>{d.title}</h1>
        {d.subtitle && <p className="headline">{d.subtitle}</p>}
        <ul className="detail-meta">
          {d.team && <li>👥 {d.team}</li>}
          {d.status && d.status !== '숨기기' && <li>⭐ {d.status}</li>}
        </ul>
        {d.tags && <ul className="chips small">{d.tags.map((t) => <li key={t}>{t}</li>)}</ul>}
        <div className="detail-links">
          {(d.links?.video || d.video) && <a href={d.links?.video || d.video} target="_blank" rel="noopener">▶ 영상</a>}
          {d.links?.git && <a href={d.links.git} target="_blank" rel="noopener">GitHub</a>}
          {docUrl && <a href={docUrl} target="_blank" rel="noopener">기술소개서</a>}
        </div>
      </header>

      {embed && (
        <div className="detail-video">
          <iframe src={embed} title={d.title} loading="lazy" allowFullScreen
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
        </div>
      )}

      {/* 경력기술서 미리보기 */}
      {docUrl && <DocPreview url={docUrl} title={`${d.title} 기술소개서`} />}

      <div className="detail-body">
        <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} rehypePlugins={[rehypeRaw]}>
          {d.body}
        </ReactMarkdown>
      </div>

      <Link className="back bottom" href="/#side">← 사이드 프로젝트로</Link>
    </article>
  );
}
