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
## 🏆 **메타버스 개발자 경진대회 우수상 수상**
## 프로젝트 소개
<br>**배우의 실시간 모션 트래킹과 관객의 상호작용**을 통해 이야기를 진행하는 관객 참여형 VR 연극입니다. 코로나로 인해 침체된 연극 시장을 활성화하고자  하는 방안으로 제시하였으며 모델러, 기획자와 협업하는 방법을 배우고 모션트래킹 및 VR 기술을 경험하는 계기가 되었습니다. 관객은 조력자로서 극에 참여하고 배우의 주도 하에 각종 미니 이벤트 수행을 하며 스토리를 진행할 수 있습니다.
## 📚프로젝트 자료
↘️클릭 시 원본 링크로 이동합니다
[Git Repositiry](https://github.com/LimHyun-ji/VR-Theater)
## 💻담당 업무 및 해당 업무에서 사용된 기술
**Unreal Engine 블루프린트 80/ C++ 20**
- **멀티플레이 :: Steam Server 사용**
  게임 전반을 관리하기 위한 GameInstance에서 OnlineSubsystem모듈을 사용해 적용
  엔진에서 제공하는 인스턴스를 사용하였으며 언리얼 엔진 제공 문서 참고
- **게임 내 컨텐츠 개발** 
  - 퍼즐 게임- 지도 조각 맞추기
  - 동물과 상호 작용하여 진행에 필요한 아이템 획득
- **풀트래킹 - 배우의 행동 실시간 반영**
  LiveLink 플러그인을 추가하여 Axis Neuron과의 연동을 통해 
  배우의 모션을 실시간 애니메이션 블루프린트로 적용
- **핸드트래킹 - 관객의 모션에 따른 이벤트 발생**
  VR Expansion 플러그인을 추가하여 특정 핸드 모션을 저장하고
  게임 도중 수행한 핸드 모션과의 일치 여부를 판단해 이벤트 작동
- **AI - Behavior Tree 사용**
  관객의 상호작용에 의한 변수 값에 따라 행동 패턴 수행
## 📝프로젝트를 진행하며 배운 점📝
<div class="callout"><span class="ci">💡</span> <strong>새로운 기술(실시간 모션 트래킹 및 핸드 트래킹) 적용<br><br></strong>처음 접하는 기술을 접목 시키기 위해 엔진 내에서 제공하는 플러그인과, 다른 개발자들이 오픈 소스로 배포한 플러그인을 추가하며 엔진 내 기능을 확장시킬 수 있었습니다. 새로운 기술을 접하고 컨텐츠 내에서 구현하는 과정에서 어떤 식으로 정보를 취득하고 적용하는지 공부하는 계기가 되었습니다.</div>
<div class="callout"><span class="ci">💡</span> <strong>타 분야의 기술자들과 협업<br></strong><br>기술 설명, UI 요구 사항 등을 문서로 작성하여 소통하였습니다. 모델러와의 협업을 위해 WBS를 작성해 컨텐츠 개발 일정을 조율하였으며 개발 플로우차트를 작성해 컨텐츠의  전반적인 흐름을 쉽게 이해하도록 전달하였습니다.</div>
