# 이미지 추가 가이드

포트폴리오에 이미지를 추가하는 방법을 안내합니다.

---

## 1. 프로필 사진

**파일 위치:** `public/images/profile.jpg`

**설정 방법:**
```yaml
# content/profile.yml
photo: "/images/profile.jpg"
```

> 사진 파일을 `public/images/` 폴더에 넣고, `content/profile.yml`에서 `photo` 주석을 해제하세요.

---

## 2. 메인 프로젝트 (Sol) 이미지

**파일 위치:** `public/images/projects/{프로젝트명}/`

**설정 방법:** 프로젝트 마크다운 파일의 frontmatter에 `images` 배열을 추가합니다.

```yaml
# content/projects/visualdata.md
---
title: "VisualData 캐릭터 시스템"
images:
  - src: "/images/projects/visualdata/img1.png"
    alt: "캐릭터 비주얼 시스템 구조"
    caption: "VisualData 아키텍처 다이어그램"
  - src: "/images/projects/visualdata/img2.png"
    alt: "에디터 화면"
---
```

---

## 3. 사이드 프로젝트 이미지

**파일 위치:** `public/images/side/{프로젝트명}/`

**설정 방법:** 사이드 프로젝트 마크다운 파일의 frontmatter에 `images` 배열을 추가합니다.

```yaml
# content/side/ittakestwo.md
---
title: "It Takes Two 모작"
images:
  - src: "/images/side/ittakestwo/screenshot1.png"
    alt: "게임 플레이 화면"
    caption: "협동 플레이 장면"
  - src: "/images/side/ittakestwo/screenshot2.png"
    alt: "시스템 구조"
---
```

---

## images 배열 필드 설명

| 필드 | 필수 | 설명 |
|------|------|------|
| `src` | O | 이미지 경로 (`/images/...`로 시작) |
| `alt` | X | 이미지 대체 텍스트 (접근성, SEO) |
| `caption` | X | 이미지 아래 표시될 캡션 |

---

## 간단한 사용법 (src만 사용)

```yaml
images:
  - src: "/images/side/myproject/img1.png"
  - src: "/images/side/myproject/img2.jpg"
```

---

## 이미지 권장 사항

- **형식:** PNG (스크린샷, 다이어그램), JPG (사진, 썸네일)
- **비율:** 16:10 권장 (갤러리에서 가장 잘 보임)
- **크기:** 가로 1200px 이하 권장 (정적 사이트이므로 최적화 없음)
- **용량:** 개별 파일 500KB 이하 권장

---

## 기능 요약

- 이미지 클릭 시 라이트박스로 확대
- 키보드 좌/우 화살표로 이미지 이동
- ESC로 라이트박스 닫기
- 이미지가 없으면 추가 안내 플레이스홀더 표시
- 반응형 그리드 (1~3열 자동 조절)
