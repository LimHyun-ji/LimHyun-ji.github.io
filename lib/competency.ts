// 역량 태그 — 상세 페이지 헤더 · 홈 기술 사례에서 공통으로 쓰는 고정 어휘.
// 각 역량은 Rider 구문 강조 팔레트의 한 색(tone)에 대응한다. 색 값은 app/base.css의 --rd-* 토큰.
export const COMPETENCIES = [
  { name: '런타임 아키텍처', tone: 'keyword' },
  { name: '엔진 툴 확장', tone: 'type' },
  { name: '퍼포먼스 최적화', tone: 'method' },
  { name: '메모리 최적화', tone: 'field' },
  { name: '렌더링', tone: 'number' },
  { name: '애니메이션', tone: 'comment' },
  { name: '게임 수학', tone: 'string' },
  { name: '네트워크 동기화', tone: 'struct' },
] as const;

const TONE: Record<string, string> = Object.fromEntries(COMPETENCIES.map((c) => [c.name, c.tone]));
const ORDER: Record<string, number> = Object.fromEntries(COMPETENCIES.map((c, i) => [c.name, i]));

/** 역량 이름 → tone 클래스 (정의되지 않은 태그는 기본 강조색) */
export function toneClass(tag: string): string {
  return `tone-${TONE[tag] ?? 'accent'}`;
}

/** 역량 정의 순서대로 정렬 */
export function sortCompetencies(tags: string[]): string[] {
  return [...tags].sort((a, b) => (ORDER[a] ?? 99) - (ORDER[b] ?? 99));
}
