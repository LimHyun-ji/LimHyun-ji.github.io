---
layout: project
order: 2
title: "VisualData — 캐릭터 비주얼 데이터 시스템 (인게임 전투)"
role: "Client Developer · 핵심 담당"
period: "2023 — 현재"
summary: "모든 엔티티에 외형·전투 Visual 데이터를 세팅·로드하고, 액션/전투 시스템과 결합하는 캐릭터 비주얼 데이터 시스템의 런타임과 저작 툴을 오너십으로 담당."
tags: ["VisualData", "Character", "SkeletalMesh", "Async Loading", "Action/전투", "Editor Tooling"]
highlights:
  - "PC·NPC·정령·토템·필드오브젝트·아이템 등 모든 엔티티에 부착되는 UVisualDataModuleComponent로, 파츠(Master/Face/Torso/Helmet/Wing/Cape)·Override Material·어태치먼트·본 트랜스폼을 세팅·로드"
  - "VisualGameData(액션/전투 데이터)로부터 타입별 모듈을 생성하고, 전이 규칙(FullReset/PartialUpdate/NoUpdate)으로 필요한 파츠만 부분 갱신"
  - "무기/방어구/헬멧 어태치먼트를 소켓 기반으로 부착 — 무기 애니메이션·Niagara FX·소켓 전환(장착↔납도)까지 처리"
  - "StreamableManager 비동기 로드 + 로드 완료 기준 EntityVisibility 게이팅, LOD·LightingChannel·Niagara Scalability로 렌더 비용 제어"
---

> **목적** — 전투/액션 데이터를 각 캐릭터에 세팅·로드하는 비주얼 데이터 시스템
> **성과** — 외형·전투 표현 데이터 주도 일관화, 풀링×비동기 크래시 구조적 차단, 부분 갱신 최적화
> **기여** — 런타임 컴포넌트·타입별 모듈·어태치먼트·저작 에디터 툴까지 전체 오너십

## 개요

캐릭터의 외형(파츠·재질·무기·이펙트)은 전투/액션 상황에 따라 계속 바뀝니다. 그래서 외형을 하드코딩하지 않고, **액션 데이터(VisualGameData)로부터 "모듈"을 만들어 각 엔티티에 적용**하는 데이터 주도 구조로 설계했습니다. 핵심은 **모든 엔티티에 공통으로 붙는 하나의 컴포넌트**가 이 로드·적용·정리를 책임진다는 점입니다.

## 1. 엔티티 공통 컴포넌트 — 각 캐릭터에 Visual 세팅·로드

`UVisualDataModuleComponent`는 PC·NPC·정령·토템·필드오브젝트·아이템 등 **모든 엔티티에 부착**됩니다. 파츠별 스켈레탈 메시를 맵으로 들고, 데이터가 바뀌면 모듈을 새로 만들어 적용합니다.

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

## 2. 타입별 모듈 + 경량 폴리모피즘

**왜 `UObject`가 아닌 `TSharedPtr` 경량 모듈인가?** PC·NPC·정령·아이템 등 필드에 대량으로 존재하는 엔티티마다 모듈이 생성·교체되는데, 이를 전부 `UObject`로 만들면 객체 생성과 GC 등록·추적 비용이 엔티티 수에 비례해 쌓입니다. 그래서 모듈은 GC 바깥의 경량 객체로 설계했습니다.

엔티티 종류마다 외형 규칙이 달라, `FVisualDataModuleBase`를 상속한 **타입별 모듈**(PC/NPC/Spirit/Item/FieldObject/Totem + Editor용)로 분리했습니다. 모듈은 `UObject`가 아닌 **`TSharedPtr` 기반 경량 객체**라, 커스텀 RTTI(`ModuleCast<T>`)로 안전하게 다운캐스트합니다.

```cpp
// System/VisualDataCharacter/Module/VisualDataModuleBase.h
enum class EVisualDataModuleKind : uint8 { Base, Character, PC, NPC, Spirit, Item, FieldObject, Totem, /* Editor* */ };

class SOL_API FVisualDataModuleBase : public TSharedFromThis<FVisualDataModuleBase>
{
    virtual void ApplyModule(EVisualDataModuleTransitionRule TransitionRule) {}
    virtual void OnEvent(const FInstancedStruct& Event) {}   // 전투/액션 이벤트 수신
    virtual bool IsKindOf(EVisualDataModuleKind InKind) const { return InKind == StaticKind; }
    // copy/move 삭제 — TStrongObjectPtr 완전형 요구를 피해 forward decl 만으로 헤더 사용 가능하게 설계
};
template<typename T> FORCEINLINE TSharedPtr<T> ModuleCast(const TSharedPtr<FVisualDataModuleBase>& P);
```

> `OnEvent(FInstancedStruct)`로 **전투/액션 이벤트를 받아** 해당 시점의 외형·연출을 갱신합니다 — VisualData가 전투 시스템과 맞물리는 지점입니다.

## 3. 전이 규칙으로 부분 갱신 최적화

**Before** — 초기에는 외형 데이터가 바뀌면 모듈을 통째로 다시 적용했습니다. 헬멧 하나를 바꿔도 전신 파츠·어태치먼트가 전부 재로드되는 구조라, 장비 교체가 잦은 전투·꾸미기 상황에서 불필요한 로드·재구성 비용이 반복됐습니다.

**After** — 그래서 **다음 데이터와 현재 상태를 비교해 갱신 범위를 결정**하는 전이 규칙을 도입했습니다.

```cpp
// EvaluateTransitionRule → 갱신 범위 결정
enum class EVisualDataModuleTransitionRule { FullRest, PartialUpdate, NoUpdate };
```
> `FullRest`는 실제 코드의 오탈자 원문을 그대로 옮긴 것입니다 — 본문 표기는 FullReset으로 통일합니다.

- **NoUpdate**: 동일 → 아무것도 안 함
- **PartialUpdate**: 바뀐 파츠만 교체 (예: 헬멧만)
- **FullReset**: 전면 재구성

이 규칙 도입으로 재로드 범위가 **실제로 바뀐 파츠로 한정**되어, 동일 외형 재적용이나 단일 파츠 교체 시 불필요한 전신 재로드가 사라졌습니다.

## 4. 어태치먼트 — 무기 / 방어구 / 헬멧

PC 모듈은 방어구·헬멧·주/보조 무기를 **소켓 기반 어태치먼트**로 붙입니다. 어태치먼트도 경량 RTTI(`AttachmentCast<T>`)로 관리하며, 비동기 로드·FX·소켓 전환을 처리합니다.

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

## 5. 전투/액션 결합 · 렌더 최적화

- **전투/액션 결합**: 모듈은 액션 데이터(`VisualGameData`, `System/Action/`)로부터 생성되고, `OnEvent`로 전투 이벤트를 받아 외형·연출을 갱신
- **가시성 게이팅**: VisualData **로드가 끝난 엔티티만 표시**(`EntityVisibilityRule_VisualDataCompleted`) — 로딩 중 깜빡임·미완성 노출 방지
- **렌더 비용 제어**: `OptimizeLOD`, `SetLightingChannels`, `bAllowNiagaraScalability`, 단일 그림자 캐시 갱신(`RefreshSingleShadowCaches`)
- **수명 안전**: 모듈/컴포넌트는 `TWeakObjectPtr`·`TSharedPtr`로 관리, `OnUnregister`에서 정리

## 6. 트러블슈팅 — 풀링 × 비동기 로드가 만든 크래시

**증상** — 엔티티를 오브젝트 풀로 재사용하는 환경에서, 풀에서 다시 꺼낸 엔티티가 드물게 **이전 외형이 잔존**하거나, 이미 해제된 메모리에 접근해 크래시가 나는 문제가 있었습니다. 풀 재사용 타이밍과 비동기 로드 완료 타이밍이 겹칠 때만 나타나 재현이 어려웠습니다.

**원인** — 풀 반납 시점에 VisualData 쪽 상태가 완전히 정리되지 않은 것이 원인이었습니다. 이전 모듈이 세팅해 둔 LOD·컴포넌트 상태가 남은 채로 다음 사용자에게 넘어갔고, 반납 전에 걸려 있던 `FStreamableHandle` 비동기 로드가 취소되지 않아 **풀에 들어간(또는 재사용된) 엔티티에 뒤늦게 로드 완료 콜백이 도착**하면서 죽은 상태를 건드렸습니다.

**해결** — 수명 경계마다 정리를 명시적으로 강제해 구조적으로 차단했습니다.

- `OnUnregister`에서 모듈·파츠 컴포넌트·어태치먼트를 **명시적으로 정리** — 암묵적 파괴에 기대지 않음
- 풀 입출고 시 **컴포넌트 틱을 함께 토글**해, 풀에 잠든 동안 컴포넌트가 스스로 상태를 바꾸지 못하게 차단
- 진행 중이던 `FStreamableHandle`을 반납 시점에 **취소**해, 뒤늦은 로드 완료 콜백이 죽은 컨텍스트를 건드리는 경로를 제거

이후 동일 유형(풀 재사용 × 비동기 로드 경합)의 잔존 외형·죽은 메모리 접근이 구조적으로 차단되었습니다. 풀링 자체가 만드는 freed-tick 크래시의 상세는 [퍼포먼스 최적화 페이지의 액터 풀링 항목 참고](/projects/optimization/).

## 기술 요약

| 영역 | 내용 |
|------|------|
| 컴포넌트 | `UVisualDataModuleComponent` (전 엔티티 공통) |
| 파츠 | `EVisualDataCharacterPartType` (Master·Face·Torso·Helmet·Wing·Cape) |
| 모듈 | 타입별(`PC/NPC/Spirit/Item/FieldObject/Totem`) + 커스텀 RTTI `ModuleCast<T>` |
| 갱신 | `EvaluateTransitionRule` → FullReset / PartialUpdate / NoUpdate |
| 어태치먼트 | 무기·방어구·헬멧, 소켓 전환, 무기 애니메이션, Niagara FX |
| 로딩 | `StreamableManager` 비동기 + 로드 완료 기준 EntityVisibility 게이팅 |
| 최적화 | LOD · LightingChannel · Niagara Scalability · SingleShadow 캐시 |
| 저작 툴 | VisualData 에디터(타입별 클래스 분리·AssetMigration) — [에디터 툴 페이지 참고](/projects/editor-tools/) |

## 데이터 흐름

<div class="mermaid">
flowchart LR
  VGD["VisualGameData<br/>(액션·전투 데이터)"] --> COMP["UVisualDataModuleComponent<br/>(전 엔티티 공통)"]
  COMP --> MOD["타입별 모듈<br/>PC · NPC · Spirit · Item …"]
  MOD --> LOAD["비동기 로드<br/>(StreamableManager)"]
  LOAD --> RULE["전이 규칙<br/>Full / Partial / No"]
  RULE --> APPLY["파츠·어태치먼트·FX 적용"]
  APPLY --> VIS["로드 완료 → EntityVisibility 표시"]
  EVT["전투/액션 이벤트"] -. OnEvent .-> MOD
</div>
