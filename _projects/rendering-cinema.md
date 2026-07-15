---
layout: project
order: 3
title: "인게임 연출 & GPU 렌더링 파이프라인"
role: "Client Developer"
period: "2023 — 현재 (연출·렌더링 영역)"
summary: "RenderTarget·SceneCapture·LevelSequence를 직접 제어해 3D 오브젝트를 UI에 합성하고, 룰렛·주사위·연출 시퀀스를 런타임에 생성·파괴하는 인게임 연출 렌더링 파이프라인을 설계."
tags: ["RenderTarget", "SceneCapture", "LevelSequence", "Sequencer", "Niagara", "Mobile"]
highlights:
  - "별자리 룰렛: ALevelSequenceActor를 진입 시 동적 생성·종료 시 파괴하고 SoftObjectPtr로 시퀀스를 비동기 로드 (UCinemaConstellationManager)"
  - "순례 주사위: SceneCapture2D로 3D 주사위를 RenderTarget에 캡처해 UI에 합성, 연출 중에만 캡처를 Visible 토글해 모바일 비용 절감 (ACinePilgrimageManager)"
  - "미니맵 퀘스트 인디케이터: 퀘스트 데이터를 RenderTarget 텍스처로 변환해 Material Parameter로 전달하는 GPU 기반 표시"
  - "갓아머 연출: TransformBonesComponent로 런타임 본 트랜스폼을 AnimBP와 연동하고 Niagara 잔상을 Deactivate로 정리"
---

> **목적** — 3D를 UI에 합성하고 연출 시퀀스를 런타임 생성·파괴하는 렌더링 파이프라인
> **성과** — 연출 구간 한정으로 모바일 GPU/메모리 비용↓, 서버-클라 레이스(CL 30065) 구조적 해결
> **기여** — 별자리 룰렛 LevelSequence 동적 제어, 순례 주사위 SceneCapture, 미니맵·갓아머 직접 설계

## 1. 별자리 룰렛 — LevelSequence 동적 생성/파괴

룰렛 연출은 매번 같은 시퀀스를 쓰는 게 아니라, 선택된 별·결과에 따라 **시퀀스를 런타임에 생성하고 바인딩한 뒤, 끝나면 파괴**하는 구조로 만들었습니다. 미리 모든 시퀀스 액터를 깔아두지 않아 메모리를 아낍니다.

```cpp
// Cinema/Constellation/CinemaConstellationManager.cpp
// 시퀀스 에셋 + 바인딩 맵으로 LevelSequenceActor를 런타임 생성
ALevelSequenceActor* UCinemaConstellationManager::CreateLevelSeqActor(
    UObject* Outer, const TSoftObjectPtr<ULevelSequence>& SequenceAsset, TMap<FName, AActor*> InBindingMap);
void UCinemaConstellationManager::DestroyLevelSeqActors(ALevelSequenceActor*& OutActor); // 연출 종료 시 파괴

// 이미 생성된 시퀀스는 맵에서 재사용, 없으면 생성
TMap<TSoftObjectPtr<ULevelSequence>, ALevelSequenceActor*> LevelSeqActorMap;
```

룰렛 본체(`ACineConstellationRoulette`)는 **활성/닫기/슬롯세팅/스핀** 시퀀스를 `TSoftObjectPtr`로 들고 있다가 필요할 때만 비동기 로드합니다 — 진입 전 모든 연출 에셋을 메모리에 올리지 않습니다.

```cpp
// Cinema/Constellation/CineConstellationRoulette.h
TSoftObjectPtr<ULevelSequence> ActiveRouletteSeq;
TSoftObjectPtr<ULevelSequence> SpinRouletteSeq;
TMap<int32, TSoftObjectPtr<ULevelSequence>> ConstellationFocusSeqMap; // 별별 포커스 연출
ALevelSequenceActor* PlaySequence(TSoftObjectPtr<ULevelSequence> LevelSequence, bool NeedLoop = false);
void DestroyLevelSeqActor(ALevelSequenceActor*& InActor);
```

### 트러블슈팅 — 룰렛 서버-클라 결과 불일치 (CL 30065)

**증상.** 룰렛 결과가 서버와 클라이언트에서 **간헐적으로 다르게 표시**되는 문제가 보고됐습니다. 항상 발생하는 게 아니라 어쩌다 한 번씩 어긋나는 유형이라, 같은 조작을 반복해도 재현이 되지 않아 추적이 어려웠습니다.

**추적.** 룰렛 결과에 관여하는 두 축 — **WebSocket Notify 도착 시점**과 **룰렛 연출 상태 전이 시점** — 에 각각 로그를 심고 타임라인을 대조했습니다. 그 결과 Notify가 연출 상태 전이의 **전/중/후 어느 시점에 도착하느냐에 따라 최종 표시 결과가 갈리는 순서 의존성**을 확인했습니다. "간헐적"으로 보였던 이유가 사실은 두 비동기 이벤트의 도착 순서 차이였던 것입니다.

**원인.** 클라이언트가 결과를 **연출 상태를 기준으로 확정**하고 있었습니다. 서버 Notify는 네트워크 사정에 따라 연출 진행 중 어느 시점에든 도착할 수 있는데, 그 도착 타이밍이 연출 상태와 엮이면서 레이스가 생긴 구조였습니다.

**해결.** 결과 확정을 **서버 Notify 단일 기준으로 일원화**하고, 연출 상태 전이 순서를 고정했습니다. Notify가 언제 도착하든 결과는 항상 같은 기준으로 확정되므로, **순서 의존성 자체가 제거되어 동일 유형의 불일치를 구조적으로 차단**했습니다.

## 2. 순례 주사위 — SceneCapture로 3D를 UI에 합성

순례(보드게임) 주사위는 실제 3D 메시를 굴리고, 그 결과를 **SceneCapture2D로 RenderTarget에 캡처해 UI 위젯에 합성**합니다. 캡처 카메라를 LevelSequence의 named binding에 연결해 연출이 카메라를 직접 제어하도록 했습니다.

```cpp
// Cinema/Pilgrimage/CinePilgrimageManager.cpp
#include "Components/SceneCaptureComponent2D.h"
#include "Engine/SceneCapture2D.h"

// 태그로 배치된 캡처 카메라를 찾아, LevelSequence의 named binding에 주입
UGameplayStatics::GetAllActorsWithTag(World, RenderTargetCamTag, RenderCams);
RenderTargetCam = RenderCams[0];
LevelSeqActor->AddBinding(LevelSeqActor->FindNamedBinding(RenderTargetCamTag), RenderTargetCam);
```

```cpp
// 핵심 비용 최적화 — SceneCapture는 매 프레임 GPU를 먹으므로 "연출 중에만" 켭니다.
if (RenderTargetCam && RenderTargetCam->GetComponentByClass<USceneCaptureComponent2D>())
    RenderTargetCam->GetComponentByClass<USceneCaptureComponent2D>()->SetVisibility(true);  // 연출 시작
...
    RenderTargetCam->GetComponentByClass<USceneCaptureComponent2D>()->SetVisibility(false); // 연출 종료
```

같은 SceneCapture-전용 + 모바일 PostProcess off 패턴은 대화 연출 렌더러(`DialogueRenderer`)에도 적용했습니다(`SetVisibleInSceneCaptureOnly(true)` / 모바일 `WeightedBlendables` 비우기).

## 3. 미니맵 퀘스트 인디케이터 — 데이터 → RenderTarget 텍스처

퀘스트·심볼 데이터를 **RenderTarget 텍스처로 변환**해 미니맵 머티리얼 파라미터로 넘기고, NPC 아이콘은 ObjectPool로 재사용했습니다. 파티원·스쿼드 표시는 Entity 기반으로 전환했습니다(SB-6754).

운영 중 **아이콘 텍스처가 간헐적으로 깜빡이는 증상**이 있었는데, 원인은 비동기 Mip 스트리밍으로 아이콘 텍스처의 **저해상 Mip이 먼저 표시**되다가 고해상 Mip으로 교체되는 과정이 깜빡임으로 보이는 것이었습니다. 미니맵 아이콘처럼 작고 항상 보이는 텍스처는 스트리밍 이득이 없다고 판단해 **원본 Mip0을 직접 사용**하도록 바꾸고, 함께 발견된 좌표 NaN 유입에 방어 코드를 더해 해소했습니다.

## 4. 갓아머 연출 — 런타임 본 트랜스폼 ↔ AnimBP

갓아머/PC 연출은 런타임에 본 트랜스폼을 계산해 AnimBP와 연동하는 `TransformBonesComponent`를 신규 설계했습니다(에디터 프리뷰용 `EditorTransformBonesComponent`까지 분리). 연출 시퀀스의 Niagara 잔상은 풀 반납(`ReleaseToPool`)으로는 남는 문제가 있어 **`Deactivate`로 교체**해 정리했습니다(SL-15180, SL-17092).

```
Source/Sol/Entity/Character/TransformBonesComponent.{h,cpp}      // 런타임
Source/SolEditor/VisualDataEditor/EditorTransformBonesComponent  // 에디터 프리뷰
```

## 기술 요약

| 영역 | 내용 |
|------|------|
| 시퀀서 | `ALevelSequenceActor` 런타임 생성/파괴 · named binding 주입 · `DefaultInstanceData` |
| 캡처 | `USceneCaptureComponent2D` → `RenderTarget` → UI 합성 · 연출 중에만 Visible |
| 로딩 | `TSoftObjectPtr<ULevelSequence>` 비동기 로드 (진입 전 미로드) |
| 스켈레탈 | `TransformBonesComponent` 런타임 본 트랜스폼 ↔ AnimBP |
| FX | Niagara `Deactivate`(잔상 정리) · 모바일 PostProcess off |
| 비용 | 모바일에서 SceneCapture/시퀀스 액터 수명을 연출 구간에 한정 |

## 연출 렌더링 흐름

<div class="mermaid">
flowchart LR
  DATA["연출 트리거<br/>(룰렛 결과 · 주사위 · 퀘스트)"] --> SEQ["LevelSequenceActor<br/>런타임 생성 + binding"]
  SEQ --> CAP["SceneCapture2D<br/>3D → RenderTarget"]
  CAP --> UI["UI 위젯에 합성"]
  SEQ --> DONE["연출 종료"]
  DONE --> FREE["시퀀스 액터 파괴 · 캡처 Visible off"]
</div>
