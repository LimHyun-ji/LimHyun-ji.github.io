---
title: "It Takes Two 모작"
subtitle: "2인 협동 어드벤처 · Unity"
engine: "Unity / C#"
period: "2022.08"
team: "개발자 2인"
status: "Highlights"
image: "/images/ittakestwo-1.png"
video: "https://youtu.be/23g39-UNHLQ"
tags: ["Unity", "FSM", "Shader", "Bezier", "IK"]
links: { git: "https://github.com/LimHyun-ji/ItTakesTwo_GG", doc: "https://www.miricanvas.com/v/11j6dmn", video: "https://youtu.be/23g39-UNHLQ" }
---
## 프로젝트 소개
 Steam 게임 It takes two의 SnowGlobe 챕터의 일부를 모작한 프로젝트입니다. 일반적인 RPG게임에는 드문 <strong>오브젝트와의 특수 상호작용</strong>을 최대한 비슷하게 구현하도록 노력하였으며 2인 협동 플레이 콘텐츠라는 점을 고려한 <strong>시각적 요소</strong> 또한 구현하였습니다. 또한, <strong>코드의 재사용성 및 확장성</strong>을 고려하여 구조적으로 설계하였습니다.
## 📚프로젝트 자료
↘️클릭 시 원본 링크로 이동합니다
### [코드 분석 및 기술소개서 ](https://www.miricanvas.com/v/11j6dmn) 
### [깃허브 Repositiry](https://github.com/LimHyun-ji/ItTakesTwo_GG)
## 💻담당 업무 및 해당 업무에서 사용된 기술
- 클래스 기반의 상태머신 설계를 통한 캐릭터의 상태 제어
  <strong>캐릭터 상태 머신 다이어그램</strong>
  ![](/images/side/ittakestwo/img1.png)
- 열거형 기반의 카메라 상태머신 설계를 통한 카메라 상태 제어
  <strong>카메라 상태머신 다이어그램</strong>
  ![](/images/side/ittakestwo/img2.png)
  - 카메라와 플레이어 사이의 장애물 감지 및 거리 조정 기능 포함
- <strong>벡터의 내적을 이용한 Sliding 구현 </strong>
  - 어느 경사면에서나 확장성 있게 적용하기 위해 게임 수학 활용
  - 입력 Vector와의 일치 여부 또한 판별하여 가감속 가능
- <strong>Bezier곡선을 이용한 캐릭터 RollerCoaster 기능 구현 및 곡선 Editing 기능</strong>
  - Unity Editor GUI를 통해 곡선 편집 가능
  - 수학적 Bezier곡선 공식을 코드화
- <strong>다이얼로그 시스템 - XML을 이용하여 로드</strong>
  - 대사가 바뀌어도 유동적으로 xml문서에서 편집 가능
- <strong>Shader를 이용한 타 플레이어의 위치 파악</strong>
  - Silhouatte 쉐이더를 이용해 타 플레이어 위치 표시
  - 본인은 적용하지 않기 위해 Dummy Object 와 ray 활용
- <strong>IK를 이용하여 애니메이션 구현</strong>
  - 자석의 움직임을 손이 따르도록 구현
## 📝프로젝트를 진행하며 배운 점📝
<div class="callout"><span class="ci">💡</span> <strong>게임 수학에 대한 이해</strong><br><br>플레이어의 슬라이딩 시스템을 구현하는 중, 단지 특정한 경사면에서만 적용되는 것이 아닌 어디에서나 확장성 있게 적용시키기 위해 벡터의 내적을 활용하여 구현하였습니다.  플레이어의 Normal 벡터와 수직벡터를 통해 땅의 경사면 벡터를 구하고, 플레이어를 해당 방향으로 미끄러지도록 하였습니다. 또한, 슬라이딩 도중 플레이어의 입력에 따라 속도를 감속, 가속시키기 위해 입력 벡터와 경사면 벡터의 내적값을 구해 기준치보다 작으면 감속, 크면 가속을 하여 자연스럽게 구현했습니다.<strong><br></strong></div>
<div class="callout"><span class="ci">💡</span> <strong>Shader 및 시각적 요소를 고려한 기능 개발<br><br></strong>2인 협동 플레이의 특성 상 타 플레이어의 위치를 파악하는 것이 중요했습니다. 카메라의 Depth와 ViewPort를 이용해 화면 2분할을 통해 한 화면에서 타 플레이어의 행동을 보여주었지만 이것만으로는 타 플레이어가 직관적으로 어디에 위치하고 있는지 알기 어려워, 2차적으로 쉐이더를 이용하여 실루엣을 보여주었습니다. Stencil Buffer 와 Z pass 를 이용하여 구현하였으며 본인에게는 해당 실루엣을 적용하지 않기 위해 Dummy 오브젝트에 Ray 를 쏘며 이를 적용 대상 유무를 판별하였습니다. 추가로 눈 밭에 궤적을 남기는 Computing Shader를 적용했습니다. 이를 통해 쉐이더의 적절한 사용이 프로젝트의 시각적 퀄리티를 향상할 수 있음을 깨닫고 그래픽스 및 컴퓨팅 쉐이더에 대한 공부를 하며 적절한 예제를 통해 이를 프로젝트에 적용하는 계기가 되었습니다.</div>
