import Link from 'next/link';
import { getProfile, getProjects } from '@/lib/content';
import { sideProjects } from '@/lib/sideProjects';
import HeroParticles from '@/components/HeroParticles';

export default function Home() {
  const p = getProfile();
  const areas = getProjects(); // Sol 내 세부 영역(5)

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
        </div>
      </nav>

      {/* HERO */}
      <div className="hero-wrap">
        <HeroParticles />
        <header className="lead" id="top">
          <p className="lead-eyebrow">{p.role}</p>
          <h1 className="lead-name">{p.name}</h1>
          <p className="lead-headline">{p.headline}</p>
          <p className="lead-intro">{p.intro}</p>
          <div className="lead-actions">
            {p.links?.github && <a className="btn" href={p.links.github} target="_blank" rel="noopener">GitHub</a>}
            {p.links?.email && <a className="btn ghost" href={`mailto:${p.links.email}`}>Email</a>}
          </div>
        </header>
      </div>

      {/* FEATURED — SOL (메인 프로젝트, 크게) */}
      <section className="featured" id="sol">
        <div className="featured-tag">◆ Main Project · 메인 프로젝트</div>
        <h2 className="featured-title">Sol — UE5 MMORPG</h2>
        <p className="featured-sub">
          커스텀 Unreal Engine 5 브랜치 기반 모바일/PC MMORPG. VisualData 캐릭터 시스템·퍼포먼스 최적화·
          아웃게임(로비·성장·편의)·인게임 연출·데이터 파이프라인·라이브 안정화까지 <strong>오너십</strong>으로 담당.
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
        <div className="side-grid">
          {sideProjects.map((sp) => (
            <article className="sp-card" key={sp.title}>
              <div className="sp-hero">
                <img src={sp.image} alt={sp.title} loading="lazy" />
                <span className="sp-engine">{sp.engine}</span>
              </div>
              <div className="sp-body">
                <h3>{sp.title}</h3>
                <p className="sp-sub">{sp.subtitle}</p>
                <p className="sp-desc">{sp.desc}</p>
                <ul className="chips small">{sp.tags.map((t) => <li key={t}>{t}</li>)}</ul>
                <div className="sp-links">
                  {sp.links.video && <a href={sp.links.video} target="_blank" rel="noopener">▶ 영상</a>}
                  {sp.links.git && <a href={sp.links.git} target="_blank" rel="noopener">GitHub</a>}
                  {sp.links.doc && <a href={sp.links.doc} target="_blank" rel="noopener">기술소개서</a>}
                </div>
              </div>
            </article>
          ))}
        </div>
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

      {/* EXPERIENCE */}
      {p.experience && (
        <section className="block" id="exp">
          <h2 className="section-h">Experience</h2>
          <div className="timeline">
            {p.experience.map((e, i) => (
              <div className="tl-item" key={i}>
                <div className="tl-period">{e.period}</div>
                <div className="tl-body">
                  <h3>{e.title} {e.org && <span className="org">@ {e.org}</span>}</h3>
                  <p>{e.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
