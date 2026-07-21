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
<br>**우주와 행성을 탐험하며 전투와 퀘스트 진행을 통해 성장하는 FPS RPG게임**입니다.  Ureal  엔진  내  블루프린트  사용을  최소화하고 C++을 중점적으로 사용하여 제작했으며 AI 행동패턴 및 캐릭터 기능 구현에 집중했습니다. 
## 📚프로젝트 자료
↘️클릭 시 원본 링크로 이동합니다
[Git Repositiry](https://github.com/LimHyun-ji/Space-To-Journey)
## 💻담당 업무 및 해당 업무에서 사용된 기술
**Unreal Engine C++ 80/ Blueprint 20**
행성 파트 담당
- **컨텐츠 개발(기믹)**
  맵 내에서 얻은 단서를 통해 순서대로 횃불에 불을 붙이면 보스와의 전투 진입
  Destructible Mesh 를 이용한 파괴
- **적 보스 AI :: 행동 패턴 구현**
  시간에 따라 순차적으로 페이즈가 변화하고 physics값이 변경됨
  비행: 회전 값에 따라 ∞ 자로 비행
  공중 공격: 플레이어의 위치를 찾아 해당 위치로 공격체 발사
  육지 공격: 육지 착륙 후 플레이어의 위치를 추격하며 공격
- **적 객체 AI**
  공통적으로 동작하는 행동은 오버라이딩으로 구현하였으며 
  새로운 동작의 경우 오버로딩으로 새로운 행동 패턴을 함수로 구현
  - 일반 적 AI (근거리/ 원거리)
    랜덤: 회전값을 랜덤으로 찾고 비선형적으로 움직임
    공격: 플레이어의 위치를 추적하여 추격함
    복귀: 플레이어와의 거리가 멀어지면 초기 생성 위치로 복귀
- **플레이어 전투 기능 및 스킬 **
  애니메이션 블루프린트 및 블랜드 이용해 상황에 따른 자연스러운 움직임 구현
  MP값에 따라 스킬 사용 가능
  슈팅 및 근거리 공격 가능
- **플레이어 UI **
  현재 총알 개수, HP, MP 스킬 사용 가능 유무를 반영하여 시각적으로 표현
- **다양한 Particle System 활용**
## 📝프로젝트를 진행하며 배운 점📝
<div class="callout"><span class="ci">💡</span> <strong>AI 행동 패턴 구현 및 모델링<br><br></strong>AI 행동 패턴을 구현할 때 각 적 객체에 필요한 기능 및 속성을 모델링해 행동 패턴을 작성했습니다. 효율적이고 확장성 있는 코드를 위해 공통된 기능은 묶어 상위 클래스로 설정하였고 적 객체마다 하위 클래스를 생성해 변경되는 코드와 새로운 기능을 추가할 수 있었습니다.<br>이를 통해 개념적으로 알고 있던 오버로딩, 오버라이딩의 개념 및 추상화, 상속의 개념을 정확히 이해하고 사용할 수 있는 계기가 되었습니다.</div>
## 👾추가할 개발 사항👾-진행 중
<div class="callout"><span class="ci">💡</span> 플레이어가 무기를 바꾸며 칼, 화살 등의 다양한 근거리, 원거리 무기를 사용할 수 있을 것<br>근접 전투가 가능한 AI적 캐릭터를 자연스럽게 구현할 것<br>IK시스템을 사용하여 지형에 따라 자연스러운 애니메이션이 가능할 것<br>기존 인벤토리 및 Sace Load 시스템을 재구성할 것<br>행성 내부에 존재하는 NPC에게 퀘스트를 받고 수행할 수 있을 것(해당 퀘스트는 UI를 통해 열람 가능할 것)</div>
