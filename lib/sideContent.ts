import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const SIDE_DIR = path.join(process.cwd(), 'content', 'side');

export interface SideDetail {
  slug: string;
  title: string;
  subtitle?: string;
  period?: string;
  team?: string;
  status?: string;
  engine?: string;
  tags?: string[];
  image?: string;
  video?: string;
  links?: { git?: string; doc?: string; video?: string };
  body: string;
}

export function getSideSlugs(): string[] {
  if (!fs.existsSync(SIDE_DIR)) return [];
  return fs.readdirSync(SIDE_DIR).filter((f) => f.endsWith('.md')).map((f) => f.replace(/\.md$/, ''));
}

export function getSideDetail(slug: string): SideDetail {
  const raw = fs.readFileSync(path.join(SIDE_DIR, `${slug}.md`), 'utf-8');
  const { data, content } = matter(raw);
  return { slug, body: content, ...(data as Record<string, unknown>) } as SideDetail;
}
