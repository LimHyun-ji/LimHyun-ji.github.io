---
layout: project
order: 1
title: "외형 · 전투 시스템"
role: "Client Developer · 핵심 담당"
period: "2023 — 현재"
summary: "모든 Entity에 외형을 세팅·로드하는 인게임 모듈 컴포넌트와, 서버 ActionEvt를 몽타주 · ActionNotify로 연결하는 Action Table 관리."
tags: ["VisualData", "Character", "Action/전투", "AnimMontage", "ActionNotify", "ServerSync", "Immediate/Lazy Hit", "StatusEffect"]
highlights:
  - "PC·NPC·Spirit·필드오브젝트·아이템 등 모든 Entity에 부착되는 UVisualDataModuleComponent로, 파츠(Master / Face / Torso / Helmet) · Override Material · Attachment · 본 트랜스폼을 세팅·로드"
  - "**Action Table 관리** — Entity 타입별 동작에 맞는 몽타주를 데이터로 정의하고, 서버에서 받은 ActionEvt에 따라 해당 몽타주를 재생"
  - "**Custom ActionNotify 정의** — 몽타주 재생 중 Notify 시점에 FX 등 전투 연출을 실행하고, Notify를 Notify_Game / Notify_Editor로 나눠 인게임 로직과 에디터 프리뷰를 분리"
  - "**전이 규칙(FullReset / PartialUpdate / NoUpdate)**으로 바뀐 파츠만 부분 갱신, Override Material · Color Tint · LOD로 에셋 재사용성 향상"
  - "무기 / 방어구 / 헬멧 Attachment를 소켓 기반으로 부착 — 무기 애니메이션 · Niagara FX 처리"
---

> **목적** — 외형과 전투 액션을 각 캐릭터에 **데이터로** 세팅·로드하고, 서버 액션 이벤트를 몽타주·Notify로 연결하는 인게임 시스템
>
> **성과** — 외형·전투 표현 데이터 주도 일관화, 인게임/에디터 Notify 분리, 부분 갱신 최적화, 풀링 × 비동기 크래시 구조적 차단
>
> **기여** — 인게임 모듈 컴포넌트 · 타입별 모듈 · Action Table · Custom ActionNotify · Attachment 구조 설계


## 문제 해결 요약

<div class="cases">
  <div class="case">
    <p class="case-title">구조 정립을 통한 전역 데이터 참조 문제 해결</p>
    <dl>
      <dt>문제</dt><dd>모든 Entity가 VD 데이터를 각자 산발적으로 들고 있던 구조</dd>
      <dt>해결</dt><dd>Module 시스템에서 각 Entity 타입별 Apply Module을 정의 후 필요한 컴포넌트에 데이터만 할당</dd>
      <dt>결과</dt><dd>불필요한 전체 VD 데이터 참조 제거</dd>
    </dl>
    <a class="case-more" href="#case-allocating">자세히 ↓</a>
  </div>
  <div class="case">
    <p class="case-title">인게임 · 에디터 Notify 의존 분리</p>
    <dl>
      <dt>문제</dt><dd>전투 Notify를 인게임과 에디터 프리뷰가 함께 쓰면서 인게임 로직이 에디터 코드에 의존할 위험</dd>
      <dt>해결</dt><dd>Custom ActionNotify의 처리를 <code>Notify_Game</code> / <code>Notify_Editor</code>로 분리</dd>
      <dt>결과</dt><dd>인게임은 에디터 코드와 독립, 에디터는 서버 없이 같은 몽타주 · Notify 프리뷰</dd>
    </dl>
    <a class="case-more" href="#case-notify">자세히 ↓</a>
  </div>
</div>


## 개요

- 외형 하드코딩 배제 → 데이터(VisualGameData)로 모듈을 생성·적용하는 데이터 주도 구조
- 모든 Entity 공통 단일 컴포넌트(`UVisualDataModuleComponent`)가 로드·적용·정리를 담당
- 전투 액션은 **Action Table**(타입별 몽타주 정의) → **몽타주 재생** → **Custom ActionNotify** 실행으로 이어짐
- 에디터 저작 툴·데이터 export는 [VisualData 에디터 & Commandlet 페이지](/projects/visualdata-editor/)에서 다룹니다

<img class="diagram" src="/images/diagrams/visualdata-flow.svg" alt="VisualData 구성 구조: VisualGameData→UVisualDataModuleComponent(파츠 맵·현재 모듈 보유)→FVisualDataModuleBase 상속(PC·NPC·Spirit·Item·FieldObject·Totem)→FPCModuleAttachment 소켓 부착" />

## 1. 인게임 모듈 컴포넌트 — 각 Entity에 Visual 세팅·로드

<div id="case-allocating" class="case-anchor"></div>

- PC·NPC·Spirit·필드오브젝트·아이템 등 **모든 Entity 부착 대상**
- 파츠별 스켈레탈 메시를 맵으로 보유, 데이터 변경 시 모듈 재생성·재적용

```cpp
class UVisualDataModuleComponent : public UActorComponent
{
    // 데이터(VisualGameData) → 모듈 생성 → 적용
    void SetVisualGameData(const UVisualGameDataBase* InVisualGameData);
    void SetModule(TSharedPtr<FVisualDataModuleBase> InNewModule);
    virtual TSharedPtr<FVisualDataModuleBase> CreateModule(const UVisualGameDataBase* InVisualGameData);

    // 파츠별 스켈레탈 메시 (Master/Face/Torso/Helmet/Wing/Cape)
    TMap<EVisualDataCharacterPartType, USkeletalMeshComponent*> SkeletalMeshComponents;

    // 비동기 로드 (StreamableManager) + 완료 델리게이트
    TSharedPtr<FStreamableHandle> LoadAssets(const TArray<FSoftObjectPath>& AssetList, FStreamableDelegate&& OnCompleted);
    bool bUseAsyncLoading = true;
    FSimpleMulticastDelegate OnModuleLoaded;
};
```

### 타입별 모듈 + 경량 폴리모피즘

- `UObject` 대신 `TSharedPtr` 경량 모듈 채택 — 대량 Entity 생성·GC 등록·추적 비용 회피
- Entity 종류별 외형 규칙 차이 → `FVisualDataModuleBase` 상속 타입별 분리(PC / NPC / Spirit / Item / FieldObject / Totem)
- `UObject`가 아니라 `Cast<>`를 쓸 수 없으므로 커스텀 RTTI(`ModuleCast<T>`)로 안전 다운캐스트

```cpp
enum class EVisualDataModuleKind : uint8 { Base, Character, PC, NPC, Spirit, Item, FieldObject };

class FVisualDataModuleBase : public TSharedFromThis<FVisualDataModuleBase>
{
    virtual void ApplyModule(EVisualDataModuleTransitionRule TransitionRule) {}
};
template<typename T> FORCEINLINE TSharedPtr<T> ModuleCast(const TSharedPtr<FVisualDataModuleBase>& P);
```

## 2. 전투 액션 — Action Table · Custom ActionNotify

<img class="diagram" src="/images/diagrams/visualdata-action.svg" alt="VisualData 전투 액션 흐름: 서버 ActionEvt 수신 → Entity가 VisualData ActionTable에서 타입별 액션 조회 → 재생할 몽타주 반환 → AnimInstance 몽타주 Play → Notify 시점 도달 시 Custom ActionNotify 실행 → Notify_Game(인게임 처리) / Notify_Editor(에디터 프리뷰)" />

### Action Table 관리

- Entity 타입별로 **어떤 액션에 어떤 몽타주를 재생할지**를 Action Table 데이터로 정의
- 액션이 늘어나도 코드 수정 없이 데이터 추가로 대응 — 외형 데이터(VisualData)와 같은 데이터 주도 원칙

### 서버 ActionEvt → 몽타주 재생 → Notify 실행

1. 서버에서 **ActionEvt** 수신
2. Action Table에서 Entity 타입에 맞는 몽타주 조회
3. 몽타주 **Play**
4. 몽타주 재생 중 Notify 시점에 도달하면 **Custom ActionNotify** 실행 → 전투 연출(FX 등) 처리

<div id="case-notify" class="case-anchor"></div>

### Custom ActionNotify — Notify_Game / Notify_Editor 분리

- 전투 연출에 필요한 Notify를 **Custom ActionNotify**로 정의 (예: 파티클 재생 Notify)
- Notify 처리를 **Notify_Game**(인게임)과 **Notify_Editor**(에디터 프리뷰)로 나눠 구현
  - 인게임 로직이 에디터 전용 코드에 의존하지 않고, 에디터에서는 서버 없이 같은 몽타주·Notify를 미리 볼 수 있음


## 전투 서버 동기화 아키텍처

<img class="diagram" src="/images/diagrams/combat-sync.svg" alt="전투 서버 동기화 시퀀스: CastCmd → SkillCastResultEvt → ActionEvt(NotifyInfoList) → Montage 재생 → Immediate/Lazy Hit 분기 → StatusEffect → AttackEndEvt" />

서버-클라이언트 동기화를 맞추기 위해 Montage 내 Notify 데이터를 JSON으로 Export하고, 런타임에 서버로부터 수신한 `ActionNotify` 실행 시점에 맞춰 클라이언트 Montage를 재생하며 Notify를 발화합니다.

```
[클라이언트] CastCmd 전송
      ↓
[서버]  SkillCastResultEvt — ActionEvt(NotifyInfoList) 반환
      ↓
[클라이언트] ActionQueue에서 Montage 재생
      ├─ Hit_0 (Immediate) : NotifyInfoList[0] 소비 → 즉시 데미지 적용
      ├─ Hit_1 (Lazy)      : LazyHitNotifyEvt 수신 대기 → 서버 확인 후 적용
      ├─ ChangeStatusEffectEvt : 버프 / 디버프 / CC 적용
      └─ AttackEndEvt      : 스킬 처리 완료
```

### Immediate / Lazy Hit 구분

`ConsumeNotifyInfo`에서 `bIsImmediate` 플래그로 분기합니다.
- **Immediate** : `NotifyInfoList` 큐 앞에서 즉시 소비해 데미지를 바로 적용
- **Lazy** : `LazyNotifyHitList`에 서버 확인 패킷이 도착한 뒤 적용. 실행 여부는 `ExecutedLazyHitNotifyIds`로 중복 방지

```cpp
// GameplayAction_Combat.cpp
bool UGameplayAction_Combat::ConsumeNotifyInfo(
    int32 NotifyId, bool bIsImmediate, sol::geo::sync::NotifyInfo& Out)
{
    if (!bIsImmediate)
    {
        ExecutedLazyHitNotifyIds.Add(NotifyId);
        for (const sol::geo::sync::NotifyInfo& NotifyInfo : LazyNotifyHitList)
        {
            if (NotifyInfo.notify_id() == NotifyId)
            {
                Out = NotifyInfo;
                return true;
            }
        }
        return false;
    }

    if (NotifyInfoList.IsEmpty()) return false;
    Out = NotifyInfoList[0];
    NotifyInfoList.RemoveAt(0);
    return true;
}
```

### Montage Notify JSON Export

에디터 전용 `IActionNotifyExportInterface`를 구현한 Notify 클래스가 파라미터를 JSON으로 직렬화합니다. 서버는 이 데이터를 기반으로 `NotifyInfo`를 생성해 클라이언트로 전송하므로 양측 판정 기준이 일치합니다.

```cpp
// ActionNotify_Hit.h (Export 인터페이스 선언 예)
virtual bool IsUseExport() override;
virtual FString GetExportTypeName() override;
virtual bool IsParameter(const FProperty* InProperty) override;

// 프로퍼티에 ExportParameter 메타 지정으로 JSON 항목 선택
UPROPERTY(EditAnywhere, Category="Hit",
    meta=(ExportParameter, ExportParameterName="Damage_Weight"))
int32 DamageWeight;
```

### StatusEffect Notify

`UActionNotify_StatusEffect`가 버프·디버프·CC를 담당하며, Hit Notify와 동일하게 `Status_Effect_Index`를 Export해 서버 판정과 클라 연출을 동기화합니다.

## 3. 전이 규칙으로 부분 갱신 최적화

**헬멧 하나만 바꿔도 전신 파츠와 Attachment를 전부 다시 로드하고 있었습니다.** 외형 데이터가 바뀔 때마다 모듈 전체를 다시 적용하는 구조였기 때문입니다. 그래서 다음 데이터와 현재 상태를 비교해 갱신 범위를 정하는 **전이 규칙**을 도입했습니다.

```cpp
// EvaluateTransitionRule → 갱신 범위 결정
enum class EVisualDataModuleTransitionRule { FullReset, PartialUpdate, NoUpdate };
```

- **NoUpdate**: 동일 → 아무것도 안 함
- **PartialUpdate**: 바뀐 파츠만 교체 (예: 헬멧만)
- **FullReset**: 전면 재구성
- 전이 규칙 도입 → 실제 변경 파츠로 재로드 범위 한정, 불필요한 전신 재로드 제거

## 4. Attachment — 무기 / 방어구 / 헬멧

- PC 모듈: 방어구·헬멧·주/보조 무기를 **소켓 기반 Attachment** 부착
- Attachment 관리: 경량 RTTI(`AttachmentCast<T>`) + 비동기 로드·FX·소켓 전환 처리

```cpp
enum class EPCModuleAttachmentType : uint8 { None, Armor, Helmet, MainWeapon, SubWeapon };

class FPCModuleAttachment_Weapon : public FPCModuleAttachment
{
    virtual void Attach(UVisualDataModuleComponent* InOwnerComponent) override;
private:
    void LoadAsyncAssets();                    // StreamableHandle 비동기 로드
    TSharedPtr<FStreamableHandle> StreamingHandle;
};
```

## 5. 로딩 · 렌더 최적화

- **가시성 게이팅**: VisualData **로드가 끝난 Entity만 표시**(`EntityVisibilityRule_VisualDataCompleted`) — 로딩 중 깜빡임·미완성 노출 방지
- **렌더 비용 제어**: `OptimizeLOD`, LOD에 따라 파츠 통합으로 변경

<div id="case-pooling" class="case-anchor"></div>

### 풀링 × 비동기 로드 크래시

**풀에서 재사용한 Entity에 이전 외형이 남거나, 해제된 메모리에 접근하는 크래시가 드물게 발생했습니다.** 풀 반납 시 VisualData 상태가 정리되지 않았고, 취소되지 않은 `FStreamableHandle` 콜백이 이미 사라진 Entity에 뒤늦게 도달했기 때문입니다. 그래서 `OnUnregister`에서 상태를 명시적으로 정리하고, 풀 입출고 시 틱을 토글하며, 반납 시 `FStreamableHandle`을 즉시 취소해 경합 경로를 막았습니다. 풀링 구조 상세는 [퍼포먼스 최적화 페이지](/projects/optimization/) 참고.

## 기술 요약

| 영역 | 내용 |
|------|------|
| 컴포넌트 | `UVisualDataModuleComponent` (전 Entity 공통) |
| 파츠 | `EVisualDataCharacterPartType` (Master · Face · Torso · Helmet · Wing · Cape) |
| 모듈 | 타입별(`PC / NPC / Spirit / Item / FieldObject / Totem`) + 커스텀 RTTI `ModuleCast<T>` |
| 전투 액션 | Action Table(타입별 몽타주) · 서버 ActionEvt → 몽타주 Play → Custom ActionNotify |
| Notify | Notify_Game(인게임) / Notify_Editor(에디터 프리뷰) 분리 |
| 갱신 | `EvaluateTransitionRule` → FullReset / PartialUpdate / NoUpdate |
| Attachment | 무기 · 방어구 · 헬멧, 소켓 전환, 무기 애니메이션, Niagara FX |
| 로딩 | `StreamableManager` 비동기 + 로드 완료 기준 EntityVisibility 게이팅 |
| 저작 툴 | [VisualData 에디터 & Commandlet 페이지](/projects/visualdata-editor/) |
