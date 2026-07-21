---
title: "오징어게임 VR"
subtitle: "무궁화 꽃이 피었습니다 · 기업 연계"
engine: "Unreal / BP·C++"
period: "2021.11"
team: "개발자 2 · 모델러 2"
status: ""
image: "/images/yt/squid.jpg"
video: "https://youtu.be/hiWAjNyuSsM"
tags: ["Unreal", "VR", "Blueprint", "OnlineSubsystem", "멀티플레이"]
links: { git: "", doc: "", video: "https://youtu.be/hiWAjNyuSsM" }
---
## 프로젝트 소개
기업 연계 프로젝트로 진행했으며, 드라마 '오징어 게임'의 '무궁화 꽃이 피었습니다'를 VR화한 게임입니다. AI 탐지 기술과 유저 간 멀티플레이로 몰입감 있게 즐길 수 있습니다.
## 💻담당 업무 및 해당 업무에서 사용된 기술
(Unreal Blueprint 80 / C++ 20)
- **멀티플레이 다중 서버 — 검색·찾기·호스트 (Steam VR 연동)**
  - OnlineSubsystem으로 구축, 여러 호스트의 서버 생성·검색 지원
  - 서버 생성 정보(이름·게임 중 유무·참여 인원)를 구조체 배열로 받아 출력
- **AI 참가자의 자연스러운 움직임**
  - 특정 범위 내 랜덤 위치 생성, 출발·멈춤 시각·속도를 다르게 설정
- **참가자 ScoreBoard**
  - 참가자 SteamID를 받아와 점수 기준 내림차순 정렬
## 📝프로젝트를 진행하며 배운 점📝
<div class="callout"><span class="ci">💡</span> <strong>멀티플레이 동기화<br><br></strong>클라이언트와 서버 행동 간 동기화가 되지 않아, 특히 점수판에서 타인의 점수를 받지 못해 순위 매김이 불가능한 문제가 있었습니다. 클라이언트 행동이 로컬에서만 이뤄지고 서버로 전송되지 않은 것이 원인임을 파악해, Run On Server로 실행 후 Multicast로 재전송하도록 수정했습니다. 이를 통해 각 함수가 어떤 상황에 쓰이는지, 멀티플레이에서 동기화가 왜 중요한지 명확히 이해했습니다.</div>
