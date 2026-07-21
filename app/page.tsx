import Link from 'next/link';
import { getProfile, getProjects } from '@/lib/content';
import { sideProjects } from '@/lib/sideProjects';
import HeroParticles from '@/components/HeroParticles';
import ThemeToggle from '@/components/ThemeToggle';

export default function Home() {
  const p = getProfile();
  const areas = getProjects(); // Sol 내 세부 영역(5)
  // 히어로 우측 스킬 패널 — Language / Engine / Tools 어필
  const heroSkills = (p.skills ?? []).filter((g) =>
    ['Languages', 'Engine / Framework', 'Tools'].includes(g.category));

  return (
    <>
      {/* NAV */}
      <nav className="nav">
        <a className="nav-brand" href="#top">임현지</a>
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
            <p className="lead-eyebrow">{p.role}</p>
            <h1 className="lead-name">{p.name}</h1>
            <p className="lead-headline">{p.headline}</p>
            {p.keywords && (
              <ul className="lead-keywords">
                {p.keywords.map((k) => <li key={k}>{k}</li>)}
              </ul>
            )}
            <div className="lead-actions">
              {p.links?.github && <a className="btn" href={p.links.github} target="_blank" rel="noopener">GitHub</a>}
              {p.links?.email && <a className="btn ghost" href={`mailto:${p.links.email}`}>Email</a>}
            </div>
          </div>
          {heroSkills.length > 0 && (
            <aside className="lead-skills">
              {heroSkills.map((g) => (
                <div className="ls-group" key={g.category}>
                  <h4>{g.category}</h4>
                  <ul className="chips small">{g.items.map((it) => <li key={it}>{it}</li>)}</ul>
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
              {p.experience[0].org}
              <span className="career-period"> · {p.experience[0].period}</span>
            </h2>
          )}
          <div className="career-grid">
            {p.experience.slice(1).map((e, i) => (
              <div className="career-card" key={i}>
                <div className="career-year">{e.period}</div>
                <h3>{(e.org ?? '').replace(/^\d{4}\s*—\s*/, '')}</h3>
                <p>{e.desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FEATURED — SOL (메인 프로젝트, 크게) */}
      <section className="featured" id="sol">
        <div className="featured-tag">◆ Main Project · 메인 프로젝트</div>
        <h2 className="featured-title">Sol — UE5 MMORPG</h2>
        <p className="featured-sub">
          커스텀 Unreal Engine 5 브랜치 기반 모바일/PC MMORPG. VisualData 캐릭터 시스템·퍼포먼스 최적화·
          게임 콘텐츠(길드·성장·경제)·인게임 연출·데이터 파이프라인·라이브 안정화까지 <strong>직접 설계·담당</strong>.
        </p>
        <img className="arch-diagram" src="/images/diagrams/sol-architecture.svg"
          alt="Sol 클라이언트 아키텍처: 게임 서버(TCP)·Noti(WebSocket) → USolGeoSubsystem, MetaDataSubsystem → Feature Managers" loading="lazy" />
        <div className="area-grid">
          {areas.map((a) => (
            <Link className="area-card" href={`/projects/${a.slug}/`} key={a.slug}>
              <h3>{a.title}<span className="arrow"> →</span></h3>
              <p>{a.summary}</p>
              {a.tags && <ul className="chips small">{a.tags.slice(0, 4).map((t) => <li key={t}>{t}</li>)}</ul>}
            </Link>
          ))}
        </div>
      </section>

      {/* SIDE PROJECTS (하단, 별도 밴드로 명확히 분리) */}
      <section className="side-band" id="side">
       <div className="side-inner">
        <div className="featured-tag">▚ Side Projects · 사이드 프로젝트</div>
        <h2 className="section-h">Side Projects</h2>
        <p className="section-note">개인·학습·팀 프로젝트 ({sideProjects.length}) — Notion 포트폴리오 기반</p>

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
                <h3>{sp.title}</h3>
                <p className="sp-sub">{sp.subtitle}</p>
                <p className="sp-desc">{sp.desc}</p>
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
                  <span className="sp-sm-engine">{sp.engine}</span>
                  <h4>{sp.title}</h4>
                  <p className="sp-sm-sub">{sp.subtitle}</p>
                  <ul className="chips small">{sp.tags.slice(0, 3).map((t) => <li key={t}>{t}</li>)}</ul>
                </Link>
              ))}
            </div>
          </>
        )}
       </div>
      </section>

      {/* SKILLS */}
      {p.skills && (
        <section className="block" id="skills">
          <h2 className="section-h">Skills</h2>
          <div className="skills">
            {p.skills.map((g) => (
              <div className="skill-group" key={g.category}>
                <h3>{g.category}</h3>
                <ul className="chips">{g.items.map((it) => <li key={it}>{it}</li>)}</ul>
              </div>
            ))}
          </div>
        </section>
      )}

    </>
  );
}
