---
layout: project
order: 2
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

> MMORPG 클라이언트 작업 중 가장 차별화되는 영역입니다. 흔한 위젯 UI를 넘어 **3D 오브젝트를 GPU로 캡처해 UI에 합성하고, 연출 시퀀스를 런타임에 생성·바인딩·파괴**하는 파이프라인을 직접 설계했습니다. 모바일이 주 타겟이라 **연출 품질과 GPU/메모리 비용의 균형**을 항상 함께 고민했습니다.

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

> 연출과 함께 **WebSocket Notify 타이밍 레이스로 인한 룰렛 서버-클라 결과 불일치**(CL 30065)도 직접 분석·수정했습니다. (자세한 디버깅은 '퍼포먼스 최적화 & 메모리 관리' 페이지의 비동기/레이스 디버깅 항목 참고)

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

퀘스트·심볼 데이터를 **RenderTarget 텍스처로 변환**해 미니맵 머티리얼 파라미터로 넘기고, NPC 아이콘은 ObjectPool로 재사용했습니다. 비동기 로딩으로 인한 깜빡임은 원본 Mip0 사용 + NaN 방어로 해소했습니다. 파티원·스쿼드 표시는 Entity 기반으로 전환했습니다(SB-6754).

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
