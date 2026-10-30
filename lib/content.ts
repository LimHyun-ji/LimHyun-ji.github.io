import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import yaml from 'js-yaml';

const CONTENT = path.join(process.cwd(), 'content');

export interface SkillGroup { category: string; items: string[]; }
export interface Experience { org?: string; title?: string; period?: string; desc?: string; }
export interface About { born?: string; school?: string; schoolPeriod?: string; highschool?: string; }
export interface Growth { period: string; problem: string; area: string; }
export interface Identity { tagline?: string; growthIntro?: string; growth?: Growth[]; }

export interface Profile {
  name: string; role: string; headline: string; intro: string;
  photo?: string;
  keywords?: string[];
  about?: About;
  links: { github?: string; email?: string; linkedin?: string; blog?: string };
  skills?: SkillGroup[];
  experience?: Experience[];
}

export interface ProjectImage { src: string; alt?: string; caption?: string; }

export interface Project {
  slug: string; order: number; title: string; role?: string; period?: string;
  summary?: string; tags?: string[]; highlights?: string[]; images?: ProjectImage[];
  imageLayout?: 'gallery' | 'slider'; video?: string; body: string;
}

export function getProfile(): Profile {
  const raw = fs.readFileSync(path.join(CONTENT, 'profile.yml'), 'utf8');
  return yaml.load(raw) as Profile;
}

export interface CompetencyCase { title: string; slug?: string; situation: string; decision: string; result: string; }
export interface CompetencyGroup {
  id: string; title: string; name: string; headline?: string; proof?: string; proofLabel?: string; cases: CompetencyCase[];
}

// 메인 "어떻게 일하나" — 행동 패턴별 사례 (content/competencies.yml)
export function getCompetencies(): CompetencyGroup[] {
  const file = path.join(CONTENT, 'competencies.yml');
  if (!fs.existsSync(file)) return [];
  return ((yaml.load(fs.readFileSync(file, 'utf8')) as { groups?: CompetencyGroup[] })?.groups) ?? [];
}

export function getIdentity(): Identity {
  const file = path.join(CONTENT, 'identity.yml');
  if (!fs.existsSync(file)) return {};
  return (yaml.load(fs.readFileSync(file, 'utf8')) as Identity) ?? {};
}

const PROJ_DIR = path.join(CONTENT, 'projects');

export function getSlugs(): string[] {
  return fs.readdirSync(PROJ_DIR).filter(f => f.endsWith('.md')).map(f => f.replace(/\.md$/, ''));
}

export function getProject(slug: string): Project {
  const raw = fs.readFileSync(path.join(PROJ_DIR, `${slug}.md`), 'utf8');
  const { data, content } = matter(raw);
  return { slug, order: Number(data.order ?? 99), title: data.title, role: data.role,
    period: data.period, summary: data.summary, tags: data.tags, highlights: data.highlights,
    images: data.images, imageLayout: data.imageLayout, video: data.video, body: content };
}

export function getProjects(): Project[] {
  return getSlugs().map(getProject).sort((a, b) => a.order - b.order);
}
