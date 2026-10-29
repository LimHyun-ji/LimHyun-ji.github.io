---
layout: project
order: 1
title: "외형 시스템 — VisualData"
role: "Client Developer · 핵심 담당"
period: "2023 — 현재"
summary: "모든 Entity에 외형(파츠 · Attachment · Material)을 세팅 · 로드하는 VisualData 인게임 모듈과 데이터 소유 · 수명 구조."
tags: ["VisualData", "Character", "Module", "Attachment", "LOD", "Async Loading"]
highlights:
  - "PC · NPC · Spirit · 필드오브젝트 · 아이템 등 모든 Entity에 부착되는 UVisualDataModuleComponent로, 파츠(Master / Face / Torso / Helmet) · Override Material · Attachment · 본 트랜스폼을 세팅 · 로드"
  - "**데이터 소유 일원화** — 여러 객체가 나눠 갖던 VisualData를 컴포넌트별로 필요한 데이터만 할당하고, 생명주기는 모듈 한 곳에서 관리 (CreateModule Factory)"
  - "**전이 규칙(FullReset / PartialUpdate / NoUpdate)**으로 바뀐 파츠만 부분 갱신, Override Material · Color Tint · LOD로 에셋 재사용성 향상"
  - "무기 / 방어구 / 헬멧 Attachment를 소켓 기반으로 부착 — UObject 대신 TSharedPtr 경량 객체로 UObject 개수 초과 방지"
---

> **목적** — 외형을 각 Entity에 **데이터로** 세팅 · 로드하고, 데이터의 소유와 수명을 한곳에서 관리하는 인게임 시스템
>
> **성과** — 외형 표현 데이터 주도 일관화, 데이터 소유 일원화, 부분 갱신 최적화, UObject 개수 초과 · 풀링 × 비동기 크래시 구조적 차단
>
> **기여** — 인게임 모듈 컴포넌트 · 타입별 모듈 · 전이 규칙 · Attachment 구조 설계


## 문제 해결 요약

<div class="cases">
  <div class="case">
    <p class="case-title">구조 정립을 통한 전역 데이터 참조 문제 해결</p>
    <dl>
      <dt>문제</dt><dd>모든 Entity가 VD 데이터를 각자 산발적으로 들고 있던 구조</dd>
      <dt>해결</dt><dd>Module 시스템에서 각 Entity 타입별 Apply Module을 정의 후 필요한 컴포넌트에 데이터만 할당(필요 시 WeakPtr), 생명주기는 모듈 한 곳에서 관리</dd>
      <dt>결과</dt><dd>불필요한 전체 VD 데이터 참조 제거</dd>
    </dl>
    <a class="case-more" href="#case-allocating">자세히 ↓</a>
  </div>
  <div class="case">
    <p class="case-title">UObject 최대 개수 초과 크래시</p>
    <dl>
      <dt>문제</dt><dd>Attachment를 UObject로 만들어 Entity가 많은 장면에서 UObject 최대 개수 초과(Exceed)</dd>
      <dt>해결</dt><dd>Attachment를 UObject 대신 TSharedPtr 기반 경량 객체로 전환</dd>
      <dt>결과</dt><dd>Attachment가 UObject 개수 · GC 추적 대상에서 빠짐</dd>
    </dl>
    <a class="case-more" href="#case-attachment">자세히 ↓</a>
  </div>
</div>


## 개요

- 외형 하드코딩 배제 → 데이터(VisualGameData)로 모듈을 생성·적용하는 데이터 주도 구조
- 모든 Entity 공통 단일 컴포넌트(`UVisualDataModuleComponent`)가 로드·적용·정리를 담당
- 전투 액션(몽타주 · ActionNotify)은 [전투 시스템 페이지](/projects/combat/), 에디터 저작 툴 · 데이터 export는 [VisualData 에디터 & Commandlet 페이지](/projects/visualdata-editor/)에서 다룹니다

<img class="diagram" src="/images/diagrams/visualdata-flow.svg" alt="VisualData 구성 구조: VisualGameData→UVisualDataModuleComponent(파츠 맵·현재 모듈 보유)→FVisualDataModuleBase 상속(PC·NPC·Spirit·Item·FieldObject·Totem)→FPCModuleAttachment 소켓 부착" />

## 1. 인게임 모듈 컴포넌트 — 각 Entity에 Visual 세팅·로드

<div id="case-allocating" class="case-anchor"></div>

**처음에는 여러 객체가 VisualData를 각자 들고 있어서, 데이터가 언제 만들어지고 사라지는지가 흩어져 있었습니다.** 그래서 각 컴포넌트에는 필요한 데이터만 할당하고(필요하면 WeakPtr로 참조), 데이터의 생명주기는 모듈 한 곳에서 관리하도록 바꿨습니다. 모듈 생성은 `CreateModule` Factory로 통일했습니다.

- PC · NPC · Spirit · 필드오브젝트 · 아이템 등 **모든 Entity 부착 대상**
- 파츠별 스켈레탈 메시를 맵으로 보유, 데이터 변경 시 모듈 재생성 · 재적용

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

## 2. 전이 규칙으로 부분 갱신 최적화

**헬멧 하나만 바꿔도 전신 파츠와 Attachment를 전부 다시 로드하고 있었습니다.** 외형 데이터가 바뀔 때마다 모듈 전체를 다시 적용하는 구조였기 때문입니다. 그래서 다음 데이터와 현재 상태를 비교해 갱신 범위를 정하는 **전이 규칙**을 도입했습니다.

```cpp
// EvaluateTransitionRule → 갱신 범위 결정
enum class EVisualDataModuleTransitionRule { FullReset, PartialUpdate, NoUpdate };
```

- **NoUpdate**: 동일 → 아무것도 안 함
- **PartialUpdate**: 바뀐 파츠만 교체 (예: 헬멧만)
- **FullReset**: 전면 재구성
- 전이 규칙 도입 → 실제 변경 파츠로 재로드 범위 한정, 불필요한 전신 재로드 제거

<div id="case-attachment" class="case-anchor"></div>

## 3. Attachment — 무기 / 방어구 / 헬멧

**Attachment를 UObject로 만들고 있어서, Entity가 많은 장면에서 UObject 최대 개수를 넘어 크래시가 났습니다.** 그래서 Attachment를 `TSharedPtr` 기반 경량 객체로 바꿔 UObject 개수와 GC 추적 대상에서 뺐습니다.


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

## 4. 로딩 · 렌더 최적화

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
| 데이터 소유 | 컴포넌트별 필요 데이터만 할당(WeakPtr) · 모듈 단일 생명주기 · `CreateModule` Factory |
| 갱신 | `EvaluateTransitionRule` → FullReset / PartialUpdate / NoUpdate |
| Attachment | 무기 · 방어구 · 헬멧, 소켓 부착, `TSharedPtr` 경량 객체 |
| 로딩 | `StreamableManager` 비동기 + 로드 완료 기준 EntityVisibility 게이팅 |
| 관련 | [전투 시스템](/projects/combat/) · [VisualData 에디터 & Commandlet](/projects/visualdata-editor/) |
