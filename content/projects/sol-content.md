---
layout: project
order: 3
title: "인게임 컨텐츠 & 네트워크 — 길드 · 수집 · 순례 · 경제 · 채팅"
role: "Client Developer · Schema 설계·컨텐츠 구현 담당"
period: "2023 — 현재"
summary: "길드·수집·순례·경제·채팅 등 컨텐츠를 기획~UI~서버 동기화까지 담당. TCP·WebSocket·HTTP API 3방식 구분 적용."
tags: ["Gameplay", "Content", "Guild", "Economy", "CommonUI", "Protobuf", "TCP", "WebSocket", "HTTP API"]
imageLayout: slider
images:
  - src: "/images/projects/sol-content/Screenshot_26.png"
  - src: "/images/projects/sol-content/Screenshot_27.png"
  - src: "/images/projects/sol-content/Screenshot_28.png"
highlights:
  - "길드 시스템 성장 컨텐츠 담당 — 기획 요구사항에 따른 Schema 설계 → Manager-NotiServer 수신 구조 정립"
  - "수집/연구, 별자리·순례, 채팅, 리텐션 리워드, 세금·신권 등 성장·편의·경제 컨텐츠를 기획 연동부터 UI·서버 동기화까지 구현"
  - "CommonUI 레이어 스택 기반 UI와 Protobuf 서버 동기화, 수집은 ListView 전환·UObject→FClass 변환으로 GC 부담 감소"
---

> **목적** — 컨텐츠를 기획 연동부터 서버 동기화까지 구현하되, 컨텐츠 특성에 맞는 네트워크 방식 선택
>
> **성과** — 길드 장기 담당, 메시지 시스템 리팩토링으로 확장 비용↓, 성장 컨텐츠 지연 조회로 로그인 패킷 과부하 완화
>
> **기여** — 길드/수집/연구/채팅 초기 설계~리팩토링 전 주기, 수집 ListView·FClass GC 개선, TCP/WebSocket/HTTP API 3방식 구분 적용


## 문제 해결 요약

<div class="cases">
  <div class="case">
    <p class="case-title">로그인 패킷 과부하</p>
    <dl>
      <dt>문제</dt><dd>로그인 시점에 받을 데이터가 많아 패킷 과부하</dd>
      <dt>해결</dt><dd>성장 컨텐츠는 진입 시점에 HTTP API로 지연 조회</dd>
      <dt>결과</dt><dd>로그인 패킷 부담 완화</dd>
    </dl>
    <a class="case-more" href="#case-login-packet">자세히 ↓</a>
  </div>
  <div class="case">
    <p class="case-title">채팅 로그 과부하 및 순서 보장</p>
    <dl>
      <dt>문제</dt><dd>채팅 로그가 많아짐에 따라 클라 메모리 부족, 다중입력 시 순서 갱신 오류</dd>
      <dt>해결</dt><dd>채팅 채널 별 max 로그 설정 및 채널별 키매핑으로 관리, 패킷에 Sequence Num 추가</dd>
      <dt>결과</dt><dd>채널별 로그 적재량 관리, Sequence Num 기준으로 메시지 순서 보장</dd>
    </dl>
    <a class="case-more" href="#case-chat">자세히 ↓</a>
  </div>
</div>


## 개요

- **길드·수집·순례·경제·채팅** 등 게임 컨텐츠 시스템 폭넓은 담당
- 핵심 시스템 **장기 담당** — 기획 연동 → 구현 → 출시 → 라이브 운영 전 주기
- 컨텐츠 특성에 맞춰 **세 가지 네트워크 방식**을 구분 적용
  - **TCP** — 상시 동기화가 필요한 리텐션 리워드·데미지미터·세금 등
  - **WebSocket** — 채팅 실시간 송수신
  - **HTTP API** — 횡적 성장 컨텐츠를 진입 시점에 **지연 조회**해 로그인 패킷 과부하 방지

<div id="case-login-packet" class="case-anchor"></div>

**HTTP API를 따로 둔 이유는 로그인 패킷 과부하였습니다.** 횡적 성장 컨텐츠 데이터까지 로그인 시점에 함께 받으면 로그인 패킷이 무거워지기 때문에, 해당 컨텐츠에 진입하는 시점에 HTTP API로 지연 조회하도록 나눴습니다.

<img class="diagram" src="/images/diagrams/outgame-noti.svg" alt="게임 컨텐츠 Manager 패턴 시퀀스: 서버 NotifyEvt→UNetworkNotiClient→UGuildManager 상태 갱신→델리게이트 브로드캐스트→UI, UI 입력→Manager→서버 요청" />

## 담당 컨텐츠

<div id="case-guild" class="case-anchor"></div>

### 길드

- 길드 생성·권한·기부·분배 연계 등 도메인 클라이언트 전반 담당

- 내 길드 관련 정보 전체 데이터와 상대 길드 관련 요약 정보 데이터 분리
- 길드 정보 갱신에 따라 Guild Manager에서 NotiServer(WebSocket)이벤트 수신으로 UI 전파

### 별자리 · 순례 · 연구/연성

- 입력 방식·게이지·확률 표기·정산 로직 구현
- 순례: 로직(`TravelManager`)과 연출공간(`CinePilgrimageManager`) 분리 — 연출 수정의 정산 로직 무영향 구조
- 연출 상세: [인게임 연출 페이지](/projects/rendering-cinema/)

### 도감 / 수집

- 일괄등록·일괄강화, overEnchant 표시·정렬, 거래소 검색 연동 등 수집 동선 구축
- **페이징 제거 → ListView 전환, 일부 데이터 UObject→FClass 변환으로 GC 부담 감소**

<div id="case-chat" class="case-anchor"></div>

### 채팅 / 소셜 · 리텐션 · 재화 정산

- 채팅, 리텐션 리워드(출석/보상), 세금 재화 정산 신규 도입 및 운영 이슈 대응
- **채팅 로그 과부하 · 순서 오류** — 채널별 최대 로그 수 설정 · 채널별 키 매핑으로 로그를 관리하고, 패킷에 Sequence Num을 추가해 다중 입력 시에도 순서 보장
- 세금의 경우 반올림 계산에 따른 부동소수점 오차 확인

## 기술 요약

| 영역 | 내용 |
|------|------|
| 언어 / 엔진 | C++ · Unreal Engine 5 (커스텀 브랜치) |
| 매니저 | `UGameInstanceSubsystem` 기반 Manager (예: `UGuildManager`) — `Get()` 싱글톤, 서버 푸시 수신(`INetworkNotiClientListener`) |
| 서버 동기화 | `UGeoSubsystem` (TCP · WebSocket Noti) · Protobuf 직렬화 |
| UI | CommonUI(`UCommonActivatableWidget`) · `UPrimaryGameLayout` 레이어 스택 |
| 데이터 | `MetaDataSubsystem` 메타데이터 테이블 · `RidType` 키 |
