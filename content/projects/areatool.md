---
layout: project
order: 8
title: "AreaTool — 레벨 · 스폰 데이터 저작 & 검증 자동화"
role: "Tools / Pipeline"
period: "2023 — 현재 (상시)"
summary: "레벨 영역 저작툴, Commandlet 기반 검증 CI."
tags: ["엔진 툴 확장", "게임 수학"]
---

<div class="shot-row">
  <figure><img src="/images/projects/areatool/areatool-patrol-spawn.jpg" alt="레벨 위에 배치된 순찰 경로와 스폰 지점" /><figcaption>레벨 위 순찰 경로 · 스폰 지점 배치</figcaption></figure>
  <figure><img src="/images/projects/areatool/areatool-spawn-area.jpg" alt="스폰 영역과 영역 안의 NPC 스폰 지점" /><figcaption>스폰 영역과 영역 안의 NPC 스폰 지점</figcaption></figure>
  <figure><img src="/images/projects/areatool/areatool-outliner.png" alt="AreaTool Outliner에서 rid = 1 조건으로 배치 액터 검색" /><figcaption>AreaTool Outliner — 조건 검색(rid = 1)</figcaption></figure>
</div>

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
  <div class="case">
    <p class="case-title">폴리곤 영역 편집 불편</p>
    <dl>
      <dt>문제</dt><dd>꼭짓점 추가가 선택한 점을 Alt + 드래그로 복제하는 방식이라 원하는 변 위치에 넣기 어렵고, 회전된 영역에서는 드래그 방향과 점 이동 방향이 어긋남</dd>
      <dt>해결</dt><dd>클릭 지점의 월드 광선과 각 변의 교차 판정으로 클릭한 변 위에 꼭짓점 삽입, 이동량은 액터 회전의 역으로 로컬 변환</dd>
      <dt>결과</dt><dd>클릭한 위치에 바로 꼭짓점 추가, 회전된 영역에서도 드래그 방향대로 편집</dd>
    </dl>
    <a class="case-more" href="#case-polygon-edit">자세히 ↓</a>
  </div>
</div>

## 개요

- 레벨 영역 · NPC 스폰 · 순찰(Patrol) 데이터를 배치하는 **레벨 데이터 저작 툴**
- 배치 → 검증 → export → 런타임 메타데이터까지의 흐름을 자동화

<img class="diagram" src="/images/diagrams/pipeline-flow.svg" alt="AreaTool 파이프라인: 원본(Excel·에셋·레벨)→AreaTool Generator→검증자 체인(Name · NavMesh · Folder · Region)→Export+P4 반영→Generated 메타데이터(RidType)→런타임 MetadataSubsystem, Commandlet(CI)이 실행" />

## 구현 내용

### 저작 UX — 2D Polygon · 3D Point Actor

- 레벨별 구역(District)을 기획자가 직접 지정하는 2D Polygon 영역 지정 Mode 제공
- <strong>AreaTool Outliner</strong>에서 `rid = 1`처럼 조건으로 배치 액터 검색 → 넓은 맵에서도 대상 액터를 바로 찾아 수정

- <strong>에디터 3D 시각화 — CylinderComponent · DrawMesh</strong>
  - 스폰 반경 · 순찰 영역을 뷰포트에서 확인하도록 `FPrimitiveSceneProxy` 기반 커스텀 실린더 컴포넌트와 `FComponentVisualizer` 구현
  - `GetDynamicMeshElements` — 렌더 스레드에서 매 프레임 와이어프레임 실린더를 그려 스폰 반경 표시

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

  - `FComponentVisualizer` — 선택 시 솔리드 메시 + 삼각화된 캡 면을 `FDynamicMeshBuilder`로 빌드해 영역을 시각적으로 구분

    ```cpp
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

  - `GetViewRelevance` — `bDrawOnlyIfSelected`로 에디터에서 선택된 액터만 표시

<div id="case-polygon-edit" class="case-anchor"></div>

- <strong>폴리곤 편집 — 클릭한 변 위에 꼭짓점 삽입 (광선 · 선분 교차)</strong>
  - Alt + 클릭한 화면 좌표를 월드 광선으로 바꾸고, 폴리곤의 각 변과 3D 교차 판정을 직접 구현
  - 외적 · 내적으로 평행 · 동일 평면 여부를 거른 뒤, 교차 매개변수 t, s 가 모두 [0, 1] 안이면 그 변 위의 점으로 판정
  - 교차점을 로컬 좌표로 바꿔 해당 변 다음 인덱스에 삽입 (Undo 지원)
  - 회전된 액터 위에서 꼭짓점을 드래그할 때는 이동량을 액터 회전의 역으로 돌려 로컬 공간 기준으로 반영 (`Quat.GetInverse().RotateVector`)

    ```cpp
    // Polygon2dComponentVisualizer.cpp
    View->DeprojectFVector2D(FVector2D(Click.GetClickPos()), WorldOrigin, WorldDirection);
    WorldDirection *= WORLD_MAX / 2.f;

    for (int32 Index = 0; Index < Polygon2dComp->Point3D.Num(); ++Index)
    {
        const FTransform& Transform = Polygon2dComp->GetComponentTransform();
        const int32 NextIdx = (Index + 1) % Polygon2dComp->Point3D.Num();
        const FVector StartPos = Transform.TransformPosition(Polygon2dComp->Point3D[Index]);
        const FVector EndPos   = Transform.TransformPosition(Polygon2dComp->Point3D[NextIdx]);
        const FVector LineDirection = EndPos - StartPos;

        // 1. 평행 — 외적이 0
        const FVector Product = FVector::CrossProduct(WorldDirection, LineDirection);
        if (Product.GetSafeNormal().IsNearlyZero()) continue;

        // 2. 동일 평면 — 시작점 차이 벡터가 법선과 수직
        const FVector BetweenStarts = StartPos - WorldOrigin;
        const float Scalar = FVector::DotProduct(BetweenStarts.GetSafeNormal(), Product.GetSafeNormal());
        if (!FMath::IsNearlyZero(Scalar, Tolerance)) continue;

        // 3. 교차 매개변수 t(광선), s(변)
        const float t = FVector::DotProduct(FVector::CrossProduct(BetweenStarts, LineDirection), Product) / Product.SizeSquared();
        const float s = FVector::DotProduct(FVector::CrossProduct(BetweenStarts, WorldDirection), Product) / Product.SizeSquared();
        if (t >= -Tolerance && t <= 1.f + Tolerance && s >= -Tolerance && s <= 1.f + Tolerance)
        {
            IntersectPoint = WorldOrigin + t * WorldDirection;
            CurrentIdx = Index;
            break;
        }
    }
    // 교차점 → InverseTransformPosition → Point3D.Insert(LocalPos, CurrentIdx + 1)
    ```

- <strong>스폰 프리뷰 기준점 — 다각형 무게중심</strong>
  - 스폰 그룹 프리뷰 메시를 Territory 중앙에 두기 위해 면적 기준 무게중심 계산
  - 꼭짓점 평균과 달리 오목 다각형에서도 면적 분포를 반영한 중심을 얻음

    ```cpp
    FVector2D UTerritoryPolygonComponent::GetCenter()
    {
        float SignedArea = 0.0f;
        FVector2D Centroid(0.0f, 0.0f);
        for (int32 Index = 0; Index < Point3D.Num(); ++Index)
        {
            const FVector2D Current = FVector2D(Point3D[Index]);
            const FVector2D Next    = FVector2D(Point3D[(Index + 1) % Point3D.Num()]);
            const float Cross = FVector2D::CrossProduct(Current, Next);   // 변이 만드는 부호 있는 면적 × 2
            SignedArea += Cross;
            Centroid.X += (Current.X + Next.X) * Cross;
            Centroid.Y += (Current.Y + Next.Y) * Cross;
        }
        SignedArea *= 0.5f;
        Centroid /= (6.0f * SignedArea);
        return Centroid;
    }
    ```

<div id="case-validation" class="case-anchor"></div>

### 검증자 체인 (데이터 무결성)

- export 직전 액터마다 검증자 체인을 통과시키고, 실패한 액터는 제외 후 경고 → Commandlet CI도 같은 경로로 검사
- <strong>인터페이스 하나 + Generator별 조합</strong>

### Export + 소스 컨트롤 연동

<img class="diagram" src="/images/diagrams/areatool-reconcile.svg" alt="AreaTool Export의 SaveAndReconcile 흐름: Export 결과(파일 경로별 JSON 배열)를 파일마다 기존 파일 문자열과 비교해, 동일하면 건너뛰고(체크아웃 · 저장 없음), 내용이 바뀌었으면 FCheckOut 후 저장, 새 파일이면 저장 후 FMarkForAdd. 기존 Level/ · Region/ 하위 json 중 이번 Export에 없는 파일은 FDelete로 삭제" />

- export 결과와 디스크의 기존 파일을 직접 비교해, 달라진 파일에만 소스 컨트롤 작업 수행 (`FAreaToolJsonGenerator::SaveAndReconcile`)
- <strong>파일 단위 reconcile</strong>
- <strong>JSON · DataAsset 두 경로</strong>
  - JSON은 서버용 생성 데이터 폴더(`GeneratedData_Server`)에 저장
  - 클라이언트용 데이터는 `FAreaToolAssetGenerator<TargetActor, TargetAssetSet>` 템플릿으로 `/Game/GameAsset/Area/<레벨>/` 아래 DataAsset으로 저장
- export 결과는 런타임 메타데이터로 사용

### Commandlet 기반 CI

- export를 사람이 에디터에서 레벨마다 실행하면 빠지는 레벨이 생길 수 있음
- 에디터 UI 없이 Commandlet으로 전체 레벨의 검증 · export를 실행하고 Jenkins CI에 연동
- 사람 실수와 무관하게 빌드 단계에서 데이터 검증 · 생성 보장
- <strong>헤드리스에서도 에디터와 같은 상태로 레벨 로드</strong>
  - 레벨마다 내비게이션 시스템 추가 → 기획 배치용 데이터 레이어(`DL_Design`) 로드 → 월드 전체 범위 로드

    ```cpp
    // AreaToolSubsystem.cpp
    void UAreaToolSubsystem::LoadWorld(const FAssetData& InAsset)
    {
        FEditorFileUtils::LoadMap(FPackageName::ObjectPathToPackageName(InAsset.GetObjectPathString()), false);

        UWorld* CurrWorld = GEditor->GetEditorWorldContext().World();
        FNavigationSystem::AddNavigationSystemToWorld(*CurrWorld, FNavigationSystemRunMode::EditorMode);
        LoadDataLayer();                                   // DL_Design 데이터 레이어 로드

        // World Partition 전체 + NavMesh 로드
        TArray<TUniquePtr<IWorldPartitionActorLoaderInterface::ILoaderAdapter>> LoaderAdapters;
        static const FBox BoxEntireWorld(FVector(-HALF_WORLD_MAX), FVector(HALF_WORLD_MAX));
        LoaderAdapters.Add_GetRef(MakeUnique<FLoaderAdapterShape>(CurrWorld, BoxEntireWorld, TEXT("Loaded Region")))->Load();
    }
    ```

