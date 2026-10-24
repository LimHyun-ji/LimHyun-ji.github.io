---
layout: project
order: 1
title: "VisualData — 캐릭터 비주얼 데이터 시스템 (인게임 전투)"
role: "Client Developer · 핵심 담당"
period: "2023 — 현재"
summary: "모든 Entity에 외형을 세팅·로드하는 인게임 모듈 컴포넌트와, 서버 ActionEvt를 몽타주 · ActionNotify로 연결하는 Action Table 관리."
tags: ["VisualData", "Character", "Action/전투", "AnimMontage", "ActionNotify"]
highlights:
  - "PC·NPC·정령·토템·필드오브젝트·아이템 등 모든 Entity에 부착되는 UVisualDataModuleComponent로, 파츠(Master / Face / Torso / Helmet / Wing / Cape) · Override Material · Attachment · 본 트랜스폼을 세팅·로드"
  - "Action Table 관리 — Entity 타입별 동작에 맞는 몽타주를 데이터로 정의하고, 서버에서 받은 ActionEvt에 따라 해당 몽타주를 재생"
  - "Custom ActionNotify 정의 — 몽타주 재생 중 Notify 시점에 FX 등 전투 연출을 실행하고, Notify를 Notify_Game / Notify_Editor로 나눠 인게임 로직과 에디터 프리뷰를 분리"
  - "전이 규칙(FullReset / PartialUpdate / NoUpdate)으로 바뀐 파츠만 부분 갱신, Override Material · Color Tint · LOD로 에셋 재사용성 향상"
  - "무기 / 방어구 / 헬멧 Attachment를 소켓 기반으로 부착 — 무기 애니메이션 · Niagara FX · 소켓 전환(장착 ↔ 납도)까지 처리"
---

> **목적** — 외형과 전투 액션을 각 캐릭터에 **데이터로** 세팅·로드하고, 서버 액션 이벤트를 몽타주·Notify로 연결하는 인게임 시스템
>
> **성과** — 외형·전투 표현 데이터 주도 일관화, 인게임/에디터 Notify 분리, 부분 갱신 최적화, 풀링 × 비동기 크래시 구조적 차단
>
> **기여** — 인게임 모듈 컴포넌트 · 타입별 모듈 · Action Table · Custom ActionNotify · Attachment 직접 개발

## 개요

- 외형 하드코딩 배제 → 데이터(VisualGameData)로 모듈을 생성·적용하는 데이터 주도 구조
- 모든 Entity 공통 단일 컴포넌트(`UVisualDataModuleComponent`)가 로드·적용·정리를 담당
- 전투 액션은 **Action Table**(타입별 몽타주 정의) → **몽타주 재생** → **Custom ActionNotify** 실행으로 이어짐
- 에디터 저작 툴·데이터 export는 [VisualData 에디터 & Commandlet 페이지](/projects/visualdata-editor/)에서 다룹니다

<img class="diagram" src="/images/diagrams/visualdata-flow.svg" alt="VisualData 구성 구조: VisualGameData→UVisualDataModuleComponent(파츠 맵·현재 모듈 보유)→FVisualDataModuleBase 상속(PC·NPC·Spirit·Item·FieldObject·Totem)→FPCModuleAttachment 소켓 부착" />

## 1. 인게임 모듈 컴포넌트 — 각 Entity에 Visual 세팅·로드

- PC·NPC·정령·토템·필드오브젝트·아이템 등 **모든 Entity 부착 대상**
- 파츠별 스켈레탈 메시를 맵으로 보유, 데이터 변경 시 모듈 재생성·재적용

```cpp
// System/VisualDataCharacter/VisualDataModuleComponent.h
class SOL_API UVisualDataModuleComponent : public UActorComponent
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
// System/VisualDataCharacter/Module/VisualDataModuleBase.h
enum class EVisualDataModuleKind : uint8 { Base, Character, PC, NPC, Spirit, Item, FieldObject, Totem, /* Editor* */ };

class SOL_API FVisualDataModuleBase : public TSharedFromThis<FVisualDataModuleBase>
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

### Custom ActionNotify — Notify_Game / Notify_Editor 분리

- 전투 연출에 필요한 Notify를 **Custom ActionNotify**로 정의 (예: 파티클 재생 Notify)
- Notify 처리를 **Notify_Game**(인게임)과 **Notify_Editor**(에디터 프리뷰)로 나눠 구현
  - 인게임 로직이 에디터 전용 코드에 의존하지 않고, 에디터에서는 서버 없이 같은 몽타주·Notify를 미리 볼 수 있음
- 파티클 Notify의 FX 그림자 끄기 최적화 → [퍼포먼스 최적화 페이지](/projects/optimization/)

## 3. 전이 규칙으로 부분 갱신 최적화

- **Before** — 외형 데이터 변경 시 모듈 전체 재적용 → 헬멧 교체에도 전신 파츠·Attachment 전부 재로드
- **After** — 다음 데이터와 현재 상태 비교로 갱신 범위 결정하는 **전이 규칙** 도입

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
// System/VisualDataCharacter/Module/PCModuleAttachment.h
enum class EPCModuleAttachmentType : uint8 { None, Armor, Helmet, MainWeapon, SubWeapon };

class SOL_API FPCModuleAttachment_Weapon : public FPCModuleAttachment
{
    virtual void Attach(UVisualDataModuleComponent* InOwnerComponent) override;
    void ChangeSocket(bool bInIsHeld);        // 장착 ↔ 납도 소켓 전환
    void PlayAnimation(UAnimSequence*, float PlayRate, bool bLooping); // 무기 애니메이션
    virtual void CreateFx() override;         // Niagara FX
private:
    void LoadAsyncAssets();                    // StreamableHandle 비동기 로드
    TSharedPtr<FStreamableHandle> StreamingHandle;
};
```

## 5. 로딩 · 렌더 최적화

- **가시성 게이팅**: VisualData **로드가 끝난 Entity만 표시**(`EntityVisibilityRule_VisualDataCompleted`) — 로딩 중 깜빡임·미완성 노출 방지
- **렌더 비용 제어**: `OptimizeLOD`, `SetLightingChannels`, `bAllowNiagaraScalability`, 단일 그림자 캐시 갱신(`RefreshSingleShadowCaches`)
- **수명 안전**: 모듈/컴포넌트는 `TWeakObjectPtr` · `TSharedPtr`로 관리, `OnUnregister`에서 정리

## 6. 트러블슈팅 — 풀링 × 비동기 로드가 만든 크래시

> **증상** — 풀 재사용 Entity에 이전 외형 잔존 또는 해제 메모리 접근 크래시 (풀 재사용 × 비동기 완료 경합, 재현 난이도 높음) · **원인** — 풀 반납 시 VisualData 상태 미정리 + 미취소 `FStreamableHandle` 콜백의 소멸 Entity 뒤늦은 도달 · **해결** — `OnUnregister` 명시적 정리 · 풀 입출고 시 틱 토글 · 반납 시 `FStreamableHandle` 즉시 취소 → 경합 경로 구조적 차단

- 풀링 freed-tick 크래시 상세 → [퍼포먼스 최적화 페이지 액터 풀링 항목](/projects/optimization/)

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
