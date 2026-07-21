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
 Zezz는 Sims와 Zepeto를 레퍼런스로 삼은 프로젝트로 아바타 커스터마이징, 마이홈 꾸미기 등, 메타버스 컨텐츠의 기본적인 기능 구현을 학습하기 위해 진행한 프로젝트입니다. FireBase를 통해 로그인을 하여 회원정보 및 커스텀 데이터를 데이터 베이스에 저장하였고 접속 시 다시 로드하여 플레이를 이어갈 수 있습니다.
## 📚프로젝트 자료
↘️클릭 시 원본 링크로 이동합니다
### [코드 분석 및 기술소개서](https://www.miricanvas.com/v/11mr28x)
## 💻담당 업무 및 해당 업무에서 사용된 기술
- <strong>Building System</strong>
  - Ray를 통해 바닥에 오브젝트를 배치
  - 일정 간격의 Grid대로 배치하기 위한 position 재조정
  - 설치 가능한 구역인지 판별: 오브젝트 간 Collider 판정
  - 미리보기 Object list를 Pooling해두어 불필요한 생성 및 삭제 방지
- <strong>Save Load System</strong>
  - 저장해야 하는 객체 정보들을 Class로 생성
  - Generic을 이용해 다양한 Class를 Save할 수 있는 함수 생성 → 함수의 재사용성 향상
  - FireBase의 실시간 데이터 베이스로 전송하여 저장
  - 이후 playerID와 비교하여 데이터를 다시 로드 가능
- <strong>HashTable을 이용하여 Room Custom정보 저장</strong>
  - Room을 생성할 당시 필요한 정보들을 Hash Table로 Key-Value 형태로 저장
- <strong>아바타 커스터마이징 </strong>
## 📝프로젝트를 진행하며 배운 점📝
<div class="callout"><span class="ci">💡</span> <strong>데이터 구조화 작업<br><br></strong>꾸민 방에 대한 정보가 유지되어야 하기 때문에 Firebase를 통해 데이터 정보를 서버에 저장하였습니다. 하지만 저장된 데이터를 불러오는 과정에서 데이터 구조를 부정확하게 불러와 불필요한 데이터가 로드되는 경우가 발생했습니다. 이때, Json형태로 저장된 정보의 Key-Value값 구조를 저왁히 이해하고 파악하여 해결할 수 있었습니다. 다음과 같은 과정을 통해 데이터 수신, 전송에 있어서 중요한 점과 Json데이터 구조를 명확히 이해할 수 있었습니다.</div>
