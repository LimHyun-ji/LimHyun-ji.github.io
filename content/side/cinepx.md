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
메타버스 환경에서 다중 카메라로 영화를 촬영·합성하는 패러디 플랫폼입니다. 카메라 스위칭·미리보기(RenderTexture)·타임라인 블렌딩(Queue)과 그래픽 최적화(Static·Light Baking·Occlusion Culling)를 담당했습니다.
## 📚프로젝트 자료
↘️클릭 시 원본 링크로 이동합니다
### [코드 분석 및 기술소개서](https://www.miricanvas.com/v/11mr28x)
### [Git Repository](https://github.com/LimHyun-ji/AppleBox)
## 💻담당 업무 및 해당 업무에서 사용된 기술
- **영상 녹화 기능**
- **다중 카메라 관리**
  - Camera Manager로 current Camera와 List 관리, Camera Switching
  - 카메라 미리보기(Render Texture)
  - 성능 최적화 — 미사용 카메라 Component 비활성화, 동시 녹화 제거
- **카메라 타임라인 기능 — Queue로 구현**
  - 타임라인 동안 배치된 아이템 index를 Queue에 EnQueue, 이미 저장된 index를 만나면 Dequeue
  - 이를 통해 카메라 전환·블렌딩 구현
- **그래픽 최적화**
  - Static 체크 · Light Baking · Occlusion Culling
- **UnityWebRequest를 통한 HTTP 통신**
  - 서버와 데이터 송수신, output에서 Key 값으로 원하는 데이터 추출
## 📝프로젝트를 진행하며 배운 점📝
<div class="callout"><span class="ci">💡</span> <strong>성능 최적화: Draw Call·그래픽 최적화<br><br></strong>녹화 기능이 있는 만큼 프레임·성능에 특히 신경 썼습니다. 다중 카메라 렌더링이 메모리를 차지해 카메라를 설치할수록 30fps까지 떨어지는 문제가 발생했고, 대기 중인 카메라는 Component를 비활성화한 뒤 하나의 메인 카메라로 Virtual Camera 우선순위를 바꿔가며 전환·녹화해 해결했습니다. 또한 광활한 맵과 디테일한 오브젝트로 인한 성능저하는 Static 체크·Light Baking·Occlusion Culling으로 렌더링 부하를 줄여 해결했습니다.</div>
<div class="callout"><span class="ci">💡</span> <strong>카메라 타임라인 기능<br><br></strong>Queue 자료구조의 FIFO 특성을 이용해, 시간 흐름에 따라 먼저 들어온 아이템을 먼저 제거하며 순차적으로 카메라 블렌딩·전환을 구현했습니다. 타임라인 아이템은 Struct로 index·시간 정보를 담아 직관적으로 관리했습니다. 자료구조·알고리즘이 실제 프로젝트에 빈번히 쓰인다는 것을 체감한 계기였습니다.</div>
