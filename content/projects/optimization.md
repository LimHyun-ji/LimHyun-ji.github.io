---
layout: project
order: 2
title: "퍼포먼스 / 메모리 최적화 (핵심 담당)"
role: "Client Developer · 핵심 담당"
period: "상시"
summary: "'보이지 않는 것은 그리지 않는다'를 원칙으로, 모바일 타겟의 UI 렌더링·틱·메모리(GC/풀링/수명)를 다층적으로 최적화."
tags: ["Optimization", "Memory", "Mobile", "Slate", "Object Pooling"]
highlights:
  - "Slate Global Invalidation을 화면/레이어 단위로 동적 토글하고, 동적 콘텐츠는 ForceVolatile로 캐시에서 제외해 UI 재계산 비용 절감"
  - "위젯/액터 오브젝트 풀링(용량 상한 FIFO) + 큰 UI 전환 직후 명시적 GC(UObject Exceed 방지)로 CPU·메모리 비용 절감"
  - "데미지 표시를 BP 애니메이션 의존에서 순수 C++ 이벤트 릴레이 + 컨테이너 풀링으로 재설계"
---

> **목적** — 모바일 타겟의 프레임·메모리 비용 상시 절감
>
> **성과** — UI 재계산 비용↓, 풀링으로 CPU 비용↓, freed-tick 크래시 구조적 차단
>
> **기여** — Global Invalidation 동적 토글, 액터 풀링(freed-tick 차단)·명시적 GC, 데미지 표시 BP→C++ 재설계

<img class="diagram" src="/images/diagrams/optimization-map.svg" alt="최적화 기법 맵: UI 렌더링(Global Invalidation·ForceVolatile), Tick 제어(Significance·상태별), 메모리(오브젝트 풀링 freed-tick 방지·명시적 GC)" />

## 1. UI 렌더링 최적화 (Slate Invalidation)

- CommonUI/Slate 최대 비용: **매 프레임 위젯 재계산**
- 무거운 화면·가벼운 HUD 구분 → **Global Invalidation 레이어 단위 동적 토글**

```cpp
// GeoFullScreenUILayerWidget.cpp:154-157 — 활성 레이어에 따라 동적 토글
IsGlobalInvalidationEnabled = SolActivatableWidget->UseGlobalInvalidation();
...
FSlateApplication::Get().ToggleGlobalInvalidation(IsGlobalInvalidationEnabled);
```
```cpp
// SolActivatableWidget.h:102 — 화면별로 사용 여부를 데이터로 선택
UPROPERTY(EditDefaultsOnly, Category=Screen)
bool bUseGlobalInvalidation = false;
```

- 무조건 활성화 시 동적 콘텐츠(스크롤 리스트) 캐싱 오류 → 스크롤 박스 `ForceVolatile` 처리

```cpp
// SolScrollBox.cpp:30
.ForceVolatile(true)  // 동적 콘텐츠 캐싱 이슈 방지를 위해 항상 volatile
```

- 게임 진입/종료 시 전역 토글 → 로딩 중 UI 재계산 절감 (`GeoGameMode.cpp:177`/`:218`)

## 2. Tick / 렌더 패스 비용 절감

- **Significance** 기반으로 카메라 거리에 따른 NPC 틱 빈도 자동 조절

```cpp
// SIGMonsterBucketComponent.cpp:3-12
float USIGMonsterBucketComponent::CalculateSignificance(
    USignificanceManager::FManagedObjectInfo* ObjectInfo, const FTransform& Viewpoint) const
{
    AActor* Owner = GetOwner();
    if (Owner == nullptr) return 0.f;
    return 10 + (Owner->GetActorLocation() - Viewpoint.GetLocation()).SizeSquared();
}
```

- 상태 기반 Tick 비활성화 적용 대상:
  - 조작 불가/원격 상태 플레이어 (`GeoGameMode.cpp:276-277`)
  - 파라미터 없을 때 머티리얼 매니저 (`MaterialManagerComponent.cpp:1047-1050`)
  - 룰렛 시퀀스 대기 중 (`CineConstellationRoulette.cpp:203`)
- FX 그림자 제거: `SetCastShadow(false)` (`ActionNotify_PlayParticleEffect.cpp:315`)
- 단일 그림자 메시 메인/뎁스 패스 비활성화 (`SolSingleShadowComponent.cpp:336-340`)

## 3. 데미지 표시: BP → C++ 이벤트 릴레이

- 기존 BP 애니메이션 기반 데미지 표시 → **순수 C++ 이벤트 릴레이 + 컨테이너 풀링**으로 재설계
- BP 의존·Tweener 제거

```cpp
// DamageFloatSubsystem.h:26-44 — 월드가 위젯에 요청만 브로드캐스트
DECLARE_MULTICAST_DELEGATE_OneParam(FOnDamageFloatRequested, const FDamageFloatRequest&);
FOnDamageFloatRequested OnDamageFloatRequested;
```
```cpp
// DamageFloatWidget.cpp:99-128 — 컨테이너 풀에서 빌려오고, 애니 종료 콜백에서 반납
auto Container = ContainerPool.GetOrCreateInstance<UOverheadTargetDamageContainerWidget>(DamageContainerWidgetClass);
TWeakObjectPtr<UOverheadTargetDamageContainerWidget> WeakContainer = Container;
Container->SetOnAnimationFinishedCallback([this, WeakContainer]() {
    if (WeakContainer.IsValid()) ReleaseContainer(WeakContainer.Get());
});
```

- 투영 불가(카메라 뒤) 데미지 → 화면 밖 전송으로 렌더 스킵 (`DamageFloatWidget.cpp:85-86`)

---

## 4. 메모리 관리 — 가장 신경 쓴 영역

- 모바일 메모리 예산·GC 스파이크 절감을 위한 두 축: **(1) 명시적 GC, (2) 액터 풀링**

### 4-1. 명시적 GC — 큰 UI 전환 직후

- 무거운 탭 닫기 직후 즉시 GC → 메모리 스파이크 누적 방지

```cpp
// SpiritScreen.cpp:205 — 탭 전환(닫기) 직후 강제 GC
if (GEngine) GEngine->ForceGarbageCollection(true);
```

- 비동기 로드 텍스처: 핸들 해제 + `RF_Standalone` 제거 → GC 대상 명시

```cpp
// BeginnerTipPopupWidget.cpp:118-125
UObject* PrevTexture = BeginnerTipImageHandle->GetLoadedAsset();
BeginnerTipImageHandle->ReleaseHandle();
BeginnerTipImageHandle.Reset();
if (PrevTexture) PrevTexture->ClearFlags(RF_Standalone);
GEngine->ForceGarbageCollection(false);
```

### 4-2. 액터 풀링 — 풀링이 만드는 크래시까지 차단

- 액터만 숨기고 컴포넌트 틱 미정지 시 → Niagara `bAutoDestroy`로 컴포넌트 자기파괴 → freed 메모리 틱 접근 → 크래시
- 풀 입출고 시 **모든 컴포넌트 틱까지 함께 토글**로 해결

```cpp
// ObjectPoolSubsystem.cpp:313-332 — SetPoolActorHidden
Actor->SetActorHiddenInGame(bHidden);
Actor->SetActorEnableCollision(!bHidden);
Actor->SetActorTickEnabled(!bHidden);
TInlineComponentArray<UActorComponent*> Components;
Actor->GetComponents(Components);
for (UActorComponent* Comp : Components)               // 컴포넌트 틱까지 정지 → freed 접근 방지
    if (IsValid(Comp) && Comp->PrimaryComponentTick.bCanEverTick)
        Comp->SetComponentTickEnabled(!bHidden);
```

- Push 시 틱을 먼저 끈 뒤 정리 콜백 호출 (병렬 틱 태스크그래프 경쟁 방지)
- Pull 시 최근 사용 액터 우선 반환 (캐시 적중↑)
- 주기적 `ShrinkPool()`: 최근 피크 + 20% 버퍼 유지, 초과분 파괴 (`ObjectPoolSubsystem.cpp:120-170, 334-368`)

---

- 풀링·비동기 로드 맞물린 freed-tick 크래시 등 라이브 크래시 추적·차단 → [라이브 안정화 & 아웃게임 페이지](/projects/live-stability/) 참조
