---
layout: project
order: 3
title: "인게임 콘텐츠 & 네트워크 — 길드·수집·순례·경제·채팅"
role: "Client Developer · 핵심 담당"
period: "2023 — 현재"
summary: "길드·수집·순례·경제·채팅 등 콘텐츠를 기획 연동부터 UI·서버 동기화까지 담당하며, 콘텐츠 특성에 맞춰 세 가지 네트워크 방식을 구분 적용 — TCP(리텐션 리워드·데미지미터·세금), WebSocket(채팅 실시간), HTTP API(횡적 성장 콘텐츠 지연 조회로 로그인 패킷 과부하 방지)."
tags: ["Gameplay", "Content", "Guild", "Economy", "CommonUI", "Protobuf", "TCP", "WebSocket", "HTTP API"]
images:
  - src: "/images/projects/sol-content/Screenshot_26.png"
  - src: "/images/projects/sol-content/Screenshot_27.png"
  - src: "/images/projects/sol-content/Screenshot_28.png"
highlights:
  - "길드/아지트 시스템을 담당 — 초기 아키텍처(매니저 컴포넌트) 설계 → 컴포넌트 이벤트에서 메시지 시스템으로 전면 리팩토링"
  - "수집/도감/연구, 별자리·순례, 채팅/소셜, 리텐션 리워드, 세금·신권 등 성장·편의·경제 콘텐츠를 기획 연동부터 UI·서버 동기화까지 구현"
  - "CommonUI 레이어 스택(UPrimaryGameLayout) 기반 UI와 Protobuf 서버 동기화, 수집은 ListView 전환·UObject→FClass 변환으로 GC 부담 감소"
---

> **목적** — 콘텐츠를 기획 연동부터 서버 동기화까지 구현하되, 콘텐츠 특성에 맞는 네트워크 방식 선택
>
> **성과** — 길드 장기 담당, 메시지 시스템 리팩토링으로 확장 비용↓, 성장 콘텐츠 지연 조회로 로그인 패킷 과부하 완화
>
> **기여** — 길드/아지트 초기 설계~리팩토링 전 주기, 수집 ListView·FClass GC 개선, TCP/WebSocket/HTTP API 3방식 구분 적용

## 개요

- **길드·수집·순례·경제·채팅** 등 게임 콘텐츠 시스템 폭넓은 담당
- 핵심 시스템 **장기 담당** — 기획 연동 → 구현 → 출시 → 라이브 운영 전 주기
- 콘텐츠 특성에 맞춰 **세 가지 네트워크 방식**을 구분 적용
  - **TCP** — 상시 동기화가 필요한 리텐션 리워드·데미지미터·세금 등
  - **WebSocket** — 채팅 실시간 송수신
  - **HTTP API** — 횡적 성장 콘텐츠를 진입 시점에 **지연 조회**해 로그인 패킷 과부하 방지

<img class="diagram" src="/images/diagrams/outgame-noti.svg" alt="게임 콘텐츠 Manager 패턴 시퀀스: 서버 NotifyEvt→UNetworkNotiClient→UGuildManager 상태 갱신→델리게이트 브로드캐스트→UI, UI 입력→Manager→서버 요청" />

## 담당 콘텐츠

### 길드 / 아지트 — 대표작

- 길드 생성·권한·기부·PvP·신권(디바인파워) 연계 등 도메인 클라이언트 전반 담당

**왜 리팩토링했나.**
- 초기: 컴포넌트 이벤트로 각 수신처 직접 전파 → 기능 증가 시 위젯·컴포넌트 결합 심화·추적 난항

**어떻게.**
- 전파 경로 **메시지 시스템 기반 전면 재편** — `UGuildManager` 단일 수신점
- 기부·PvP·신권 추가 시 구독만 추가하면 되는 저비용 확장 구조

### 별자리 · 순례 · 연구/연성

- 입력 방식·게이지·확률 표기·정산 로직 구현
- 순례: 로직(`UTravelManager`)과 연출(`ACinePilgrimageManager`) 분리 — 연출 수정의 정산 로직 무영향 구조
- 연출 상세: [인게임 연출 페이지](/projects/rendering-cinema/)

### 도감 / 수집

- 일괄등록·일괄강화, overEnchant 표시·정렬, 거래소 검색 연동 등 수집 동선 구축
- 페이징 제거 → ListView 전환, 일부 데이터 UObject→FClass 변환으로 GC 부담 감소

### 채팅 / 소셜 · 리텐션 · 재화 정산

- 채팅/소셜·파티, 리텐션 리워드(출석/보상), 세금·신권(DivinePower) 재화 정산 신규 도입 및 운영 이슈 대응

## 기술 요약

| 영역 | 내용 |
|------|------|
| 언어 / 엔진 | C++ · Unreal Engine 5 (커스텀 브랜치) |
| 매니저 | `USolGameInstanceSubsystem` 기반 Manager (예: `UGuildManager`) — `Get()` 싱글톤, 서버 푸시 수신(`INetworkNotiClientListener`) |
| 서버 동기화 | `USolGeoSubsystem` (TCP · WebSocket Noti) · Protobuf 직렬화 |
| UI | CommonUI(`UCommonActivatableWidget`) · `UPrimaryGameLayout` 레이어 스택 |
| 데이터 | `MetaDataSubsystem` 메타데이터 테이블 · `RidType` 키 |

## Manager 구조 — 서버 Noti 단일 수신점

- 서버 Noti: Manager 단일 창구 수신 → 상태 갱신 → 델리게이트로 UI 전파
- 사용자 입력 흐름: **UI → Manager → 서버 요청**

## 시스템별 핵심 설계

- 모든 콘텐츠 매니저: **`USolGameInstanceSubsystem` + `INetworkNotiClientListener`** 공통 골격
- 세션 단위 싱글톤 — 서버 Noti 직접 수신 → 상태 갱신 → 멀티캐스트 델리게이트로 UI 전파

```cpp
// System/Guild/GuildManager.h — 서버 Noti 단일 수신점 (INetworkNotiClientListener)
class UGuildManager : public USolGameInstanceSubsystem, public INetworkNotiClientListener {
    static UGuildManager& Get(const UObject* WorldContextObject);   // 세션 단위 싱글톤
    // 서버 Noti를 받아 길드 상태를 갱신 (UI 전파는 델리게이트로)
};
```
- 자금 입금·분배: 별도 `UGuildDistributionManager`(`DepositFund` / `Distribute` / `RequestFundBalance`) 분리 — 운영 로직·분배 정산 모듈화

```cpp
// System/Travel/TravelManager.h — 순례 보드 진행·주사위 정산 로직 (연출과 분리)
bool TryRollDice(const ETravelEventCategory InCategory);
```
