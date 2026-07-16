---
layout: project
order: 3
title: "인게임 콘텐츠 & 네트워크 (TCP · WebSocket · HTTP)"
role: "Client Developer"
period: "2023 — 현재"
summary: "TCP·WebSocket·HTTP 세 가지 통신을 목적에 맞게 나눠 쓰고, 그 위에서 길드·수집·연구·순례 등 다수의 인게임 콘텐츠를 서버 동기화·조회 기반으로 신규 개발·유지보수."
tags: ["Gameplay", "Networking", "TCP", "WebSocket", "HTTP", "Protobuf"]
highlights:
  - "TCP 서버 동기화 — 리텐션 리워드·데미지 미터·세금 등 상태 동기화가 중요한 콘텐츠를 게임 서버 패킷으로 처리"
  - "WebSocket 실시간 — 채팅을 웹소켓 기반 채널 시스템으로 구축해 빠른 실시간 통신을 확보"
  - "HTTP API + 지연 조회 — 길드·수집·연구·순례 등 횡적 성장 콘텐츠를 각 UI Screen 진입 시점에 조회해 로그인 시점의 패킷 과부하를 방지"
  - "길드/아지트 시스템을 다년간 단독 오너십 — 초기 설계부터 이벤트→메시지 시스템 전면 리팩토링, 자금 분배 정밀도(int64)까지 전 주기 책임"
---

> **목적** — 세 가지 네트워크 통신을 목적에 맞게 설계하고 그 위에 인게임 콘텐츠를 구현
> **성과** — 통신 방식별 최적 설계(동기화/실시간/조회 분리), 로그인 패킷 과부하 완화, 길드 다년 오너십
> **기여** — 길드·수집·연구·순례 등 콘텐츠 전반의 서버 동기화·조회 구현과 장기 유지보수

## 통신 방식을 목적에 맞게 나눠 쓴다

Sol은 세 가지 네트워크 통신을 함께 씁니다. 각 콘텐츠의 성격(상태 동기화 / 실시간성 / 조회)에 맞춰 어떤 통신을 쓸지 나눠 설계했습니다.

| 통신 | 성격 | 담당 콘텐츠 |
|------|------|------------|
| **TCP** (게임 서버 패킷) | 상태 동기화 중심 | 리텐션 리워드, 데미지 미터, 세금 정산 |
| **WebSocket** (Noti) | 실시간성 | 채팅 채널, 서버 푸시 이벤트 |
| **HTTP API** + 지연 조회 | 진입 시점 조회 | 길드·수집·연구·순례 등 횡적 성장 |

- **TCP** — 상태가 서버와 정확히 맞아야 하는 콘텐츠는 게임 서버 TCP 패킷으로 동기화합니다. 리텐션 리워드·데미지 미터·세금처럼 값 정합성이 중요한 것들입니다.
- **WebSocket** — 채팅은 실시간성이 중요해 웹소켓 기반으로 채널 시스템을 구축, 빠른 데이터 통신을 확보했습니다.
- **HTTP API + 지연 조회** — 길드·수집·연구·순례 등은 필요할 때만 조회하면 됩니다. 그래서 로그인 시점에 모두 받지 않고 **각 UI Screen에 진입할 때 조회**하도록 지연시켜, 로그인 시점 패킷 과부하를 방지했습니다.

<img class="diagram" src="/images/diagrams/network-3comm.svg" alt="네트워크 3통신 분리: TCP는 리텐션·데미지미터·세금, WebSocket은 채팅, HTTP 지연 조회는 길드·수집·연구·순례" />

## 담당 콘텐츠

### 길드 / 아지트 — 대표작
길드 생성·권한·기부·PvP·신권(디바인파워) 연계 등 길드 도메인 클라이언트 전반을 다년간 단독 오너십으로 담당했습니다. 가장 오래, 가장 많이 작업한 시스템입니다.

**왜 리팩토링했나.** 초기 구현은 길드 상태 변경을 컴포넌트 이벤트로 각 수신처에 직접 전파하는 구조였습니다. 기능이 늘수록 위젯·컴포넌트 결합이 깊어져, 어느 위젯이 어떤 이벤트를 받는지 추적이 어려워졌습니다.

**어떻게.** 전파 경로를 **메시지 시스템 기반으로 전면 재편**했습니다. `UGuildManager`가 서버 Noti의 **단일 수신점**이 되어 상태를 갱신하고, 멀티캐스트 델리게이트로 UI에 전파합니다. 이후 기부·PvP·신권 등 기능을 추가할 때 새 위젯은 구독만 추가하면 되는 형태로 확장 비용이 줄었습니다.

> **트러블슈팅 — 길드 자금 정산 정밀도**
> (증상) 큰 금액을 분배할 때 정산 값이 어긋남. (원인) 정산이 double로 수행돼 큰 금액에서 부동소수 정밀도 한계·오버플로 가능성. (해결) 세금·분배 정산을 **double→int64로 전환**하고 항목마다 올림을 적용해 코드 레벨에서 정밀도·오버플로 안전성 보장.

### 별자리 · 순례 · 연구/연성
고유 성장·재화 콘텐츠를 입력 방식·게이지·확률 표기·정산 로직까지 구현했습니다. 특히 순례는 로직(`UTravelManager`)과 연출(`ACinePilgrimageManager`)을 분리해, 연출 수정이 정산 로직에 영향을 주지 않게 했습니다. (연출 상세는 [인게임 연출 페이지](/projects/rendering-cinema/) 참고)

### 도감 / 수집
컬렉션 일괄등록·일괄강화, overEnchant 표시·정렬, 거래소 검색 연동 등 수집 동선을 구축했고, 페이징을 제거해 ListView로 전환하고 일부 데이터를 UObject→FClass로 변환해 GC 부담을 줄였습니다.

## 기술 요약

| 영역 | 내용 |
|------|------|
| 언어 / 엔진 | C++ · Unreal Engine 5 (커스텀 브랜치) |
| 네트워크 | `USolGeoSubsystem` (TCP NetworkClient · WebSocket Noti) · HTTP API 서버 · Protobuf 직렬화 |
| 매니저 | `USolGameInstanceSubsystem` 기반 Manager (예: `UGuildManager`) — `Get()` 싱글톤, 서버 푸시 수신(`INetworkNotiClientListener`) |
| UI | CommonUI(`UCommonActivatableWidget`) · `UPrimaryGameLayout` 레이어 스택 |
| 데이터 | `MetaDataSubsystem` 메타데이터 테이블 · `RidType` 키 |

## 데이터 흐름 — 수신은 Manager 단일 창구, 조회는 화면 진입 시점

<div class="mermaid">
flowchart TD
  SV["게임 서버 / API"] -->|"TCP 패킷 · Proto · WebSocket Noti"| GEO["USolGeoSubsystem<br/>NetworkClient · Noti"]
  GEO -->|"Noti 이벤트"| MGR["Feature Manager<br/>예: UGuildManager"]
  META["MetaDataSubsystem"] -->|"메타데이터"| MGR
  MGR -->|"상태 · 델리게이트"| UI["Feature Screen / Widgets"]
  UI -->|"화면 진입 시 조회 (지연)"| MGR
  MGR -->|"요청 전송"| GEO
</div>

## 시스템별 핵심 설계

모든 콘텐츠 매니저는 **`USolGameInstanceSubsystem` + `INetworkNotiClientListener`** 공통 골격을 따릅니다 — 세션 단위 싱글톤으로 서버 Noti를 직접 수신해 상태를 갱신하고, 멀티캐스트 델리게이트로 UI에 전파합니다.

```cpp
// System/Guild/GuildManager.h — 서버 Noti 단일 수신점 (INetworkNotiClientListener)
class UGuildManager : public USolGameInstanceSubsystem, public INetworkNotiClientListener {
    static UGuildManager& Get(const UObject* WorldContextObject);   // 세션 단위 싱글톤
    // 서버 Noti를 받아 길드 상태를 갱신 (UI 전파는 델리게이트로)
};
```
자금 입금·분배는 별도 `UGuildDistributionManager`(`DepositFund` / `Distribute` / `RequestFundBalance`)로 분리해 운영 로직과 분배 정산을 모듈화했습니다.

```cpp
// System/Travel/TravelManager.h — 순례 보드 진행·주사위 정산 로직 (연출과 분리)
bool TryRollDice(const ETravelEventCategory InCategory);
```
