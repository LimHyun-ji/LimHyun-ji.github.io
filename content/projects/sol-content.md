---
layout: project
order: 3
title: "인게임 컨텐츠 — 길드 · 수집 · 순례 · 경제 · 채팅 · 시간보정"
role: "Client Developer · Schema 설계·컨텐츠 구현 담당"
period: "2023 — 현재"
summary: "길드·수집·순례·경제·채팅 등 컨텐츠를 기획~UI~서버 동기화까지 담당. TCP · WebSocket · HTTP API 네트워크 구조 위에서 컨텐츠별 통신 구현."
tags: ["Gameplay", "Content", "Guild", "Economy", "Chat", "DeltaTime", "CommonUI", "Protobuf", "TCP", "WebSocket", "HTTP API"]
imageLayout: slider
images:
  - src: "/images/projects/sol-content/Screenshot_26.png"
  - src: "/images/projects/sol-content/Screenshot_27.png"
  - src: "/images/projects/sol-content/Screenshot_28.png"
---

## 문제 해결 요약

<div class="cases">
  <div class="case">
    <p class="case-title">순례 정산 로직과 연출의 결합</p>
    <dl>
      <dt>문제</dt><dd>연출과 정산 로직이 한곳에 얽히면 연출을 고칠 때마다 정산 로직까지 영향</dd>
      <dt>해결</dt><dd>로직(<code>TravelManager</code>)과 연출 공간(<code>CinePilgrimageManager</code>)을 분리</dd>
      <dt>결과</dt><dd>연출을 수정해도 정산 로직은 영향 없음</dd>
    </dl>
    <a class="case-more" href="#case-travel">자세히 ↓</a>
  </div>
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

<div id="case-travel" class="case-anchor"></div>

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

---

## 채팅 채널 시스템

채팅은 게임 서버(TCP)와 별도인 **채널 서버(WebSocket)** 를 사용합니다. 클라이언트에서는 `UNetworkChannelSystem` 이 단일 WebSocket 연결을 유지하고, 채널 타입별 클래스(`UNetworkChannel_Geo` · `UNetworkChannel_Guild` · `UNetworkChannel_World` · `UNetworkChannel_Direct`)가 채널 고유 동작을 캡슐화합니다.

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

## 경험치 획득 연출 — 궤적 · 시간 보정

<figure style="text-align:center"><img src="/images/projects/sol-content/exp-obtain-effect.gif" alt="경험치 획득 연출" /><figcaption style="font-size:11px;color:#888;margin-top:6px">경험치 획득 시 파티클이 플레이어 방향으로 가속 추격하는 연출</figcaption></figure>

### 문제

경험치 획득 파티클이 NPC 피격 위치에서 플레이어를 향해 날아가는 연출 중, **프레임 드랍(히칭)으로 Delta Time이 비정상적으로 커지면** 파티클이 충돌 판정 범위를 한 프레임에 뛰어넘어 무한히 회전하는 문제가 발생했습니다.

### 해결 — MaxDeltaTime 루프 분할

`AObtainEffectObject::Tick`에서 프레임 Delta를 `MaxDeltaTime`(= 0.03 s) 단위로 분할해 처리합니다. 어떤 프레임에서도 한 번의 물리 스텝이 최대 30 ms를 넘지 않으므로 판정 범위를 건너뛰는 현상이 사라집니다.

```cpp
// ObtainEffectObject.cpp
void AObtainEffectObject::Tick(float DeltaSeconds)
{
    Super::Tick(DeltaSeconds);
    // 프레임 드랍 등으로 DeltaSeconds가 MaxDeltaTime을 초과하면
    // MaxDeltaTime 단위로 쪼개어 각 스텝마다 충돌 판정을 수행
    while (DeltaSeconds > 0)
    {
        UpdateEffect(FMath::Min(DeltaSeconds, MaxDeltaTime));  // 스텝마다 최대 MaxDeltaTime만 진행
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

### 궤적 설계 — 로컬 기저에서 확산 방향 생성

파티클이 일직선으로 날아오지 않고 **발사 방향을 축으로 사방에 퍼졌다가 휘어 들어오도록**, 초기 랜덤 속도(`RandomVelocity`)의 방향을 발사 방향 기준 로컬 좌표계에서 만듭니다.

1. 발사 방향(`StartDirection`)을 회전으로 바꾸고, 그 회전으로 Right · Up 축을 돌려 **발사 방향에 수직인 기저**를 구성
2. 두 축에 랜덤 가중치를 곱해 합성 → 발사 방향과 수직인 평면 위의 무작위 방향
3. 매 스텝 속도 = 목표 방향 속도 + 랜덤 속도. 가속이 누적될수록 랜덤 성분이 줄어들어 **처음엔 퍼지고, 점점 목표로 수렴**하는 곡선 궤적

피격자와 공격자(획득자)의 거리에 반비례하는 `CurveDistanceInterpolator`를 곱해 **거리가 멀수록 초기 확산 반경을 크게** 설정하므로, 먼 거리에서도 연출이 자연스럽습니다.

```cpp
// ObtainEffectObject.cpp — 발사 방향 기준 로컬 기저 + 거리 기반 곡선 보정
const FRotator Rotation = Data.StartDirection.Rotation();
const FVector RightVector = Rotation.RotateVector(FVector::RightVector);
const FVector UpVector    = Rotation.RotateVector(FVector::UpVector);

float X = 1 - FMath::Clamp(
    (Distance - Data.DistanceInterpolation.X) /
    (Data.DistanceInterpolation.Y - Data.DistanceInterpolation.X), 0.f, 1.f);
float CurveDistanceInterpolator =
    FMath::Clamp(X * Data.DistanceInterpolation.Z, 1.f, Data.DistanceInterpolation.Z);

const float RandY = FMath::RandRange(Data.MinRandomRange.Y, Data.MaxRandomRange.Y);
const float RandZ = FMath::RandRange(Data.MinRandomRange.Z, Data.MaxRandomRange.Z);
const FVector TargetDirection = (RightVector * RandY + UpVector * RandZ).GetSafeNormal();

SingleEffect.RandomVelocity = TargetDirection * Data.CurveForce * CurveDistanceInterpolator;
```

- 확산 범위(`MinRandomRange` / `MaxRandomRange`)는 재화 타입별로 데이터에서 조정
