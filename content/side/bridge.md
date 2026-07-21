---
title: "Bridge Theater: Red Riding Hood"
subtitle: "관객 참여형 VR 연극 · 경진대회 우수상"
engine: "Unreal / C++"
period: "2021.09 – 2021.10"
team: "개발자 2 · 모델러 2"
status: "Highlights"
image: "/images/yt/bridge.jpg"
video: "https://youtu.be/D6_bDRrNd8w"
tags: ["Unreal", "C++", "VR", "LiveLink", "Behavior Tree"]
links: { git: "https://github.com/LimHyun-ji/VR-Theater", doc: "", video: "https://youtu.be/D6_bDRrNd8w" }
---
## 🏆 메타버스 개발자 경진대회 우수상 수상
## 프로젝트 소개
**배우의 실시간 모션 트래킹과 관객의 상호작용**으로 이야기를 진행하는 관객 참여형 VR 연극입니다. 코로나로 침체된 연극 시장을 활성화하는 방안으로 제시했으며, 모델러·기획자와 협업하고 모션트래킹·VR 기술을 경험한 계기가 됐습니다. 관객은 조력자로 극에 참여해 배우 주도의 미니 이벤트를 수행하며 스토리를 진행합니다.
## 📚프로젝트 자료
↘️클릭 시 원본 링크로 이동합니다
### [Git Repository](https://github.com/LimHyun-ji/VR-Theater)
## 💻담당 업무 및 해당 업무에서 사용된 기술
(Unreal Blueprint 80 / C++ 20)
- **멀티플레이 — Steam Server**
  - GameInstance에서 OnlineSubsystem 모듈로 적용, 엔진 제공 문서 참고
- **게임 내 콘텐츠 개발**
  - 퍼즐(지도 조각 맞추기), 동물과 상호작용해 진행 아이템 획득
- **풀트래킹 — 배우 행동 실시간 반영**
  - LiveLink 플러그인 + Axis Neuron 연동으로 배우 모션을 실시간 AnimBP에 적용
- **핸드트래킹 — 관객 모션 이벤트**
  - VR Expansion 플러그인으로 특정 핸드 모션을 저장하고, 수행 모션과의 일치 여부로 이벤트 작동
- **AI — Behavior Tree**
  - 관객 상호작용 변수 값에 따라 행동 패턴 수행
## 📝프로젝트를 진행하며 배운 점📝
<div class="callout"><span class="ci">💡</span> <strong>새로운 기술(실시간 모션·핸드 트래킹) 적용<br><br></strong>처음 접하는 기술을 접목하기 위해 엔진 제공 플러그인과 오픈소스 플러그인을 추가하며 엔진 기능을 확장했습니다. 새 기술을 접하고 콘텐츠에 구현하는 과정에서 정보를 취득·적용하는 방법을 공부하는 계기가 됐습니다.</div>
<div class="callout"><span class="ci">💡</span> <strong>타 분야 기술자와 협업<br><br></strong>기술 설명·UI 요구사항을 문서로 작성해 소통했습니다. 모델러와 협업을 위해 WBS로 일정을 조율하고, 개발 플로우차트로 콘텐츠 흐름을 쉽게 이해하도록 전달했습니다.</div>
