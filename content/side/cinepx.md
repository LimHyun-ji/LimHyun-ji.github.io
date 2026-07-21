---
title: "Cinepx"
subtitle: "메타버스 영화 촬영 플랫폼 · Unity"
engine: "Unity / C#"
period: "2022.10 – 2022.11"
team: "XR 2 · AI 2 · CR 1"
status: "Highlights"
image: "/images/cinepx-1.png"
video: "https://youtu.be/aKcv3BfkqDQ"
tags: ["Unity", "Cinemachine", "RenderTexture", "Optimization"]
links: { git: "https://github.com/LimHyun-ji/AppleBox", doc: "https://www.miricanvas.com/v/11mr28x", video: "https://youtu.be/aKcv3BfkqDQ" }
---
## 프로젝트 소개
오픈월드형 RPG 원신을 모작한 프로젝트로, 플로우를 사용하기 위해 던전 형식을 차용했습니다. 기본에 충실한 움직임을 모두 구현하고자 노력하였으며, GameManager를 통해 던전의 전반적인 Flow를 관리하였습니다. 원소 및 다중 캐릭터를 사용하는 원작의 특성을 반영하였으며 각 원소는 자연물과도 상호작용이 가능하며, 다중 캐릭터의 경우 상속을 통해 공통 기능과 캐릭터별 특성을 구현했습니다.
## 📚프로젝트 자료
↘️클릭 시 원본 링크로 이동합니다
### [코드 분석 및 기술소개서](https://www.miricanvas.com/v/11mr28x)
### [Git Repository](https://github.com/LimHyun-ji/AppleBox)
## 💻담당 업무 및 해당 업무에서 사용된 기술
- <strong>영상 녹화 기능</strong>
- <strong>다중 카메라 관리</strong>
  - Camera Manager를 통해 current Camera와 List를 관리
  - Camera Switching 기능
  - 카메라 미리보기 - Render texture
  - 성능 최적화를 위해 사용하지 않는 카메라 Component비활성화 및 동시 녹화 삭제
- <strong>카메라 타임라인 기능 : Queue로 구현</strong>
  - 타임라인 시간 동안 배치된 타임라인 아이템을 지나치며 아이템의 index 를 Queue에 EnQueue
  - 이미 저장된 카메라 index를 만나면 Dequeue
  - 해당 과정을 통해 Camera전환 및 블렌딩 가능
- <strong>그래픽 최적화</strong>
  - Static 체크
  - Light baking
  - Occulusion Culling 
- <strong>UnityWebRequest 를 통한 Http 통신 </strong>
  - 서버와 통신을 통해 데이터 주고 받기 outPut에서 Key값으로 원하는 데이터 추출
## 📝프로젝트를 진행하며 배운 점📝
<div class="callout"><span class="ci">💡</span> <strong>성능 최적화 작업: Draw Call, 그래픽 최적화<br><br></strong>녹화 기능이 있는 프로젝트인 만큼 프레임 수 및 성능 향상에 더욱 신경 써서 작업을 하였습니다. 다중 카메라로 인해 렌더링이 메모리를 차지하여 카메라를 설치할수록 30fps까지 떨어지는 문제가 발생했습니다. 따라서 대기 중인 카메라는 모두 카메라 Component를 비활성화하고 하나의 메인 카메라로 Virtual Camera의 우선순위를 바꿔가며 전환 및 녹화를 진행하여 해결하였습니다. 또한, 맵이 광활하고, 디테일한 오브젝트가 많아 성능저하가 발생하였는데, 이는 정적 오브젝트의 Static체크와, Light Baking, Occulusion Culling등으로 그래픽 렌더링 부하를 줄여주어 해결하였습니다.<br><br>다음과 같은 작업을 통해 게임 및 콘텐츠 개발에서 성능 최적화 작업이 얼마나 중요한 것인지 깨달았고, 이후 작업에서도 성능을 향상하기 위해 불필요한 리소스를 최소화하고, 그래픽 렌더링에 대한 이해를 바탕으로 작업할 수 있도록 노력했습니다.</div>
<div class="callout"><span class="ci">💡</span> <strong>카메라 타임라인 기능 <br></strong><br>카메라 타임라인 기능을 제공할 때, Queue 자료구조를 이용하여 구현하였습니다. Queue의 FIFO의 특성을 이용하여 시간이 흐름에 따라 먼저 들어온 아이템을 먼저 제거해 주어 순차적으로 Queue에 담긴 아이템들을 사용하며 카메라 블렌딩 및 전환을 구현했습니다. 이때 타임라인에 들어가는 아이템은 Struct로 구성하여 인덱스와 시간 정보를 포함하여 Queue에서 직관적으로 관리할 수 있도록 사용하였습니다.<br><br>이를 통해 자료구조 및 알고리즘이 실제 프로젝트에도 빈번히 사용된다는 것을 체감하고, 효율적인 알고리즘으로 기능을 직관적으로 구현할 수 있도록 노력하였습니다.</div>
