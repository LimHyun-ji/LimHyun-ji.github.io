import Link from 'next/link';
import { glue } from '@/lib/keepWords';
import type { TechCase } from '@/lib/content';
import { sortCompetencies, toneClass } from '@/lib/competency';

// 대표 기술 사례 목록 — 상세 페이지의 문제 해결 카드로 가는 목차 (태그 순서 · 색은 lib/competency.ts)
export default function CaseIndex({ cases }: { cases: TechCase[]; tagOrder?: string[] }) {
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
                  {sortCompetencies(c.tags).map((t) => <li key={t} className={toneClass(t)}>{glue(t)}</li>)}
                </ul>
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
