# GitHub Pages 포트폴리오

Unreal/게임 클라이언트 개발자용 1페이지 포트폴리오입니다. Jekyll + GitHub Pages 기반.

## 내용 수정하기

대부분의 내용은 **`_data/profile.yml`** 한 파일만 고치면 됩니다.
- `name`, `role`, `headline`, `intro` — 상단 소개
- `links` — GitHub / Email / LinkedIn / Blog 버튼
- `skills` — 카테고리별 기술 스택
- `projects` — 대표 프로젝트 (제목/기간/역할/요약/기여/태그)
- `experience` — 경력 타임라인

사이트 제목/SEO는 `_config.yml`에서 수정합니다.

> `__GITHUB_USERNAME__` 으로 표시된 부분을 본인의 GitHub 사용자명으로 모두 바꿔주세요.
> (`_config.yml`, `_data/profile.yml`)

## 배포 (GitHub Pages)

User Page로 띄우는 가장 간단한 방법:

1. GitHub에서 **`<사용자명>.github.io`** 이름으로 새 repository 생성 (Public).
2. 이 폴더에서:
   ```bash
   git init
   git add .
   git commit -m "Initial portfolio site"
   git branch -M main
   git remote add origin https://github.com/<사용자명>/<사용자명>.github.io.git
   git push -u origin main
   ```
3. repo의 **Settings → Pages**에서 Source가 `main` 브랜치 / `/ (root)` 인지 확인.
4. 잠시 후 `https://<사용자명>.github.io` 에서 확인.

## 로컬 미리보기 (선택)

Ruby가 설치돼 있다면:

```bash
bundle install
bundle exec jekyll serve
```

→ http://localhost:4000

Ruby가 없어도 GitHub에 push하면 GitHub Pages가 자동으로 빌드합니다.
