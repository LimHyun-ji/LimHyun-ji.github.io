---
layout: project
order: 3
title: "아웃게임 시스템 — 로비·성장·편의 콘텐츠"
role: "Client Developer · 핵심 담당"
period: "2023 — 현재"
summary: "길드·수집·연구·별자리·순례·채팅·리텐션·재화 정산 등 로비·성장·편의·경제 콘텐츠를 기획 연동부터 UI·서버 동기화까지 폭넓게 담당."
tags: ["Gameplay", "Out-game", "Guild", "Economy", "CommonUI", "Protobuf"]
highlights:
  - "길드/아지트 시스템을 다년간 단독 오너십 — 초기 아키텍처(매니저 컴포넌트) 설계 → 컴포넌트 이벤트에서 메시지 시스템으로 전면 리팩토링 → 자금 분배(int64 오버플로 대응)"
  - "수집/도감/연구, 별자리·순례, 채팅/소셜, 리텐션 리워드, 세금·신권 등 성장·편의·경제 콘텐츠를 기획 연동부터 UI·서버 동기화까지 구현"
  - "CommonUI 레이어 스택(UPrimaryGameLayout) 기반 UI와 Protobuf 서버 동기화, 수집은 ListView 전환·UObject→FClass 변환으로 GC 부담 감소"
  - "재화 정산 정밀도(int64/double·올림)를 코드 레벨에서 보장해 라이브 경제 시스템의 수치 안정성 확보"
---

> **목적** — 로비·성장·편의·경제 콘텐츠를 기획 연동부터 서버 동기화까지 폭넓게 구현
> **성과** — 길드 다년 오너십, 메시지 시스템 리팩토링으로 확장 비용↓, 재화 정산 int64 정밀도 보장
> **기여** — 길드/아지트 초기 설계~리팩토링~자금 분배 전 주기, 수집 ListView·FClass GC 개선

## 개요

인게임 전투 외에도 **로비·성장·편의·경제**를 아우르는 아웃게임 콘텐츠를 폭넓게 담당했습니다. 단발성 기능 구현을 넘어, 여러 핵심 시스템을 **장기 오너십**으로 맡아 기획 연동 → 구현 → 출시 → 라이브 운영까지 책임졌습니다.

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

### 채팅 / 소셜 · 리텐션 · 재화 정산
채팅/소셜·파티, 리텐션 리워드(출석/보상), 세금·신권(DivinePower) 등 재화 정산을 신규 도입하고 운영 이슈에 대응했습니다. 재화 정산은 정밀도(int64/double·올림)를 코드 레벨에서 보장해 라이브 경제의 수치 안정성을 확보했습니다.

## 기술 요약

| 영역 | 내용 |
|------|------|
| 언어 / 엔진 | C++ · Unreal Engine 5 (커스텀 브랜치) |
| 매니저 | `USolGameInstanceSubsystem` 기반 Manager (예: `UGuildManager`) — `Get()` 싱글톤, 서버 푸시 수신(`INetworkNotiClientListener`) |
| 서버 동기화 | `USolGeoSubsystem` (TCP · WebSocket Noti) · Protobuf 직렬화 |
| UI | CommonUI(`UCommonActivatableWidget`) · `UPrimaryGameLayout` 레이어 스택 |
| 데이터 | `MetaDataSubsystem` 메타데이터 테이블 · `RidType` 키 |

## Manager 구조 — 서버 Noti 단일 수신점

서버 푸시(Noti)는 Manager가 단일 창구로 수신해 상태를 갱신하고 델리게이트로 UI에 전파합니다. 사용자 입력은 **UI → Manager → 서버 요청** 순으로 흐릅니다.

<div class="mermaid">
flowchart TD
  SV["게임 서버 / API"] -->|"패킷 · Proto · Noti"| GEO["USolGeoSubsystem"]
  GEO -->|"Noti 이벤트"| MGR["Feature Manager<br/>예: UGuildManager"]
  META["MetaDataSubsystem"] -->|"메타데이터"| MGR
  MGR -->|"상태 · 델리게이트"| UI["Feature Screen / Widgets"]
  UI -->|"사용자 입력"| MGR
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
