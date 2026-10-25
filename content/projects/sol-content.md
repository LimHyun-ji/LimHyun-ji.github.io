---
layout: project
order: 3
title: "인게임 콘텐츠 & 네트워크 — 길드 · 수집 · 순례 · 경제 · 채팅 · 시간보정"
role: "Client Developer · Schema 설계·컨텐츠 구현 담당"
period: "2023 — 현재"
summary: "길드·수집·순례·경제·채팅 등 콘텐츠를 기획~UI~서버 동기화까지 담당. TCP·WebSocket·HTTP API 3방식 구분 적용."
tags: ["Gameplay", "Content", "Guild", "Economy", "Chat", "DeltaTime", "CommonUI", "Protobuf", "TCP", "WebSocket", "HTTP API"]
imageLayout: slider
images:
  - src: "/images/projects/sol-content/Screenshot_26.png"
  - src: "/images/projects/sol-content/Screenshot_27.png"
  - src: "/images/projects/sol-content/Screenshot_28.png"
highlights:
  - "길드 시스템 성장 컨텐츠 담당 — 기획 요구사항에 따른 Schema 설계 → Manager-NotiServer 수신 구조 정립"
  - "수집/연구, 별자리·순례, 채팅, 리텐션 리워드, 세금·신권 등 성장·편의·경제 콘텐츠를 기획 연동부터 UI·서버 동기화까지 구현"
  - "CommonUI 레이어 스택 기반 UI와 Protobuf 서버 동기화, 수집은 ListView 전환·UObject→FClass 변환으로 GC 부담 감소"
---

> **목적** — 콘텐츠를 기획 연동부터 서버 동기화까지 구현하되, 콘텐츠 특성에 맞는 네트워크 방식 선택
>
> **성과** — 길드 장기 담당, 메시지 시스템 리팩토링으로 확장 비용↓, 성장 콘텐츠 지연 조회로 로그인 패킷 과부하 완화
>
> **기여** — 길드/수집/연구/채팅 초기 설계~리팩토링 전 주기, 수집 ListView·FClass GC 개선, TCP/WebSocket/HTTP API 3방식 구분 적용


## 문제 해결 요약

<div class="cases">
  <div class="case">
    <p class="case-title">로그인 패킷 과부하</p>
    <dl>
      <dt>문제</dt><dd>로그인 시점에 받을 데이터가 많아 패킷 과부하</dd>
      <dt>해결</dt><dd>성장 콘텐츠는 진입 시점에 HTTP API로 지연 조회</dd>
      <dt>결과</dt><dd>로그인 패킷 부담 완화</dd>
    </dl>
    <a class="case-more" href="#case-login-packet">자세히 ↓</a>
  </div>
  <div class="case">
    <p class="case-title">채팅 로그 과부하 및 순서 보장</p>
    <dl>
      <dt>문제</dt><dd>채팅 로그가 많아짐에 따라 클라 메모리 부족, 다중입력 시 순서 갱신 오류</dd>
      <dt>해결</dt><dd>채팅 채널 별 max 로그 설정 및 채널별 키매핑으로 관리, 패킷에 Sequence Num 추가</dd>
      <dt>결과</dt><dd>각 채널별 로그 적재 관리 용이</dd>
    </dl>
    <a class="case-more" href="#case-login-packet">자세히 ↓</a>
  </div>
</div>


## 개요

- **길드·수집·순례·경제·채팅** 등 게임 콘텐츠 시스템 폭넓은 담당
- 핵심 시스템 **장기 담당** — 기획 연동 → 구현 → 출시 → 라이브 운영 전 주기
- 콘텐츠 특성에 맞춰 **세 가지 네트워크 방식**을 구분 적용
  - **TCP** — 상시 동기화가 필요한 리텐션 리워드·데미지미터·세금 등
  - **WebSocket** — 채팅 실시간 송수신
  - **HTTP API** — 횡적 성장 콘텐츠를 진입 시점에 **지연 조회**해 로그인 패킷 과부하 방지

<div id="case-login-packet" class="case-anchor"></div>

**HTTP API를 따로 둔 이유는 로그인 패킷 과부하였습니다.** 횡적 성장 콘텐츠 데이터까지 로그인 시점에 함께 받으면 로그인 패킷이 무거워지기 때문에, 해당 콘텐츠에 진입하는 시점에 HTTP API로 지연 조회하도록 나눴습니다.

<img class="diagram" src="/images/diagrams/outgame-noti.svg" alt="게임 콘텐츠 Manager 패턴 시퀀스: 서버 NotifyEvt→UNetworkNotiClient→UGuildManager 상태 갱신→델리게이트 브로드캐스트→UI, UI 입력→Manager→서버 요청" />

## 담당 콘텐츠

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

### 채팅 / 소셜 · 리텐션 · 재화 정산

- 채팅, 리텐션 리워드(출석/보상), 세금 재화 정산 신규 도입 및 운영 이슈 대응
- 세금의 경우 반올림 계산에 따른 부동소수점 오차 확인

---

## 채팅 채널 시스템

채팅은 갱신 주기가 잦아 게임 서버(TCP)와 별도로 **채널 서버(WebSocket)** 를 분리했습니다. `UNetworkChannelSystem` 이 단일 WebSocket 연결을 유지하고, 채널 타입별 클래스(`UNetworkChannel_Geo` · `UNetworkChannel_Guild` · `UNetworkChannel_World` · `UNetworkChannel_Direct`)가 채널 고유 동작을 캡슐화합니다.

### Channel Key — Channel Instance 매핑

```cpp
// NetworkChannelSystem.h
static FNetworkChannelKey BuildChannelKey(EChatType InChatType, const FString& InStringKey);

FNetworkChannelKey JoinChannel(EChatType InChatType, const FString& InStringKey);
UNetworkChannelBase* FindChannel(const FNetworkChannelKey& ChannelKey) const;
```

`FNetworkChannelKey`(바이트 배열)를 키로 삼아 `JoinedChannels` 배열에서 인스턴스를 조회합니다. 같은 채널 타입이라도 길드 ID 등 문자열 키가 다르면 별도 인스턴스로 관리됩니다.

### Sequence Index — 메시지 순서 보장

서버가 각 메시지에 단조 증가 인덱스(`index`)를 부여합니다. 클라이언트는 수신 즉시 `FindInsertOrder`로 삽입 위치를 계산해 정렬된 상태를 유지합니다.

```cpp
// ChatMessage.cpp
bool FChatMessage::IsAfter(const FChatMessage& A, const FChatMessage& B)
{
    if (A.UtcTime != B.UtcTime) return A.UtcTime > B.UtcTime;
    return A.Index > B.Index;   // 동일 timestamp면 Index로 순서 결정
}

int32 FChatMessage::FindInsertOrder(
    const TArray<FChatMessage>& InMessages, const FChatMessage& NewMessage)
{
    int32 Order = InMessages.Num();
    while (Order > 0 && IsAfter(InMessages[Order - 1], NewMessage))
        --Order;
    return Order;
}

// NetworkChannelBase.cpp — 수신 파이프라인
void UNetworkChannelBase::ReceiveChatContent(
    const sol::channel::ChatEvt& InChatEvt, bool ShouldMaintain)
{
    FChatMessage ChatMessage = FChatMessage::ProtoCast(InChatEvt.content());
    // ...차단·필터 처리...
    ChatMessages.Insert(ChatMessage,
        FChatMessage::FindInsertOrder(ChatMessages, ChatMessage));
    TrimToRuntimeLimit();
    UChatManager::Get(this).AddChatMessage(ChatMessage);
}
```

### 채팅 HyperLink — RichTextBlock CustomDecorator

아이템 링크 등 하이퍼링크는 `URichTextBlockDecorator` 를 확장한 `UItemHyperLinkRichTextBlockDecorator`로 구현했습니다. 마크업 속성(rid · ench · grade 등)을 파싱해 인게임 아이템 탐색 UI를 열어줍니다.

```cpp
// ItemHyperLinkRichTextBlockDecorator.h
// 지원 마크업: <a id="item" rid="123" ench="3" grade="G1">+3 아이템이름</>
class FItemHyperLinkDecorator : public FRichTextDecorator
{
public:
    virtual bool Supports(
        const FTextRunParseResults& RunParseResult,
        const FString& Text) const override;
protected:
    virtual TSharedPtr<SWidget> CreateDecoratorWidget(
        const FTextRunInfo& RunInfo,
        const FTextBlockStyle& TextStyle) const override;
};
```

<figure style="text-align:center"><img src="/images/projects/sol-content/chat-hyperlink.png" alt="채팅 아이템 하이퍼링크" /><figcaption style="font-size:11px;color:#888;margin-top:6px">채팅 내 아이템 하이퍼링크 클릭 시 상세 정보 표시</figcaption></figure>

---

## 경험치 획득 연출 — 시간 보정

<figure style="text-align:center"><img src="/images/projects/sol-content/exp-obtain-effect.gif" alt="경험치 획득 연출" /><figcaption style="font-size:11px;color:#888;margin-top:6px">경험치 획득 시 파티클이 플레이어 방향으로 가속 추격하는 연출</figcaption></figure>

### 문제

경험치 획득 파티클이 NPC 피격 위치에서 플레이어를 향해 날아가는 연출 중, **네트워크 지연으로 Delta Time이 비정상적으로 커지면** 파티클이 충돌 판정 범위를 한 프레임에 뛰어넘어 무한히 회전하는 문제가 발생했습니다.

### 해결 — MaxDeltaTime 루프 분할

`AObtainEffectObject::Tick`에서 프레임 Delta를 `MaxDeltaTime`(= 0.03 s) 단위로 분할해 처리합니다. 어떤 프레임에서도 한 번의 물리 스텝이 최대 30 ms를 넘지 않으므로 판정 범위를 건너뛰는 현상이 사라집니다.

```cpp
// ObtainEffectObject.cpp
void AObtainEffectObject::Tick(float DeltaSeconds)
{
    Super::Tick(DeltaSeconds);
    // 네트워크 지연 등으로 DeltaSeconds가 MaxDeltaTime을 초과하면
    // MaxDeltaTime 단위로 쪼개어 각 스텝마다 충돌 판정을 수행
    while (DeltaSeconds > 0)
    {
        UpdateEffect(DeltaSeconds);
        DeltaSeconds -= MaxDeltaTime;
    }
}
```

```cpp
// ObtainEffectObject.h
float MaxDeltaTime = 0.03f;  // 스텝당 최대 Delta
```

### 연출 흐름

1. **피격자 위치** 에서 `StartDirection`(피격자 → 공격자 방향의 반대) 으로 파티클 발사
2. 초기에는 랜덤 벡터(`RandomVelocity`)를 더해 자연스럽게 퍼져 나감
3. 가속도(`Acceleration`)를 매 스텝 누적해 **공격자(획득자) 방향으로 점점 빠르게 추격**
4. 타겟까지 거리 < `ObtainRange`(30 cm) 이하가 되면 획득 판정 후 종료 이펙트 재생

```cpp
// ObtainEffectObject.cpp — 매 스텝 위치 갱신
void FSingleEffect::UpdateSingle(float DeltaTime)
{
    FVector DirectionToTarget =
        (TargetLocation - NiagaraComponent->GetComponentLocation()).GetSafeNormal();

    // 가속도 누적 — MaxAcceleration 초과 방지
    Accel = FMath::Min(Accel + Data.Acceleration * DeltaTime, Data.MaxAcceleration);
    float DesiredSpeed  = Data.InitSpeed + Accel;
    float RandomSpeed   = Accel >= Data.MaxAcceleration ? 0 :
                          FMath::Max(0, RandomVelocity.Size() - Accel);

    FVector DesiredVelocity =
        DesiredSpeed * DirectionToTarget +
        RandomVelocity.GetSafeNormal() * RandomSpeed;

    FVector NewLocation =
        NiagaraComponent->GetComponentLocation() + DesiredVelocity * DeltaTime;
    NiagaraComponent->SetWorldLocation(NewLocation, true);
}
```

피격자와 공격자(획득자)의 거리에 반비례하는 `CurveDistanceInterpolator`를 곱해 **거리가 멀수록 초기 확산 반경을 크게** 설정하므로, 먼 거리에서도 연출이 자연스럽습니다.

```cpp
// ObtainEffectObject.cpp — 거리 기반 곡선 보정
float X = 1 - FMath::Clamp(
    (Distance - Data.DistanceInterpolation.X) /
    (Data.DistanceInterpolation.Y - Data.DistanceInterpolation.X), 0.f, 1.f);
float CurveDistanceInterpolator =
    FMath::Clamp(X * Data.DistanceInterpolation.Z, 1.f, Data.DistanceInterpolation.Z);
SingleEffect.RandomVelocity = TargetDirection * Data.CurveForce * CurveDistanceInterpolator;
```

---

## 기술 요약

| 영역 | 내용 |
|------|------|
| 언어 / 엔진 | C++ · Unreal Engine 5 (커스텀 브랜치) |
| 매니저 | `USolGameInstanceSubsystem` 기반 Manager (예: `UGuildManager`) — `Get()` 싱글톤, 서버 푸시 수신(`INetworkNotiClientListener`) |
| 서버 동기화 | `USolGeoSubsystem` (TCP · WebSocket Noti) · Protobuf 직렬화 |
| UI | CommonUI(`UCommonActivatableWidget`) · `UPrimaryGameLayout` 레이어 스택 |
| 데이터 | `MetaDataSubsystem` 메타데이터 테이블 · `RidType` 키 |
