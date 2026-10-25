---
layout: project
order: 8
title: "AreaTool — 레벨 · 스폰 데이터 저작 & 검증 자동화"
role: "Tools / Pipeline"
period: "2023 — 현재 (상시)"
summary: "레벨 영역 · NPC 스폰 · 순찰 데이터를 배치하는 AreaTool의 검증자 체인, P4 연동 export, Commandlet 기반 CI."
tags: ["Editor Tooling", "AreaTool", "Validator", "Commandlet", "CI", "Perforce"]
highlights:
  - "District영역을 레벨 기획자가 직접 지정하는 저작 툴 Mode 제공 2D Polygon"
  - "NPC 확률성 배치 및 Patrol 영역 지정"
  - "RID · 이름 · NavMesh · 폴더 · 리전 검증자 체인(IAreaToolValidator) — 잘못된 데이터의 런타임 유입 차단"
  - "Export 시 P4 reconcile로 변경분만 자동 체크아웃 · 추가"
  - "AreaToolExportCommandlet + Jenkins CI로 레벨 데이터 검증 · export를 빌드 단계에서 강제"
---

> **목적** — 레벨 · 스폰 데이터를 레벨 위에서 직접 배치하고, 검증과 export를 사람 손을 거치지 않게 자동화
>
> **성과** — 잘못된 레벨 데이터의 런타임 유입 차단, 수작업 · 누락 감소
>
> **기여** — 3D Point Actor 저작 UX, 검증자 체인, P4 연동 export, Commandlet CI


## 문제 해결 요약

<div class="cases">
  <div class="case">
    <p class="case-title">잘못된 레벨 데이터 유입</p>
    <dl>
      <dt>문제</dt><dd>잘못된 데이터가 export되어 런타임에서야 발견</dd>
      <dt>해결</dt><dd>검증자 체인 통과 후 export + Commandlet CI로 강제</dd>
      <dt>결과</dt><dd>잘못된 데이터를 export 시점에 차단</dd>
    </dl>
    <a class="case-more" href="#case-validation">자세히 ↓</a>
  </div>
</div>


## 개요

- 레벨 영역 · NPC 스폰 · 순찰(Patrol) 데이터를 배치하는 **레벨 데이터 저작 툴**
- 배치 → 검증 → export → 런타임 메타데이터까지의 흐름을 자동화

<img class="diagram" src="/images/diagrams/pipeline-flow.svg" alt="AreaTool 파이프라인: 원본(Excel·에셋·레벨)→AreaTool Generator→검증자 체인→Export+P4 Reconcile→Generated 메타데이터(RidType)→런타임 MetadataSubsystem, Commandlet(CI)이 실행" />

## 1. 저작 UX — 2D Polygon , 3D Point Actor

**레벨 별로 구역을 직접 설정해 배치할 수 있는 2DPolygon툴을 제공하여 영역을 지정할 수 있는 Mode를 제공**
- **AreaTool Outliner**에서 `rid = 1`처럼 조건으로 배치 액터를 검색 → 넓은 맵에서도 대상 액터를 바로 찾아 수정

<div class="shot-row">
  <figure><img src="/images/projects/areatool/areatool-patrol-spawn.jpg" alt="레벨 위에 배치된 순찰 경로와 스폰 지점" /><figcaption>레벨 위 순찰 경로 · 스폰 지점 배치</figcaption></figure>
  <figure><img src="/images/projects/areatool/areatool-spawn-area.jpg" alt="스폰 영역과 영역 안의 NPC 스폰 지점" /><figcaption>스폰 영역과 영역 안의 NPC 스폰 지점</figcaption></figure>
  <figure><img src="/images/projects/areatool/areatool-outliner.png" alt="AreaTool Outliner에서 rid = 1 조건으로 배치 액터 검색" /><figcaption>AreaTool Outliner — 조건 검색(rid = 1)</figcaption></figure>
</div>

### 에디터 3D 시각화 — CylinderComponent · DrawMesh

스폰 반경 · 순찰 영역을 에디터 뷰포트에서 직접 확인할 수 있도록, **FPrimitiveSceneProxy** 기반 커스텀 실린더 컴포넌트와 **FComponentVisualizer** 를 구현했습니다.

**SceneProxy — 렌더 스레드에서 와이어프레임 실린더를 매 프레임 그리기**

```cpp
// FPrimitiveSceneProxy
void GetDynamicMeshElements(const TArray<const FSceneView*>& Views,
    const FSceneViewFamily& ViewFamily, uint32 VisibilityMap,
    FMeshElementCollector& Collector) const override
{
    for (int32 ViewIndex = 0; ViewIndex < Views.Num(); ViewIndex++)
    {
        if (VisibilityMap & (1 << ViewIndex))
        {
            FPrimitiveDrawInterface* PDI = Collector.GetPDI(ViewIndex);
            const FMatrix& LocalToWorld = GetLocalToWorld();
            const float AngleDelta = 2.0f * UE_PI / NumSides;
            FVector LastVertex = LocalToWorld.GetOrigin()
                               + FVector(1, 0, 0) * CylinderRadius;

            for (int32 Index = 0; Index < NumSides; ++Index)
            {
                const FVector Vertex = LocalToWorld.GetOrigin()
                    + (FVector(1,0,0) * FMath::Cos(AngleDelta * (Index+1))
                     + FVector(0,1,0) * FMath::Sin(AngleDelta * (Index+1)))
                    * CylinderRadius;

                PDI->DrawPoint(LastVertex - FVector(0,0,1) * HalfHeight,
                               CylinderWireColor, WirePointSize, SDPG_World);
                PDI->DrawPoint(LastVertex + FVector(0,0,1) * HalfHeight,
                               CylinderWireColor, WirePointSize, SDPG_World);
                LastVertex = Vertex;
            }
            DrawWireCylinder(PDI, LocalToWorld.GetOrigin(),
                FVector(1,0,0), FVector(0,1,0), FVector(0,0,1),
                CylinderWireColor, CylinderRadius, HalfHeight,
                NumSides, SDPG_World, WireThickness);
        }
    }
}
```

**Visualizer — DynamicMeshBuilder로 솔리드 메시 + 삼각화된 캡 면 드로잉**

```cpp
// SolEditor/AreaTool/CylinderComponentVisualizer.cpp
void FCylinderComponentVisualizer::DrawVisualization(
    const UActorComponent* Component, const FSceneView* View,
    FPrimitiveDrawInterface* PDI)
{
    const UCylinderComponent* Comp = Cast<const UCylinderComponent>(Component);
    const FMatrix LocalToWorld = Comp->GetOwner()->GetActorTransform().ToMatrixWithScale();
    const auto* MaterialRenderProxy = new FColoredMaterialRenderProxy(
        GEditor->GeomMaterial->GetRenderProxy(), Comp->CylinderMeshColor);

    // 솔리드 실린더 메시
    DrawCylinder(PDI, LocalToWorld.GetOrigin(),
        FVector(1,0,0), FVector(0,1,0), FVector(0,0,1),
        Comp->CylinderRadius, Comp->HalfHeight,
        Comp->NumSides, MaterialRenderProxy, SDPG_World);

    // 캡 면: 2D 폴리곤 → 삼각화 → DynamicMeshBuilder
    FDynamicMeshBuilder MeshBuilder(PDI->View->GetFeatureLevel());
    FPolygon2dTriangulator Triangulator(UE::Geometry::FPolygon2d{Points});
    for (auto Triangle : Triangulator.GetTriangles())
    {
        int32 Verts[3];
        for (int i = 0; i < 3; ++i)
            Verts[i] = MeshBuilder.AddVertex(
                FVector3f(Triangle.V[i].X, Triangle.V[i].Y, 0),
                FVector2f::ZeroVector, PosX, PosY, PosZ, FColor::White);
        MeshBuilder.AddTriangle(Verts[0], Verts[1], Verts[2]);
    }
    MeshBuilder.Draw(PDI, LocalToWorld, MaterialRenderProxy, SDPG_World);
}
```

- `GetDynamicMeshElements` — 렌더 스레드에서 매 프레임 와이어프레임 실린더를 그려 스폰 반경을 표시
- `FComponentVisualizer` — 선택 시 솔리드 메시 + 캡 면을 `FDynamicMeshBuilder` 로 빌드하여 영역을 시각적으로 구분
- `GetViewRelevance` — 에디터에서 선택된 액터만 표시하도록 `bDrawOnlyIfSelected` 제어

<div id="case-validation" class="case-anchor"></div>

## 2. 검증자 체인 (데이터 무결성)

**RID 중복이나 NavMesh 밖 배치 같은 잘못된 데이터가 export되면, 문제가 런타임에서야 드러났습니다.** 그래서 export 전에 RID · 이름 중복 · NavMesh · 폴더 구조 · 리전 **검증자 체인**을 통과해야 export되도록 했고, Commandlet CI(4번)로 빌드 단계에서도 같은 검사를 강제했습니다.

```cpp
// 인터페이스 + 구현체 체인
class IAreaToolValidator { virtual bool Validate(const AAreaToolActor&, const FString& ErrorScope); };
// FRidValidator / FNameValidator(TSet 중복검사) / FNavMeshValidator / FFolderValidator / FRegionValidator
```

## 3. Export + 소스 컨트롤 연동

- 월드 액터를 JSON으로 직렬화한 뒤 **P4 reconcile** → 변경분만 자동 체크아웃 · 추가 (수동 실수 방지)

```cpp
// SolEditor/AreaTool/AreaToolGenerator.h — FAreaToolJsonGenerator
void Export() override;
void SaveAndReconcile(const TMap<FString, TArray<TSharedPtr<FJsonValue>>>& ExportedFileDatas); // P4 연동
TArray<TSharedPtr<IAreaToolValidator>> Validators;
```

- export 결과는 런타임 메타데이터로 사용 → [메타데이터 파이프라인 페이지](/projects/metadata-pipeline/)

## 4. Commandlet 기반 CI

- **에디터 UI 없이 Commandlet**으로 레벨 데이터 검증 · export 실행 → Jenkins CI 연동
- 사람 실수와 무관하게 빌드 단계에서 데이터 검증 · 생성 보장

```cpp
// SolEditor/AreaTool/Commandlet/AreaToolExportCommandlet.h
class UAreaToolExportCommandlet : public UCommandlet {
    virtual int32 Main(const FString& FullCommandLine) override; // → AreaToolSubsystem::ExportAllLevels()
};
```

## 기술 요약

| 영역 | 내용 |
|------|------|
| 저작 | 3D Point Actor 기반 스폰 · 순찰 · 영역 배치 |
| 시각화 | `FPrimitiveSceneProxy` · `FComponentVisualizer` · `FDynamicMeshBuilder` 실린더 DrawMesh |
| 검증 | `IAreaToolValidator` 체인 — RID · 이름 · NavMesh · 폴더 · 리전 |
| Export | `FAreaToolJsonGenerator` JSON 직렬화 + P4 reconcile |
| 자동화 | `UAreaToolExportCommandlet` · Jenkins CI |
| 출력 | Generated 메타데이터(`RidType`) → 런타임 `MetaDataSubsystem` |
