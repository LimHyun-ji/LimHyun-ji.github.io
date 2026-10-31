import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';
import { getProject, getSlugs } from '@/lib/content';
import Mermaid from '@/components/Mermaid';
import ThemeToggle from '@/components/ThemeToggle';
import ImageGallery from '@/components/ImageGallery';
import ImageSlider from '@/components/ImageSlider';
import CodeToggle from '@/components/CodeToggle';
import KeepWords from '@/components/KeepWords';
import TableOfContents, { type Heading } from '@/components/TableOfContents';
import { glue, rehypeKeepWords } from '@/lib/keepWords';
import { sortCompetencies, toneClass } from '@/lib/competency';
import type { Components } from 'react-markdown';

export function generateStaticParams() {
  return getSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const proj = getProject(params.slug);
  return { title: `${proj.title} · 임현지`, robots: { index: false, follow: false } };
}

/** 마크다운 본문에서 ## / ### 헤더를 추출해 TOC 배열로 반환 */
function extractHeadings(markdown: string): Heading[] {
  const lines = markdown.split('\n');
  const headings: Heading[] = [];
  let inImpl = false; // 현재 '## 구현 내용' 섹션 안인지
  let inFence = false;
  for (const line of lines) {
    if (/^\s*```/.test(line)) { inFence = !inFence; continue; }
    if (inFence) continue;
    const m = line.match(/^(#{2,3})\s+(.+)/);
    if (!m) continue;
    const level = m[1].length as 2 | 3;
    if (level === 2) inImpl = /^구현 내용\s*$/.test(m[2].trim());
    // ### 세부 제목은 '구현 내용' 하위만 목차에 포함
    if (level === 3 && !inImpl) continue;
    const raw = m[2].replace(/\*\*/g, '').replace(/`[^`]*`/g, (s) => s.slice(1, -1)).trim();
    // 사이드바용 축약: "— 설명" 부분 제거, 번호 접두사 제거, (### 은) 끝 괄호 설명 제거
    let text = raw.replace(/\s*[—–]\s*.+$/, '').replace(/^\d+\.\s*/, '').trim();
    if (level === 3) text = text.replace(/\s*\([^)]*\)\s*$/, '').trim() || text;
    // id는 원본(raw) 기준으로 생성 — 헤더 렌더러와 일치시킴
    const id = raw
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\uAC00-\uD7A3\uFF00-\uFFEF-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    if (id) headings.push({ id, text, level });
  }
  return headings;
}

/** ReactMarkdown 커스텀 heading 렌더러 — id 속성 부여 */
function makeHeadingComponents(headings: Heading[]): Partial<Components> {
  // 각 레벨별 등장 순서로 id 매핑
  const idMap: Record<string, string> = {};
  headings.forEach(({ id, text }) => { idMap[text] = id; });

  function renderHeading(level: 2 | 3) {
    const Tag = `h${level}` as 'h2' | 'h3';
    return function HeadingRenderer({ children, ...rest }: React.HTMLAttributes<HTMLHeadingElement>) {
      const text = String(children ?? '');
      const id = idMap[text] ?? text
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\uAC00-\uD7A3\uFF00-\uFFEF-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      return <Tag id={id} {...rest}>{children}</Tag>;
    };
  }

  return {
    h2: renderHeading(2),
    h3: renderHeading(3),
  };
}

export default function ProjectPage({ params }: { params: { slug: string } }) {
  const proj = getProject(params.slug);
  const images = (proj.images ?? []).map((img) =>
    typeof img === 'string' ? { src: img } : img
  );
  const headings = extractHeadings(proj.body);
  const headingComponents = makeHeadingComponents(headings);

  return (
    <article className="project-detail">
      <div className="detail-topbar">
        <Link className="back" href="/#sol">← 프로젝트 목록</Link>
        <ThemeToggle />
      </div>

      <header className="detail-head">
        <p className="eyebrow">{glue(`${proj.role ?? ''}${proj.period ? ` · ${proj.period}` : ''}`)}</p>
        <h1><KeepWords text={proj.title} /></h1>
        {proj.summary && <p className="headline">{glue(proj.summary)}</p>}
        {proj.tags && <ul className="chips small">{sortCompetencies(proj.tags).map((t) => <li key={t} className={toneClass(t)}>{glue(t)}</li>)}</ul>}
      </header>

      {/* 이미지: slider 또는 gallery */}
      {images.length > 0 && (
        proj.imageLayout === 'slider'
          ? <ImageSlider images={images} />
          : <ImageGallery images={images} slug={proj.slug} />
      )}

      {/* 본문 + 오른쪽 TOC */}
      <div className="toc-layout">
        <div className="detail-body toc-layout-main">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw, [rehypeHighlight, { detect: false, plainText: ['mermaid', 'text'] }], rehypeKeepWords]}
            components={headingComponents}
          >
            {proj.body}
          </ReactMarkdown>
        </div>
        <TableOfContents headings={headings} />
      </div>

      <Link className="back bottom" href="/#projects">← 프로젝트 목록으로</Link>
      <Mermaid />
      <CodeToggle />
    </article>
  );
}
