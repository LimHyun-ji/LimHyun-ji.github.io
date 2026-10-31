import Link from 'next/link';
import { getProfile, getProjects, getIdentity, getCases, type Project } from '@/lib/content';
import { sideProjects } from '@/lib/sideProjects';
import HeroParticles from '@/components/HeroParticles';
import CaseIndex from '@/components/CaseIndex';
import ThemeToggle from '@/components/ThemeToggle';
import KeepWords from '@/components/KeepWords';
import SideNav, { type NavItem } from '@/components/SideNav';
import { glue } from '@/lib/keepWords';

// 담당 시스템 그룹 — 직무 대조용(클라이언트 / 엔진 툴). 그룹 안 순서는 slugs 순서를 따름. 목록에 없는 slug는 마지막 그룹으로.
// tone: 그룹 색 (a = 민트 accent, b = 골드 accent-2)
const PROJECT_GROUPS = [
  { title: '인게임 클라이언트 — 시스템 · 전투 · 연출', tone: 'a', slugs: ['visualdata', 'combat', 'sol-content', 'mapdesign'] },
  { title: '엔진 툴 · 기술 기반 — 성능 · 툴 · 파이프라인', tone: 'b', slugs: ['optimization', 'areatool', 'visualdata-editor'] },
];

// 담당 시스템 한 줄 — 사례 글의 근거 색인 역할(제목 · 요약 한 줄)
function SystemRow({ a }: { a: Project }) {
  return (
    <li>
      <Link id={`proj-${a.slug}`} className="sys-row" href={`/projects/${a.slug}/`}>
        <h4><KeepWords text={a.title.split(' — ')[0]} /><span className="arrow">{'\u00a0'}→</span></h4>
        <p>{glue(a.summary ?? '')}</p>
      </Link>
    </li>
  );
}

export default function Home() {
  const p = getProfile();
  const id = getIdentity();
  const areas = getProjects(); // Sol 내 세부 영역
  const tc = getCases();
  const grouped = PROJECT_GROUPS.map((g) => ({
    ...g,
    items: g.slugs.map((x) => areas.find((a) => a.slug === x)).filter((a): a is Project => Boolean(a)),
  }));
  const known = new Set(PROJECT_GROUPS.flatMap((g) => g.slugs));
  const rest = areas.filter((a) => !known.has(a.slug));
  if (rest.length) grouped[grouped.length - 1].items.push(...rest);
  // 히어로 우측 스킬 패널 — 사이트의 유일한 스킬 표시 영역(전체 카테고리)
  const heroSkills = p.skills ?? [];
  // 히어로 우측 이력 (연도 역순)
  const history = p.history ?? [];

  // 사이드 네비 항목 — 섹션 단위
  const navItems: NavItem[] = [
    { id: 'cases', label: '기술 사례' },
    { id: 'sol', label: 'Sol' },
    { id: 'systems', label: '담당 시스템', indent: true },
    { id: 'side', label: 'Side' },
    { id: 'history', label: '이력' },
  ];

  return (
    <>
      {/* 데스크톱 사이드 네비 */}
      <SideNav items={navItems} />

      {/* NAV */}
      <nav className="nav">
        <a className="nav-brand" href="#top">임현지 Portfolio</a>
        <div className="nav-links">
          <a href="#cases">기술 사례</a>
          <a href="#sol">Sol</a>
          <a href="#side">Side Projects</a>
          <a href="#history">이력</a>
          {p.links?.github && <a href={p.links.github} target="_blank" rel="noopener">GitHub</a>}
          <ThemeToggle />
        </div>
      </nav>

      {/* HERO */}
      <div className="hero-wrap">
        <HeroParticles />
        <header className="lead" id="top">
          <div className="lead-main">
            {/* 프로필 사진 + 이름 영역 */}
            <div className="lead-profile-row">
              {p.photo ? (
                <div className="lead-photo">
                  <img src={p.photo} alt={`${p.name} 프로필 사진`} />
                </div>
              ) : (
                <div className="lead-photo lead-photo-empty" aria-label={`${p.name} 개발자 프로필`}>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="7" r="3.7" fill="currentColor" />
                    <path d="M4.5 20.3c0-4 3.4-6.6 7.5-6.6s7.5 2.6 7.5 6.6v.2H4.5z" fill="currentColor" />
                    <g fill="none" stroke="var(--photo-bg)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.3 16.4 9 17.8l1.3 1.4" />
                      <path d="M13.7 16.4 15 17.8l-1.3 1.4" />
                      <path d="M12.6 16.1l-1.2 3.9" />
                    </g>
                  </svg>
                </div>
              )}
              <div>
                <p className="lead-eyebrow">{p.role}</p>
                <h1 className="lead-name">{p.name}</h1>
              </div>
            </div>
            {id.tagline && <p className="lead-tagline">{glue(id.tagline)}</p>}
            <p className="lead-headline">{glue(p.headline)}</p>
            {heroSkills.length > 0 && (
              <ul className="lead-keywords" id="skills" aria-label="기술스택">
                {heroSkills.flatMap((g, gi) =>
                  g.items.map((it) => (
                    <li key={g.category + it} className={gi % 2 ? 'kw-alt' : undefined} title={g.category}>{glue(it)}</li>
                  )))}
              </ul>
            )}
            <div className="lead-actions">
              {p.links?.github && <a className="btn" href={p.links.github} target="_blank" rel="noopener">GitHub</a>}
              {p.links?.email && <a className="btn ghost" href={`mailto:${p.links.email}`}>Email</a>}
            </div>
          </div>
          {history.length > 0 && (
            <aside className="lead-history" id="history" aria-label="이력">
              <ol className="lh-list">
                {history.map((h) => (
                  <li className={`lh-item lh-${h.kind ?? 'activity'}`} key={h.period + h.title}>
                    <span className="lh-period">{glue(h.period)}</span>
                    <span className="lh-body">
                      <span className="lh-title">{glue(h.title)}</span>
                      {h.sub && <span className="lh-sub">{glue(h.sub)}</span>}
                    </span>
                  </li>
                ))}
              </ol>
            </aside>
          )}
        </header>
      </div>

      {/* CASES — 기술 사례: 사이트의 중심. 태그(공고 키워드)로 거르고, 사례 하나에 태그 여러 개 */}
      {tc.cases.length > 0 && (
        <section className="cases-sec" id="cases">
          <div className="featured-tag">◈ Case Studies · 기술 사례</div>
          <h2 className="cases-h">{glue('문제 하나를 끝까지 판 기록')}</h2>
          <p className="cases-sub">{glue('분야 태그로 거를 수 있습니다. 각 사례는 상황 → 원인 → 선택한 방법과 이유 → 결과 순서로 정리합니다.')}</p>
          <CaseIndex cases={tc.cases} tagOrder={tc.tagOrder} />
        </section>
      )}

      {/* FEATURED — SOL (메인 프로젝트, 크게) */}
      <section className="featured" id="sol">
        <div className="featured-tag">◆ Main Project · 메인 프로젝트</div>
        <div className="featured-intro">
          <div className="featured-text">
            <h2 className="featured-title">Sol — UE5 MMORPG</h2>
            {p.experience?.[0] && <p className="featured-meta">{glue(`${p.experience[0].org ?? ''} · ${p.experience[0].period ?? ''}`)}</p>}
            <p className="featured-sub">
              {glue('커스텀 Unreal Engine 5 브랜치 기반 모바일 / PC MMORPG. 2023년부터 클라이언트 시스템 · 엔진 툴 · 최적화를 맡고 있습니다.')}
            </p>
          </div>
          <figure className="featured-banner">
            <img src="/images/projects/sol-banner.jpg" alt="SOL enchant 공식 키 아트 — 넷마블 · ALT9 전지적 MMORPG" />
            <figcaption>© Netmarble Corp. &amp; ALT9 Inc. All Rights Reserved.</figcaption>
          </figure>
        </div>
        <div id="systems" className="systems">
          <h3 className="systems-h">담당 시스템<span>{glue(' — 사례의 배경이 되는 시스템')}</span></h3>
          <div className="sys-groups">
            {grouped.filter((g) => g.items.length > 0).map((g) => (
              <div className={`sys-group tone-${g.tone}`} key={g.title}>
                <h4 className="sys-group-h"><KeepWords text={g.title} /></h4>
                <ul className="sys-list">{g.items.map((a) => <SystemRow a={a} key={a.slug} />)}</ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SIDE PROJECTS — 학부 · 개인 프로젝트 (작은 카드로 비중을 낮춤) */}
      <section className="side-band" id="side">
       <div className="side-inner">
        <div className="featured-tag">▚ Side Projects · 학부 · 개인 프로젝트</div>
        <p className="section-note">{glue(`개인 · 학습 · 팀 프로젝트 (${sideProjects.length})`)}</p>
        <div className="side-grid-sm">
          {sideProjects.slice(0, 4).map((sp) => (
            <Link className="sp-card-sm" href={`/side/${sp.slug}/`} key={sp.slug}>
              <div className="sp-sm-hero">
                <img src={sp.image} alt={sp.title} loading="lazy" />
                <span className="sp-sm-engine">{sp.engine}</span>
              </div>
              <div className="sp-sm-body">
                <h4><KeepWords text={sp.title} /></h4>
                <p className="sp-sm-sub">{glue(sp.subtitle)}</p>
              </div>
            </Link>
          ))}
        </div>
        <div className="side-grid-xs" aria-label="그 외 프로젝트">
          {sideProjects.slice(4).map((sp) => (
            <Link className="sp-card-xs" href={`/side/${sp.slug}/`} key={sp.slug}>
              <img src={sp.image} alt="" loading="lazy" />
              <div className="sp-xs-body">
                <h4><KeepWords text={sp.title} /></h4>
                <p className="sp-xs-sub">{glue(sp.engine)}</p>
              </div>
            </Link>
          ))}
        </div>
       </div>
      </section>

    </>
  );
}
