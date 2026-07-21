---
title: "Journey To Space"
subtitle: "우주·행성 탐험 FPS RPG · Unreal"
engine: "Unreal / C++"
period: "2021.07 – 2021.08"
team: "개발자 2인"
status: "Highlights"
image: "/images/yt/journey.jpg"
video: "https://youtu.be/xfQBWUyWXu8"
tags: ["Unreal", "C++", "AI Behavior", "Destructible", "FPS RPG"]
links: { git: "https://github.com/LimHyun-ji/Space-To-Journey", doc: "", video: "https://youtu.be/xfQBWUyWXu8" }
---
## 프로젝트 소개
**우주와 행성을 탐험하며 전투와 퀘스트 진행을 통해 성장하는 FPS RPG 게임**입니다. Unreal 엔진 내 블루프린트 사용을 최소화하고 C++을 중점적으로 사용해 제작했으며, AI 행동패턴 및 캐릭터 기능 구현에 집중했습니다. (행성 파트 담당 · Unreal C++ 80 / Blueprint 20)
## 📚프로젝트 자료
↘️클릭 시 원본 링크로 이동합니다
### [Git Repository](https://github.com/LimHyun-ji/Space-To-Journey)
## 💻담당 업무 및 해당 업무에서 사용된 기술
- **콘텐츠 개발 (기믹)**
  - 맵 내 단서를 통해 순서대로 횃불에 불을 붙이면 보스 전투 진입
  - Destructible Mesh를 이용한 파괴 연출
- **적 보스 AI — 행동 패턴 구현**
  - 시간에 따라 순차적으로 페이즈가 변화하고 physics 값이 변경
  - 비행: 회전 값에 따라 ∞ 자로 비행 / 공중 공격: 플레이어 위치로 공격체 발사 / 육지 공격: 착륙 후 추격
- **적 객체 AI**
  - 공통 행동은 오버라이딩으로, 새로운 동작은 오버로딩으로 구현
  - 일반 적 AI(근거리/원거리): 랜덤 비선형 이동 · 플레이어 추격 · 원거리 복귀
- **플레이어 전투 기능 및 스킬**
  - AnimBP·블렌드로 상황별 자연스러운 움직임, MP 기반 스킬, 슈팅·근거리 공격
- **플레이어 UI** — 총알 수·HP·MP·스킬 사용 가능 여부 시각화
- **다양한 Particle System 활용**
## 📝프로젝트를 진행하며 배운 점📝
<div class="callout"><span class="ci">💡</span> <strong>AI 행동 패턴 구현 및 모델링<br><br></strong>각 적 객체에 필요한 기능·속성을 모델링해 행동 패턴을 작성했습니다. 효율적·확장성 있는 코드를 위해 공통 기능은 상위 클래스로 묶고, 적 객체마다 하위 클래스를 생성해 변경 코드와 새 기능을 추가했습니다. 개념적으로만 알던 오버로딩·오버라이딩·추상화·상속을 정확히 이해하고 사용하는 계기가 됐습니다.</div>
