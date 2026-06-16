---
layout: project
order: 1
title: "Sol — MMORPG 콘텐츠 시스템 (Unreal Engine 5)"
role: "Client Developer"
period: "2023.02 — 현재"
summary: "커스텀 UE5 엔진 브랜치 기반 모바일/PC MMORPG(Sol) 내 작업 영역. 다수의 게임 콘텐츠 시스템을 장기 오너십으로 설계·개발·라이브 운영."
tags: ["Unreal Engine 5", "C++", "Gameplay", "UI", "Live Ops"]
highlights:
  - "길드/아지트 시스템을 4년 연속 단독 오너십으로 담당 — 초기 아키텍처 설계(CL 11999)·컴포넌트 이벤트→메세지 시스템 전면 리팩토링(CL 18849)부터 자금 분배 시스템(int64 오버플로 대응 SB-8224)까지 전 주기 책임"
  - "별자리(천체)·순례·연구/연성 등 고유 콘텐츠 시스템을 기획 연동부터 연출·확률 표기까지 구현"
  - "도감/수집 시스템: 컬렉션 일괄등록·일괄강화, overEnchant 표시·정렬, 거래소 검색 연동, 페이징→ListView 전환 및 UObject→FClass 변환으로 GC 부담 감소"
  - "재화 정산 경제 시스템: 세금(double→int64 정밀도·개별 올림)·신권(DivinePower) 세율·길드 자금 분배 오버플로를 코드 레벨에서 보장"
  - "재현 어려운 비동기/레이스 컨디션 크래시를 원인까지 추적해 구조적으로 차단(별자리 서버-클라 결과 불일치 CL 30065 등)"
  - "채팅/소셜·리텐션 리워드 등 라이브 서비스 시스템 신규 도입, CommonUI 레이어 스택 UI와 Protobuf 서버 동기화"
---

> 이 페이지는 MMORPG 'Sol' 프로젝트 내에서 담당한 **콘텐츠 시스템 작업 영역**을 정리한 것입니다. (인게임 연출/렌더링·에디터 툴·최적화는 별도 페이지 참고)

## 개요

커스텀 Unreal Engine 5 브랜치 위에서 개발되는 모바일/PC MMORPG의 **클라이언트 콘텐츠 시스템**을
폭넓게 담당했습니다. 단발성 기능 구현을 넘어, 여러 핵심 시스템을 **장기 오너십**으로 맡아
기획 연동 → 구현 → 출시 → 라이브 운영까지 전 주기를 책임졌습니다.

## 담당 시스템

### 길드 / 아지트
길드 생성·권한 설정·기부·PvP·신권(디바인파워) 연계 등 길드 도메인 클라이언트 전반을 담당했습니다.
가장 오래, 가장 많이 작업한 시스템으로 출시 전후 지속적으로 기능을 확장했습니다.

### 별자리 · 순례 · 연구/연성
게임의 고유 성장·재화 콘텐츠인 별자리(천체), 순례(보드형 진행), 연구/연성 시스템을
입력 방식·게이지·확률 표기·연출·정산 로직까지 구현했습니다.

### 도감 / 수집
컬렉션 일괄등록·일괄강화, overEnchant(초과 강화수치) 표시·정렬, 거래소 검색 연동 등 수집 콘텐츠의 사용자 동선을 구축했고,
페이징을 제거해 ListView로 전환하고 일부 데이터를 UObject→FClass로 변환해 GC 부담을 줄였습니다.

### 라이브 서비스 시스템
채팅/소셜·파티, 리텐션 리워드(출석/보상), 재화별 세금 정산, 랭킹 등
라이브 운영에 필요한 시스템을 신규 도입하고 운영 이슈에 대응했습니다.

## 기술 요약

| 영역 | 내용 |
|------|------|
| 언어 / 엔진 | C++ · Unreal Engine 5 (커스텀 브랜치) |
| 매니저 | `USolGameInstanceSubsystem` 기반 Manager (예: `UGuildManager`) — `Get()` 싱글톤, 서버 푸시 수신(`INetworkNotiClientListener`) |
| 네트워크 | `USolGeoSubsystem` (TCP NetworkClient · WebSocket Noti) · Protobuf 직렬화 |
| UI | CommonUI(`UCommonActivatableWidget`) · `UPrimaryGameLayout` 레이어 스택 |
| 데이터 | `MetaDataSubsystem` 메타데이터 테이블 · `RidType` 키 |
| 엔티티 | `FEntityProxyComponent_*` 로 서버 엔티티 ↔ 액터 컴포넌트 브리지 |

## Manager 구조

서버 푸시(Noti)는 Manager가 수신해 상태를 갱신하고 델리게이트로 UI에 전파합니다.
사용자 입력은 **UI → Manager → 서버 요청** 순으로 흐릅니다.

<div class="mermaid">
flowchart TD
  SV["게임 서버 / API"] -->|"패킷 · Proto · Noti"| GEO["USolGeoSubsystem<br/>NetworkClient · Noti"]
  GEO -->|"Noti 이벤트"| MGR["Feature Manager<br/>예: UGuildManager<br/>(USolGameInstanceSubsystem)"]
  META["MetaDataSubsystem"] -->|"메타데이터"| MGR
  MGR -->|"상태 · 델리게이트"| UI["Feature Screen / Widgets"]
  UI -->|"사용자 입력"| MGR
  MGR -->|"요청 전송"| GEO
</div>

## UI 구조

각 화면은 `UCommonActivatableWidget` 으로, `FGameplayTag` 기반 레이어 스택에 push/pop 됩니다.

<div class="mermaid">
flowchart TD
  PGL["UPrimaryGameLayout<br/>(UI 루트)"] --> HUD["UI.Layer.HUD<br/>GeoHUD"]
  PGL --> FULL["UI.Layer.Full<br/>전체화면 스크린"]
  PGL --> POPUP["UI.Layer.Popup"]
  PGL --> MODAL["UI.Layer.Modal<br/>다이얼로그"]
  PGL --> SEQ["UI.Layer.Sequence"]
  PGL --> SYS["UI.Layer.SystemMessageLayer"]
</div>

## 시스템별 핵심 설계

모든 콘텐츠 매니저는 **`USolGameInstanceSubsystem` + `INetworkNotiClientListener`** 라는 공통 골격을 따릅니다 — 세션 단위 싱글톤으로 서버 Noti를 직접 수신해 상태를 갱신하고, 멀티캐스트 델리게이트로 UI에 전파합니다. (UI는 `NativeConstruct`에서 구독, `NativeDestruct`에서 해제)

### 길드 / 아지트
```cpp
// System/Guild/GuildManager.h — 서버 Noti 수신 + 길드 상태 델리게이트
class UGuildManager : public USolGameInstanceSubsystem, public INetworkNotiClientListener {
    static UGuildManager& Get(const UObject* WorldContextObject);
    FOnMyGuildInfoUpdated  OnMyGuildInfoUpdated;
    FOnJoinApplierList     OnJoinApplierList;
};
```
자금 입금·분배는 별도 `UGuildDistributionManager`(`DepositFund` / `Distribute` / `RequestFundBalance`)로 분리해 길드 운영 로직과 분배 정산을 모듈화했습니다.

### 순례 (Pilgrimage) — 시스템/연출 분리
보드 진행·주사위 정산은 `UTravelManager`(시스템)가, 카메라·시퀀스 연출은 `ACinePilgrimageManager`(액터)가 담당하도록 **로직과 연출을 분리**했습니다.
```cpp
// System/Travel/TravelManager.h
bool TryRollDice(const ETravelEventCategory InCategory);
FOnRollDiceResultEvt      OnRollDiceResultEvt;     // 주사위 결과
FOnPilgrimageLapCompleted OnPilgrimageLapCompleted; // 완주 정산
```

### 별자리 (Constellation) — LevelSequence 입력/연출
```cpp
// Cinema/Constellation/CineConstellation.h — 액터 클릭 입력 → 델리게이트
virtual void NotifyActorOnClicked(FKey ButtonPressed) override;
FOnConstellationStarClicked OnConstellationStarClicked;
```
`UCinemaConstellationManager`가 `TSoftObjectPtr<ULevelSequence>`를 바인딩해 별 선택/포커스 이동 애니메이션을 재생하고 PocketLevel 인스턴스를 관리합니다.

### 연구/연성 · 수집
```cpp
// System/Research/ResearchManager.h
void RequestResearch(int32 ResearchRid);
bool CanResearch(int32 ResearchRid) const;
FOnResearchForgedEvt OnResearchForgedEvt;          // 연성 완료(성공/실패)
```
```cpp
// System/ItemCollection/ItemCollectionManager.h
void RequestRegisterItemCollection(const TArray<FItemCollectionRegisterParam>&);
void RequestBookmarkItemCollection(const TArray<int32>& CollectionRids, bool IsSetBookmark);
// + 거래소 검색 연동 / 레시피 메타데이터 검증
```
