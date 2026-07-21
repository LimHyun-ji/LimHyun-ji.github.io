import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import yaml from 'js-yaml';

const CONTENT = path.join(process.cwd(), 'content');

export interface SkillGroup { category: string; items: string[]; }
export interface Experience { org?: string; title?: string; period?: string; desc?: string; }
export interface About { born?: string; school?: string; schoolPeriod?: string; highschool?: string; }
export interface Profile {
  name: string; role: string; headline: string; intro: string;
  keywords?: string[];
  about?: About;
  links: { github?: string; email?: string; linkedin?: string; blog?: string };
  skills?: SkillGroup[];
  experience?: Experience[];
}

export interface Project {
  slug: string; order: number; title: string; role?: string; period?: string;
  summary?: string; tags?: string[]; highlights?: string[]; body: string;
}

export function getProfile(): Profile {
  const raw = fs.readFileSync(path.join(CONTENT, 'profile.yml'), 'utf8');
  return yaml.load(raw) as Profile;
}

const PROJ_DIR = path.join(CONTENT, 'projects');

export function getSlugs(): string[] {
  return fs.readdirSync(PROJ_DIR).filter(f => f.endsWith('.md')).map(f => f.replace(/\.md$/, ''));
}

export function getProject(slug: string): Project {
  const raw = fs.readFileSync(path.join(PROJ_DIR, `${slug}.md`), 'utf8');
  const { data, content } = matter(raw);
  return { slug, order: Number(data.order ?? 99), title: data.title, role: data.role,
    period: data.period, summary: data.summary, tags: data.tags, highlights: data.highlights, body: content };
}

export function getProjects(): Project[] {
  return getSlugs().map(getProject).sort((a, b) => a.order - b.order);
}
