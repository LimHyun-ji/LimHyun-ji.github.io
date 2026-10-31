'use client';

import { useState } from 'react';
import Link from 'next/link';
import { glue } from '@/lib/keepWords';
import type { TechCase } from '@/lib/content';

// 기술 사례 목록 + 태그 필터. 태그는 채용 공고 키워드이고, 사례 하나에 여러 태그가 붙을 수 있다.
export default function CaseIndex({ cases, tagOrder }: { cases: TechCase[]; tagOrder: string[] }) {
  const [tag, setTag] = useState<string | null>(null);
  const used = new Set(cases.flatMap((c) => c.tags));
  const tags = [...tagOrder.filter((t) => used.has(t)), ...[...used].filter((t) => !tagOrder.includes(t))];
  const shown = tag ? cases.filter((c) => c.tags.includes(tag)) : cases;

  return (
    <div className="ci">
      <div className="ci-tags" role="group" aria-label="분야로 거르기">
        <button className={`ci-tag${tag === null ? ' on' : ''}`} aria-pressed={tag === null} onClick={() => setTag(null)}>
          전체
        </button>
        {tags.map((t) => (
          <button key={t} className={`ci-tag${tag === t ? ' on' : ''}`} aria-pressed={tag === t}
            onClick={() => setTag(tag === t ? null : t)}>
            {glue(t)}
          </button>
        ))}
      </div>

      <ol className="ci-list">
        {shown.map((c) => (
          <li key={c.id}>
            <Link className="ci-item" href={c.link}>
              <div className="ci-main">
                <h3>{glue(c.title)}<span className="arrow">{' '}→</span></h3>
                <p>{glue(c.summary)}</p>
                <ul className="ci-item-tags">
                  {c.tags.map((t) => <li key={t} className={t === tag ? 'on' : ''}>{glue(t)}</li>)}
                </ul>
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
