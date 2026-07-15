import Link from 'next/link';
import { getProfile, getProjects } from '@/lib/content';

export default function Home() {
  const p = getProfile();
  const projects = getProjects();

  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="hero-inner">
          <p className="eyebrow">{p.role}</p>
          <h1>{p.name}</h1>
          <p className="headline">{p.headline}</p>
          <p className="intro">{p.intro}</p>
          <div className="actions">
            {p.links?.github && <a className="btn" href={p.links.github} target="_blank" rel="noopener">GitHub</a>}
            {p.links?.email && <a className="btn ghost" href={`mailto:${p.links.email}`}>Email</a>}
            {p.links?.linkedin && <a className="btn ghost" href={p.links.linkedin} target="_blank" rel="noopener">LinkedIn</a>}
            {p.links?.blog && <a className="btn ghost" href={p.links.blog} target="_blank" rel="noopener">Blog</a>}
          </div>
        </div>
      </section>

      {/* SKILLS */}
      {p.skills && (
        <section className="block">
          <h2>Skills</h2>
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

      {/* PROJECTS */}
      {projects.length > 0 && (
        <section className="block" id="projects">
          <h2>Projects</h2>
          <div className="projects">
            {projects.map((proj) => (
              <Link className="card card-link" href={`/projects/${proj.slug}/`} key={proj.slug}>
                <header>
                  <h3>{proj.title}<span className="arrow" aria-hidden="true"> →</span></h3>
                  <span className="meta">{proj.role}{proj.period ? ` · ${proj.period}` : ''}</span>
                </header>
                <p className="summary">{proj.summary}</p>
                {proj.tags && <ul className="chips small">{proj.tags.map((t) => <li key={t}>{t}</li>)}</ul>}
                <span className="more">자세히 보기 →</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* EXPERIENCE */}
      {p.experience && (
        <section className="block">
          <h2>Experience</h2>
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
