# 포트폴리오 사이트 작업 규칙

Next.js(정적 export) 포트폴리오. `main`에 push되면 GitHub Actions(`.github/workflows/deploy.yml`)가 GitHub Pages로 배포한다.

## 줄바꿈 원칙 (항상 지킬 것)

**사이트의 모든 텍스트는 띄어쓰기 기준으로만 줄바꿈한다.** 단어 중간(한글 음절 사이, `퍼포먼스/메모리`, `길드·수집`, `(GC/풀링)` 같은 기호 경계, 이모지 앞)에서 줄이 바뀌면 안 된다.

구현은 세 겹으로 되어 있다. 새 텍스트를 추가할 때 이 경로를 그대로 따를 것.

1. **CSS** — `app/base.css`의 `body`에 `word-break: keep-all; overflow-wrap: break-word;` (한글 음절 사이 줄바꿈 방지)
2. **기호 경계** — `lib/keepWords.ts`의 `glue()`가 공백이 아닌 두 글자 사이 중 한쪽이 기호인 곳에 WORD JOINER(U+2060)를 넣는다.
   - 메인 페이지(`app/page.tsx`)·상세 페이지 헤더에 직접 출력하는 문자열은 `glue(...)`로 감싼다.
   - 마크다운 본문은 `rehypeKeepWords` 플러그인이 처리한다 (`rehypePlugins={[rehypeRaw, rehypeKeepWords]}`). code/pre는 제외.
3. **제목** — 카드·상세 제목은 `components/KeepWords.tsx`로 렌더링한다. 기호만 있는 단어(`·`, `/`, `—`, `&`, `→`)가 줄 맨 앞/끝에 홀로 남지 않게 붙이고, 카드 제목 뒤 화살표는 `' '→`로 붙인다.

컨텐츠 작성 규칙:
- 긴 나열은 기호 앞뒤에 띄어쓰기를 넣는다: `길드 · 수집 · 순례`, `Master / Face / Torso` (공백 없이 길게 이어 쓰면 칸보다 길어져 단어 중간에서 끊길 수밖에 없다)
- 표 안의 긴 클래스명은 `` `코드` ``로 감싼다 (표 안 code만 넘칠 때 끊기도록 처리되어 있음)

변경 후에는 데스크톱(1440)·태블릿(820)·모바일(390) 폭에서 단어 중간 줄바꿈과 가로 넘침이 없는지 확인한다.
