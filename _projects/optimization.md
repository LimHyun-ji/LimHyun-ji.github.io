---
layout: project
order: 4
title: "퍼포먼스 최적화 & 메모리 관리"
role: "Client Developer"
period: "상시"
summary: "모바일 타겟 성능과 라이브 빌드 안정성을 위해 UI 렌더링·틱·메모리(GC/풀링/수명)를 다층적으로 최적화. 라이브 안정화에 상시 비중을 두어 전체 변경의 평균 약 1/3(연도별 30~38%)이 버그·크래시·현상 수정."
tags: ["Optimization", "Memory", "Mobile", "Slate", "Debugging"]
highlights:
  - "Global Invalidation을 UI 레이어 단위로 동적 토글해 Slate 재계산 비용 절감"
  - "Significance 기반 거리별 Tick 제어 + 상태별 Tick 비활성화로 런타임 비용 축소"
  - "위젯/액터 풀링 + 명시적 GC + 약참조 수명관리로 할당·GC 압력·댕글링 동시 해결"
  - "데미지 표시를 BP→C++ 이벤트 릴레이로 재설계하고 컨테이너 풀링 적용"
---

> 이 페이지는 가독성을 위해 대표 코드만 발췌했습니다. 모바일을 주 타겟으로 하는 MMORPG라 **프레임·메모리·안정성**을 상시 과제로 다뤘고, 특히 **UI 렌더링 비용**과 **메모리 수명 관리**를 가장 중요하게 봤습니다.

## 1. UI 렌더링 최적화 (Slate Invalidation)

CommonUI/Slate에서 가장 큰 비용은 **매 프레임 위젯 재계산**입니다. 콘텐츠별로 무거운 화면과 가벼운 HUD를 구분해 **Global Invalidation을 레이어 단위로 동적 토글**했습니다.

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

> **중요 포인트** — 무조건 켜면 동적 콘텐츠(스크롤 리스트)에서 캐싱 오류가 납니다. 그래서 스크롤 박스는 명시적으로 volatile 처리해 캐시에서 제외했습니다.
```cpp
// SolScrollBox.cpp:30
.ForceVolatile(true)  // 동적 콘텐츠 캐싱 이슈 방지를 위해 항상 volatile
```
게임 진입/종료 시에는 전역 토글로 로딩 중 UI 재계산을 줄였습니다 (`GeoGameMode.cpp:177`/`:218`).

## 2. Tick / 렌더 패스 비용 절감

**Significance** 기반으로 카메라 거리에 따라 NPC 틱 빈도를 자동 조절했습니다.
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
상태 기반 Tick 비활성화도 곳곳에 적용 — 조작 불가/원격 상태의 플레이어(`GeoGameMode.cpp:276-277`), 파라미터가 없을 때 머티리얼 매니저(`MaterialManagerComponent.cpp:1047-1050`), 룰렛 시퀀스 대기 중(`CineConstellationRoulette.cpp:203`) 등.

렌더 패스 쪽은 FX 그림자 제거(`ActionNotify_PlayParticleEffect.cpp:315`, `SetCastShadow(false)`)와 단일 그림자 메시의 메인/뎁스 패스 비활성화(`SolSingleShadowComponent.cpp:336-340`)로 동적 섀도우 비용을 줄였습니다. SceneCapture 프리뷰는 모바일에서 PostProcess를 끄고 강제 Mip 스트리밍으로 품질을 유지했습니다.
```cpp
// DialogueRenderer.cpp:107-113 — SceneCapture 전용 + 모바일 PostProcess off
Component->SetVisibleInSceneCaptureOnly(true);
Component->bForceMipStreaming = true;
#if PLATFORM_ANDROID || PLATFORM_IOS
    CaptureComponent->PostProcessSettings.WeightedBlendables.Array.Empty();
#endif
```

## 3. 데미지 표시: BP → C++ 이벤트 릴레이

기존 블루프린트 애니메이션 기반 데미지 표시를 **순수 C++ 이벤트 릴레이 + 컨테이너 풀링**으로 재설계했습니다(BP 의존/Tweener 제거).
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
투영 불가(카메라 뒤) 데미지는 화면 밖으로 보내 렌더 자체를 스킵했습니다(`DamageFloatWidget.cpp:85-86`).

---

## 4. 메모리 관리 — 가장 신경 쓴 영역

모바일 메모리 예산과 GC 스파이크를 줄이기 위해 **(1) 명시적 GC, (2) 위젯/액터 풀링, (3) 약참조 수명관리, (4) 지연 로드** 네 축으로 접근했습니다.

### 4-1. 명시적 GC — 큰 UI 전환 직후
무거운 탭을 닫은 직후 즉시 GC를 돌려 메모리 스파이크가 누적되지 않게 했습니다.
```cpp
// SpiritScreen.cpp:205 — 탭 전환(닫기) 직후 강제 GC
if (GEngine) GEngine->ForceGarbageCollection(true);
```
비동기 로드한 텍스처는 핸들을 해제하고 `RF_Standalone`을 떼어 GC 대상으로 명확히 만든 뒤 정리했습니다.
```cpp
// BeginnerTipPopupWidget.cpp:118-125
UObject* PrevTexture = BeginnerTipImageHandle->GetLoadedAsset();
BeginnerTipImageHandle->ReleaseHandle();
BeginnerTipImageHandle.Reset();
if (PrevTexture) PrevTexture->ClearFlags(RF_Standalone);
GEngine->ForceGarbageCollection(false);
```

### 4-2. 위젯 풀링 — 용량 상한(FIFO)으로 누수 방지
리스트 위젯을 재사용해 alloc을 줄이되, **반납 시 MaxCapacity 초과분을 FIFO로 파괴**하고 Slate 캐시까지 정리해 풀이 무한히 커지는 걸 막았습니다.
```cpp
// SolUserWidgetPool.cpp — Release: 비활성 풀로 반납 + 상한 초과분 제거
InactiveWidgets.Push(Widget);
ActiveWidgets.RemoveAt(ActiveWidgetIdx);
while (InactiveWidgets.Num() > MaxCapacity) {           // 상한 유지
    UUserWidget* Oldest = InactiveWidgets[0];
    InactiveWidgets.RemoveAt(0);
    if (Oldest) CachedSlateByWidgetObject.Remove(Oldest);
}
```
화면은 `NativeDestruct`에서 `ReleaseAll()`, `BeginDestroy`에서 `ResetPool()`로 2단계 정리(`QuestMainListGroupWidget.cpp`).

### 4-3. 액터 풀링 — 풀링이 만드는 크래시까지 차단
> **특히 중요했던 부분.** 액터만 숨기고 컴포넌트 틱을 끄지 않으면, 풀에 있는 동안 Niagara `bAutoDestroy` 등으로 컴포넌트가 자기 파괴되어 **GC 후 freed 메모리에 틱 접근 → 크래시**가 납니다. 그래서 풀 입출고 시 **모든 컴포넌트 틱까지** 함께 토글했습니다.
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
또한 Push 시 **틱을 먼저 끈 뒤** 정리 콜백을 호출해(병렬 틱 태스크그래프 경쟁 방지), Pull은 최근 사용 액터를 우선 반환(캐시 적중↑). 주기적 `ShrinkPool()`로 최근 피크 + 20% 버퍼만 남기고 초과분을 파괴해 메모리를 회수했습니다(`ObjectPoolSubsystem.cpp:120-170, 334-368`).

### 4-4. 약참조 · 수명 안전 — 댕글링/순환참조 차단
람다 캡처는 `TWeakObjectPtr` + `Get()` 검사로, 델리게이트는 `NativeDestruct`에서 명시적으로 해제했습니다.
```cpp
// HUDMainMenuWidget.cpp:24-31 — weak 캡처로 순환참조/댕글링 방지
TWeakObjectPtr<UHUDMainMenuWidget> WeakThis(this);
OpenMenuBehavior->SetFunction([WeakThis]() {
    if (UHUDMainMenuWidget* StrongThis = WeakThis.Get()) StrongThis->OpenMenu();
});
```
서버 타이머 매니저도 같은 원칙 — `CreateWeakLambda`로 콜백을 약하게 묶고, Tick에서 `BoundObject.IsStale()`이면 발화 전에 타이머를 제거합니다(`GeoServerTimerManager.cpp:76-82`). 덕분에 화면이 닫혀도 죽은 객체 접근 없이 안전하게 정리됩니다.

### 4-5. 지연 로드 — 소프트 참조 + StreamableManager
UI 리소스는 `TSoftObjectPtr`로 들고 있다가 필요할 때만 로드하고, 사용이 끝나면 핸들을 해제했습니다.
```cpp
// BeginnerTipPopupWidget.cpp:101-110
NewHandle = UAssetManager::GetStreamableManager().RequestSyncLoad(Path, false);
... // 이전 핸들은 ClearTipBanner()로 ReleaseHandle 후 교체
```

---

## 5. 비동기 / 레이스 컨디션 디버깅 — 재현 어려운 버그 추적

라이브 MMORPG에서 가장 까다로운 건 **재현이 어려운 비동기·플랫폼 한정 크래시**입니다. 증상에서 멈추지 않고 원인을 찾아 **구조적으로 차단**한 사례들입니다.

**① 별자리 룰렛 서버-클라 결과 불일치 (CL 30065)**
- 증상: 룰렛 결과가 서버와 클라이언트에서 간헐적으로 다르게 표시.
- 원인: WebSocket Notify 수신 타이밍과 룰렛 연출 상태 갱신 사이의 **타이밍 레이스**.
- 해결: 결과 확정 시점을 서버 Notify 기준으로 일원화하고 연출 상태 전이 순서를 고정.

**② 액터 풀링 freed-tick 크래시** (위 4-3 항목 참고)
- 증상: 풀에서 꺼낸 액터가 드물게 죽은 메모리 접근으로 크래시.
- 원인: 액터만 숨기고 컴포넌트 틱을 끄지 않아, Niagara `bAutoDestroy`로 자기 파괴된 컴포넌트가 freed 후에도 틱.
- 해결: 풀 입출고 시 **모든 컴포넌트 틱까지 토글**(`ObjectPoolSubsystem.cpp:313-332`).

**③ 모바일 한정 인원 표시 제한 크래시 (SB-8358)**
- 증상: '플레이어 표시 인원 제한' 옵션을 켠 모바일 빌드에서만 크래시.
- 원인: 모바일 빌드 한정 조건에서만 드러나는 경계 처리 누락.
- 해결: 플랫폼 한정 재현 조건을 좁혀 해당 경로를 안전화.

이 밖에 미니맵 깜빡임(NaN 방어), 채팅 RichText, 순례 보상 정산, 장비 중복 착용/미장착 슬롯 등 **다수의 현상·크래시**를 **Jira 티켓 연계(SL-/SB-/SM7-)** 로 회귀까지 추적해 핫픽스했습니다.

## 최적화 흐름 한눈에

<div class="mermaid">
flowchart TD
  COST["프레임 / 메모리 비용 증가"] --> UI["UI: Global Invalidation 동적 토글 · ForceVolatile"]
  COST --> TICK["Tick: Significance 거리별 · 상태별 비활성화"]
  COST --> MEM["메모리: 풀링 · 명시적 GC · 약참조 · 지연로드"]
  UI --> RES["프레임/메모리 비용 절감 · 크래시 감소"]
  TICK --> RES
  MEM --> RES
</div>
