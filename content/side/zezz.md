---
title: "Zezz"
subtitle: "Zepeto+Sims 마이홈 메타버스 · Unity"
engine: "Unity / C#"
period: "2022.09"
team: "개발자 2인"
status: "Highlights"
image: "/images/yt/zezz.jpg"
video: "https://youtu.be/dXVODz3MJaY"
tags: ["Unity", "Firebase", "Realtime DB", "Building System"]
links: { git: "", doc: "https://www.miricanvas.com/v/11mr28x", video: "https://youtu.be/dXVODz3MJaY" }
---
## 프로젝트 소개
Sims와 Zepeto를 레퍼런스로 삼아, 아바타 커스터마이징·마이홈 꾸미기 등 메타버스 콘텐츠의 기본 기능 구현을 학습한 프로젝트입니다. Firebase 로그인으로 회원정보·커스텀 데이터를 DB에 저장하고, 접속 시 다시 로드해 플레이를 이어갈 수 있습니다.
## 📚프로젝트 자료
↘️클릭 시 원본 링크로 이동합니다
### [코드 분석 및 기술소개서](https://www.miricanvas.com/v/11mr28x)
## 💻담당 업무 및 해당 업무에서 사용된 기술
- **Building System**
  - Ray로 바닥에 오브젝트 배치, 일정 Grid 간격으로 position 재조정
  - 설치 가능 구역 판별(오브젝트 간 Collider 판정)
  - 미리보기 Object list를 Pooling해 불필요한 생성·삭제 방지
- **Save/Load System**
  - 저장할 객체 정보를 Class로 생성, Generic으로 다양한 Class를 Save하는 함수로 재사용성 향상
  - Firebase 실시간 DB에 저장, playerID와 비교해 재로드
- **HashTable로 Room Custom 정보 저장**
  - Room 생성 시 필요한 정보를 Key-Value로 저장
- **아바타 커스터마이징**
## 📝프로젝트를 진행하며 배운 점📝
<div class="callout"><span class="ci">💡</span> <strong>데이터 구조화<br><br></strong>꾸민 방 정보가 유지돼야 해서 Firebase로 서버에 저장했는데, 로드 과정에서 데이터 구조를 부정확하게 불러와 불필요한 데이터가 로드되는 문제가 있었습니다. JSON으로 저장된 정보의 Key-Value 구조를 정확히 이해·파악해 해결했고, 데이터 수신·전송의 요점과 JSON 구조를 명확히 이해했습니다.</div>
