// 줄바꿈 원칙: 사이트의 모든 텍스트는 "띄어쓰기 기준"으로만 줄바꿈한다.
// - 한글 음절 사이: CSS `word-break: keep-all`(app/base.css body)로 처리
// - 기호 경계(퍼포먼스/메모리, 길드·수집, (GC/풀링), 이모지 등): 이 파일의 glue()가
//   공백이 아닌 두 글자 사이 중 한쪽이 기호인 곳에 WORD JOINER(U+2060)를 넣어 끊기지 않게 함
// - 단어 하나가 칸보다 길 때만 CSS overflow-wrap으로 예외적으로 끊김
export const WJ = '⁠';

const LETTER_OR_NUMBER = /[\p{L}\p{N}]/u;
const COMBINING = /[\p{M}‍️⃣]|[\u{1F3FB}-\u{1F3FF}]/u; // 결합 문자·ZWJ·이모지 수정자는 건드리지 않음
const SPACE = /\s/;

export function glue(text: string): string {
  if (!text) return text;
  const chars = Array.from(text);
  let out = '';
  for (let i = 0; i < chars.length; i++) {
    const a = chars[i - 1];
    const b = chars[i];
    if (
      a !== undefined && a !== WJ && b !== WJ &&
      !SPACE.test(a) && !SPACE.test(b) &&
      !COMBINING.test(b) && a !== '‍' &&
      (!LETTER_OR_NUMBER.test(a) || !LETTER_OR_NUMBER.test(b))
    ) {
      out += WJ;
    }
    out += b;
  }
  return out;
}

// 마크다운 본문(react-markdown)용 rehype 플러그인 — code/pre 안의 텍스트는 제외
type HastNode = { type: string; tagName?: string; value?: string; children?: HastNode[] };
export function rehypeKeepWords() {
  const walk = (node: HastNode, inCode: boolean) => {
    const code = inCode || node.tagName === 'code' || node.tagName === 'pre';
    if (node.type === 'text' && !code && typeof node.value === 'string') node.value = glue(node.value);
    node.children?.forEach((c) => walk(c, code));
  };
  return (tree: HastNode) => walk(tree, false);
}
