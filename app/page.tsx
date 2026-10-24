import Link from 'next/link';
import { getProfile, getProjects, getIdentity, type Project } from '@/lib/content';
import { sideProjects } from '@/lib/sideProjects';
import HeroParticles from '@/components/HeroParticles';
import ThemeToggle from '@/components/ThemeToggle';
import KeepWords from '@/components/KeepWords';
import { glue } from '@/lib/keepWords';

// 메인 프로젝트 그룹 — 성장 순서(게임플레이 시스템 → 기술 기반). 목록에 없는 slug는 마지막 그룹으로.
// tone: 그룹 색 (a = 민트 accent, b = 골드 accent-2)
const PROJECT_GROUPS = [
  { title: '게임플레이 시스템', tone: 'a', slugs: ['visualdata', 'sol-content', 'mapdesign'] },
  { title: '기술 기반 — 툴 · 성능 · 에셋 로딩 · 안정성', tone: 'b', slugs: ['editor-tools', 'optimization', 'rendering-cinema', 'live-stability'] },
];

function ProjectCard({ a, no }: { a: Project; no: number }) {
  return (
    <Link className="area-card" href={`/projects/${a.slug}/`}>
      <span className="area-no">{String(no).padStart(2, '0')}</span>
      <h3><KeepWords text={a.title} /><span className="arrow">{'\u00a0'}→</span></h3>
      <p>{glue(a.summary ?? '')}</p>
      {a.tags && <ul className="chips small">{a.tags.slice(0, 4).map((t) => <li key={t}>{t}</li>)}</ul>}
    </Link>
  );
}

export default function Home() {
  const p = getProfile();
  const id = getIdentity();
  const areas = getProjects(); // Sol 내 세부 영역
  const grouped = PROJECT_GROUPS.map((g) => ({ ...g, items: areas.filter((a) => g.slugs.includes(a.slug)) }));
  const known = new Set(PROJECT_GROUPS.flatMap((g) => g.slugs));
  const rest = areas.filter((a) => !known.has(a.slug));
  if (rest.length) grouped[grouped.length - 1].items.push(...rest);
  let projectNo = 0;
  // 히어로 우측 스킬 패널 — 사이트의 유일한 스킬 표시 영역(전체 카테고리)
  const heroSkills = p.skills ?? [];

  return (
    <>
      {/* NAV */}
      <nav className="nav">
        <a className="nav-brand" href="#top">임현지 Portfolio</a>
        <div className="nav-links">
          <a href="#sol">Sol</a>
          <a href="#side">Side Projects</a>
          <a href="#skills">Skills</a>
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
            {p.keywords && (
              <ul className="lead-keywords">
                {p.keywords.map((k) => <li key={k}>{glue(k)}</li>)}
              </ul>
            )}
            {p.about && (
              <ul className="lead-bio">
                {p.about.school && p.about.school.split('\n').map((line, i, arr) => (
                  <li key={i}><span className="bi">{i === 0 ? '🎓' : ''}</span>{glue(line)}
                    {i === arr.length - 1 && p.about?.schoolPeriod && <em className="bi-sub"> · {glue(p.about.schoolPeriod)}</em>}</li>
                ))}
                {p.about.highschool && <li><span className="bi">🏫</span>{glue(p.about.highschool)}</li>}
              </ul>
            )}
            <div className="lead-actions">
              {p.links?.github && <a className="btn" href={p.links.github} target="_blank" rel="noopener">GitHub</a>}
              {p.links?.email && <a className="btn ghost" href={`mailto:${p.links.email}`}>Email</a>}
            </div>
          </div>
          {heroSkills.length > 0 && (
            <aside className="lead-skills" id="skills" aria-label="Skills">
              {heroSkills.map((g) => (
                <div className="ls-row" key={g.category}>
                  <span className="ls-cat">{g.category}</span>
                  <span className="ls-vals">
                    {g.items.map((it, i) => (
                      <span key={it}>{i > 0 && <i className="ls-sep">·</i>}{it}</span>
                    ))}
                  </span>
                </div>
              ))}
            </aside>
          )}
        </header>
      </div>

      {/* CAREER — 이력 한눈에 (진입 시 바로 보이는 요약) */}
      {p.experience && (
        <section className="career" id="career">
          <div className="featured-tag">◈ Career · 이력 한눈에</div>
          {p.experience[0] && (
            <h2 className="career-head">
              {glue(p.experience[0].org ?? '')}
              <span className="career-period"> · {glue(p.experience[0].period ?? '')}</span>
            </h2>
          )}
          {id.growthIntro && <p className="career-intro">{glue(id.growthIntro)}</p>}
          <div className="career-grid">
            {p.experience.slice(1).map((e, i) => {
              const g = id.growth?.find((x) => x.period === e.period);
              return (
                <div className="career-card" key={i}>
                  <div className="career-year">{e.period}</div>
                  {g && (
                    <div className="career-growth">
                      <span className="cg-problem">{glue(g.problem)}</span>
                      <span className="cg-area">→ {glue(g.area)}</span>
                    </div>
                  )}
                  <h3><KeepWords text={(e.org ?? '').replace(/^\d{4}\s*—\s*/, '')} /></h3>
                  <p>{glue(e.desc ?? '')}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* FEATURED — SOL (메인 프로젝트, 크게) */}
      <section className="featured" id="sol">
        <div className="featured-tag">◆ Main Project · 메인 프로젝트</div>
        <div className="featured-intro">
          <div className="featured-text">
            <h2 className="featured-title">Sol — UE5 MMORPG</h2>
            <p className="featured-sub">
              {glue('커스텀 Unreal Engine 5 브랜치 기반 모바일/PC MMORPG. VisualData 캐릭터 시스템 · 퍼포먼스/메모리 최적화 · '
                + '인게임 콘텐츠&네트워크 · 인게임 연출&비동기 로딩 · 실시간 맵 설계 · 데이터 파이프라인 · 라이브 안정화까지')}{' '}
              <strong>{glue('직접 설계·담당.')}</strong>
            </p>
          </div>
          <figure className="featured-banner">
            <img src="/images/projects/sol-banner.jpg" alt="SOL enchant 공식 키 아트 — 넷마블 · ALT9 전지적 MMORPG" />
            <figcaption>© Netmarble Corp. &amp; ALT9 Inc. All Rights Reserved.</figcaption>
          </figure>
        </div>
        <img className="arch-diagram" src="/images/diagrams/sol-architecture.svg"
          alt="Sol 클라이언트 서버 아키텍처: 로비(HTTP)·게임서버 Geo(TCP)·Noti(WebSocket)·API(HTTP 다수) → USolGeoSubsystem·UNetworkNotiClient → Feature Managers (URL은 USolConfigSubsystem)" loading="lazy" />
        {grouped.filter((g) => g.items.length > 0).map((g, gi) => (
          <div className={`area-group tone-${g.tone}`} key={g.title}>
            <h3 className="area-group-title"><span>{String(gi + 1).padStart(2, '0')}</span><KeepWords text={g.title} /></h3>
            <div className="area-grid">
              {g.items.map((a) => <ProjectCard a={a} no={++projectNo} key={a.slug} />)}
            </div>
          </div>
        ))}
      </section>

      {/* SIDE PROJECTS (하단, 별도 밴드로 명확히 분리) */}
      <section className="side-band" id="side">
       <div className="side-inner">
        <div className="featured-tag">▚ Side Projects · 사이드 프로젝트</div>
        <h2 className="section-h">Side Projects</h2>
        <p className="section-note">{glue(`개인·학습·팀 프로젝트 (${sideProjects.length}) — Notion 포트폴리오 기반`)}</p>

        {/* 주요 프로젝트 (중요도 상위 5 · 큰 카드) */}
        <h3 className="side-sub">주요 프로젝트</h3>
        <div className="side-grid">
          {sideProjects.slice(0, 5).map((sp) => (
            <Link className="sp-card" href={`/side/${sp.slug}/`} key={sp.slug}>
              <div className="sp-hero">
                <img src={sp.image} alt={sp.title} loading="lazy" />
                <span className="sp-engine">{sp.engine}</span>
              </div>
              <div className="sp-body">
                <h3><KeepWords text={sp.title} /></h3>
                <p className="sp-sub">{glue(sp.subtitle)}</p>
                <p className="sp-desc">{glue(sp.desc)}</p>
                <ul className="chips small">{sp.tags.map((t) => <li key={t}>{t}</li>)}</ul>
                <span className="sp-more">자세히 보기 →</span>
              </div>
            </Link>
          ))}
        </div>

        {/* 그 외 프로젝트 (작은 카드) */}
        {sideProjects.length > 5 && (
          <>
            <h3 className="side-sub muted">그 외 프로젝트</h3>
            <div className="side-grid-sm">
              {sideProjects.slice(5).map((sp) => (
                <Link className="sp-card-sm" href={`/side/${sp.slug}/`} key={sp.slug}>
                  <div className="sp-sm-hero">
                    <img src={sp.image} alt={sp.title} loading="lazy" />
                    <span className="sp-sm-engine">{sp.engine}</span>
                  </div>
                  <div className="sp-sm-body">
                    <h4><KeepWords text={sp.title} /></h4>
                    <p className="sp-sm-sub">{glue(sp.subtitle)}</p>
                    <ul className="chips small">{sp.tags.slice(0, 3).map((t) => <li key={t}>{t}</li>)}</ul>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
       </div>
      </section>

    </>
  );
}
