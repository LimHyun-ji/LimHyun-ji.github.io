---
layout: project
order: 4
title: "인게임 연출 & 비동기 에셋 로딩"
role: "Client Developer"
period: "2023 — 현재 (연출·렌더링 영역)"
summary: "PocketLevel Instance로 인게임과 분리된 연출 공간을 구성하고, LevelSequence·SceneCapture·RenderTarget을 연출 구간에만 살려 모바일 비용을 낮춘 인게임 연출 파이프라인을 설계."
tags: ["PocketLevel", "LevelSequence", "SceneCapture", "RenderTarget", "Niagara", "Mobile"]
highlights:
  - "별자리·순례 등 연출을 PocketLevel Instance로 인게임과 별도 공간에 구성하고 LevelSequence로 재생하는 비동기 연출 공간 제공"
  - "LevelSequence가 내려갈 때 안의 Actor도 모두 메모리에서 내려가도록 동적 제어 — 연출 액터를 진입 시 생성·종료 시 파괴하고 시퀀스는 SoftObjectPtr로 비동기 로드"
  - "3D 오브젝트를 SceneCapture2D로 RenderTarget에 캡처해 UI에 합성, 연출 구간에만 캡처를 Visible 토글해 모바일 GPU 비용 절감"
  - "갓아머 연출: TransformBonesComponent로 런타임 본 트랜스폼을 AnimBP와 연동하고 Niagara 잔상을 Deactivate로 정리"
---

> **목적** — 인게임과 분리된 연출 공간을 비동기로 띄우고 연출 구간에만 자원을 쓰는 파이프라인
> **성과** — PocketLevel·시퀀스·캡처 수명을 연출 구간에 한정해 모바일 GPU/메모리 비용↓
> **기여** — 별자리 룰렛 LevelSequence 동적 생성/파괴, 순례 주사위 SceneCapture, 갓아머 연출 직접 설계

## 0. PocketLevel — 인게임과 분리된 연출 공간

별자리·순례 같은 큰 연출은 인게임 월드 안에서 바로 돌리지 않고, **PocketLevel Instance로 인게임과 분리된 별도 공간에 레벨을 구성**해 그 안에서 `LevelSequence`로 재생합니다. 인게임 상태와 섞이지 않는 독립 연출 공간을 비동기로 띄우는 방식입니다.

핵심은 **수명 동적 제어**입니다. `LevelSequence`가 내려갈 때 그 안의 Actor들도 모두 메모리에서 함께 내려가도록 만들어, 연출이 끝나면 연출용 자원이 남지 않습니다. 아래 별자리·순례가 이 원칙 위에서 동작합니다.

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

> 룰렛 결과가 서버-클라에서 **간헐적으로 다르게 표시**되던 레이스 컨디션(WebSocket Notify 도착 시점 × 연출 상태 전이 순서 의존성)의 추적·해결 과정은 [라이브 안정화 & 아웃게임 페이지](/projects/live-stability/)에서 자세히 다룹니다.

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

> 미니맵·월드맵의 실시간 위치 기반 표시(MPC·RenderTarget·InputProcessor)는 별도 [실시간 위치 기반 맵 페이지](/projects/map-system/)에서 다룹니다.

## 3. 갓아머 연출 — 런타임 본 트랜스폼 ↔ AnimBP

갓아머/PC 연출은 런타임에 본 트랜스폼을 계산해 AnimBP와 연동하는 `TransformBonesComponent`를 신규 설계했습니다(에디터 프리뷰용 `EditorTransformBonesComponent`까지 분리). 연출 시퀀스의 Niagara 잔상은 풀 반납(`ReleaseToPool`)으로는 남는 문제가 있어 **`Deactivate`로 교체**해 정리했습니다.

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
