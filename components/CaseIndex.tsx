import Link from 'next/link';
import { glue } from '@/lib/keepWords';
import type { TechCase } from '@/lib/content';

// 대표 기술 사례 목록 — 상세 페이지의 문제 해결 카드로 가는 목차 (tagOrder는 태그 표시 순서에만 사용)
export default function CaseIndex({ cases, tagOrder }: { cases: TechCase[]; tagOrder: string[] }) {
  const rank = (t: string) => { const i = tagOrder.indexOf(t); return i < 0 ? 99 : i; };
  return (
    <div className="ci">
      <ol className="ci-list">
        {cases.map((c) => (
          <li key={c.id}>
            <Link className="ci-item" href={c.link}>
              <div className="ci-main">
                <h3>{glue(c.title)}<span className="arrow">{' '}→</span></h3>
                <p>{glue(c.summary)}</p>
                <ul className="ci-item-tags">
                  {[...c.tags].sort((a, b) => rank(a) - rank(b)).map((t) => <li key={t}>{glue(t)}</li>)}
                </ul>
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
