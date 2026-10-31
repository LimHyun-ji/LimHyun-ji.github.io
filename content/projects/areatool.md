---
layout: project
order: 8
title: "AreaTool — 레벨 · 스폰 데이터 저작 & 검증 자동화"
role: "Tools / Pipeline"
period: "2023 — 현재 (상시)"
summary: "레벨 영역 · NPC 스폰 · 순찰 데이터를 배치하는 AreaTool의 검증자 체인, P4 연동 export, Commandlet 기반 CI."
tags: ["Editor Tooling", "AreaTool", "Geometry", "Validator", "Commandlet", "CI", "Perforce"]
highlights:
  - "District 영역을 레벨 기획자가 직접 지정하는 2D Polygon 저작 툴 Mode 제공"
  - "폴리곤 편집 기하 처리 — 화면 클릭 광선과 변의 교차 판정(외적 · 내적)으로 꼭짓점 삽입, Shoelace 공식으로 다각형 무게중심 계산"
  - "NPC 확률성 배치 및 Patrol 영역 지정"
  - "이름 · NavMesh · 폴더 · 리전 검증자 체인(IAreaToolValidator) — 잘못된 데이터를 export 단계에서 걸러냄"
  - "Export 시 기존 파일과 비교해 바뀐 파일만 P4 체크아웃 · 추가 · 삭제"
  - "AreaToolExportCommandlet + Jenkins CI로 레벨 데이터 검증 · export를 빌드 단계에서 강제"
---

> **목적** — 레벨 · 스폰 데이터를 레벨 위에서 직접 배치하고, 검증과 export를 사람 손을 거치지 않게 자동화
>
> **성과** — 잘못된 레벨 데이터의 런타임 유입 차단, 수작업 · 누락 감소
>
> **기여** — 2D Polygon · 3D Point Actor 저작 UX, 검증자 체인, P4 연동 export, Commandlet CI


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

<img class="diagram" src="/images/diagrams/pipeline-flow.svg" alt="AreaTool 파이프라인: 원본(Excel·에셋·레벨)→AreaTool Generator→검증자 체인(Name · NavMesh · Folder · Region)→Export+P4 반영→Generated 메타데이터(RidType)→런타임 MetadataSubsystem, Commandlet(CI)이 실행" />

## 구현 내용

- <strong>저작 UX — 2D Polygon · 3D Point Actor</strong>

  - 레벨별 구역(District)을 기획자가 직접 지정하는 2D Polygon 영역 지정 Mode 제공
  - <strong>AreaTool Outliner</strong>에서 `rid = 1`처럼 조건으로 배치 액터 검색 → 넓은 맵에서도 대상 액터를 바로 찾아 수정

  <div class="shot-row">
    <figure><img src="/images/projects/areatool/areatool-patrol-spawn.jpg" alt="레벨 위에 배치된 순찰 경로와 스폰 지점" /><figcaption>레벨 위 순찰 경로 · 스폰 지점 배치</figcaption></figure>
    <figure><img src="/images/projects/areatool/areatool-spawn-area.jpg" alt="스폰 영역과 영역 안의 NPC 스폰 지점" /><figcaption>스폰 영역과 영역 안의 NPC 스폰 지점</figcaption></figure>
    <figure><img src="/images/projects/areatool/areatool-outliner.png" alt="AreaTool Outliner에서 rid = 1 조건으로 배치 액터 검색" /><figcaption>AreaTool Outliner — 조건 검색(rid = 1)</figcaption></figure>
  </div>

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
  - <strong>폴리곤 편집 — 클릭한 변 위에 꼭짓점 삽입 (광선 · 선분 교차)</strong>
    - Territory · District 폴리곤에서 Alt + 클릭한 지점의 변을 찾아 그 위치에 꼭짓점을 삽입
    - 화면 좌표를 월드 광선으로 바꾼 뒤, 폴리곤의 각 변과의 3D 직선 교차 판정을 직접 구현
    - `DeprojectFVector2D`로 클릭 좌표 → 월드 광선(원점 O, 방향 d), 각 변은 `TransformPosition`으로 월드 변환 후 e = Q − P
    - 평행 판정: n = d × e 가 0이면 제외 / 동일 평면 판정: w = P − O 와 n 의 내적이 0에 가까운지 확인 (허용 오차는 툴 설정값)
    - 교차 매개변수 t, s 가 모두 [0, 1] 범위면 실제 교차, 교차점 = O + t · d
    - 교차점을 `InverseTransformPosition`으로 로컬화해 해당 변 다음 인덱스에 삽입, `Modify()`로 Undo 지원

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

    - 회전된 액터 위에서 꼭짓점을 드래그할 때는 이동량을 액터 회전의 역으로 돌려 로컬 공간 기준으로 반영 (`Quat.GetInverse().RotateVector`)
  - <strong>스폰 프리뷰 기준점 — 다각형 무게중심</strong>
    - 스폰 그룹 프리뷰 메시를 Territory 중앙에 두기 위해 Shoelace 공식으로 면적 기준 무게중심 계산
    - 꼭짓점 평균과 달리 오목 다각형에서도 면적 분포를 반영한 중심을 얻음
    - NPC · FieldObject 스폰 그룹 프리뷰 위치와 Territory 디버그 표시 위치에 사용

      ```cpp
      // TerritoryPolygonComponent.cpp
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

- <strong>검증자 체인 (데이터 무결성)</strong>

  - 잘못 배치된 액터가 그대로 export되면 문제가 런타임에서야 드러남
  - export 직전에 액터마다 검증자 체인(`IAreaToolValidator`)을 통과시키고, 실패한 액터는 결과에서 빼고 경고로 알림
  - Commandlet CI도 같은 Export 경로를 타므로 빌드 단계에서도 같은 검사 적용
  - <strong>인터페이스 하나 + Generator별 조합</strong>
    - 검증자는 모두 `IAreaToolValidator`를 구현하고, Generator마다 필요한 것만 등록
    - 이름 중복 검사는 모든 JSON Generator에 기본 포함
    - District는 폴더 · 레벨, TeleportGroup은 확률 · 폴더 · 리전, SpawnNpc는 NavMesh · 폴더 · 리전 검증
    - 하나라도 실패하면 그 액터는 export 대상에서 제외
  - <strong>검증 규칙</strong>
    - `FNameValidator` — 액터 라벨 중복 검사(`TSet`), 상태를 가지므로 Export 시작 때 `ClearCachedData()` 호출로 초기화
    - `FFolderValidator` — Outliner의 `Design/Level/` · `Design/Quest/` 하위 액터만 export
    - `FRegionValidator` / `RegionValidator` — 폴더에서 뽑은 리전 이름 / 현재 레벨 이름이 Region 메타데이터에 있는지 확인
    - `FTeleportProbValidator` — 한 텔레포트 그룹 안에서 확률이 있는 항목과 0인 항목이 섞이면 실패
    - `FNavMeshValidator` — 액터 위치를 NavMesh에 투영해 실패하면 경고 (차단하지 않고 경고만 남김)
  - <strong>폴더 구조로 리전 판별</strong>
    - 기획자가 Outliner 폴더를 `…/Design/Level/<리전>/<District>/…` 규칙으로 정리
    - 폴더 경로에서 리전 이름을 정규식으로 잘라 Region 메타데이터와 대조, export 파일을 리전별로 나누는 기준으로도 사용

      ```cpp
      // AreaToolActor.cpp — "Root/Depth/Design/Level/INSRegion/District_A/MonsterA" → "INSRegion"
      FString AAreaToolActor::GetInsRegionName(FString FolderPath)
      {
          // 접두사 정규식: "Design/Level/|Design/Quest/"
          FRegexPattern PrefixRegexPattern(TEXT("^.*?" + PrefixsRegex));
          FRegexMatcher PrefixMatcher(PrefixRegexPattern, FolderPath);

          FString TrimmedPath = FolderPath;
          if (PrefixMatcher.FindNext())                     // 처음부터 접두사 끝까지 제거
              TrimmedPath = FolderPath.RightChop(PrefixMatcher.GetMatchEnding());

          FRegexMatcher SlashMatcher(FRegexPattern(TEXT("/.*$")), TrimmedPath);
          if (SlashMatcher.FindNext())                      // 첫 '/'부터 끝까지 제거
              TrimmedPath = TrimmedPath.Left(SlashMatcher.GetMatchBeginning());

          return TrimmedPath;
      }
      ```

  - <strong>경고에서 바로 액터로 이동</strong>
    - 실패 내용은 AreaTool 메시지 로그에 `FUObjectToken` 링크와 함께 기록, 클릭하면 해당 액터 선택
    - 전체 레벨 일괄 export처럼 무인으로 도는 경로에서는 경고 팝업 없이 로그만 남김

- <strong>Export + 소스 컨트롤 연동</strong>

  <img class="diagram" src="/images/diagrams/areatool-reconcile.svg" alt="AreaTool Export의 SaveAndReconcile 흐름: Export 결과(파일 경로별 JSON 배열)를 파일마다 기존 파일 문자열과 비교해, 동일하면 건너뛰고(체크아웃 · 저장 없음), 내용이 바뀌었으면 FCheckOut 후 저장, 새 파일이면 저장 후 FMarkForAdd. 기존 Level/ · Region/ 하위 json 중 이번 Export에 없는 파일은 FDelete로 삭제" />

  - export 결과를 통째로 저장하면 바뀌지 않은 파일까지 체크아웃되고, 레벨에서 지운 액터의 파일은 그대로 남음
  - `FAreaToolJsonGenerator::SaveAndReconcile`에서 export 결과와 디스크의 기존 파일을 직접 비교해, 달라진 파일에만 소스 컨트롤 작업 수행
  - <strong>파일 단위 reconcile</strong>
    - export 결과는 액터마다 정해진 파일 경로로 묶인 JSON 배열
    - 기존 파일과 문자열로 비교해 동일 · 변경 · 신규로 분류, 비교에 쓰이지 않고 남은 기존 파일은 삭제 대상

      ```cpp
      // AreaToolGenerator.cpp — FAreaToolJsonGenerator::SaveAndReconcile
      for (const auto& [RelPath, JsonArray] : ExportedFileDatas)
      {
          const FString FilePath = FPaths::ConvertRelativePathToFull(DIR_METADATA_FOR_SERVER, RelPath);
          FString ExportedJsonString;
          FJsonSerializer::Serialize(JsonArray, TJsonWriterFactory<>::Create(&ExportedJsonString));

          CurrExistDataFiles.Remove(FilePath);           // 남는 파일 = 이번 Export에 없는 파일
          if (FileManager.FileExists(*FilePath))
          {
              FString Existing;
              if (FFileHelper::LoadFileToString(Existing, *FilePath) && Existing == ExportedJsonString)
                  continue;                              // 동일 → 체크아웃하지 않음
              EditFiles.Add(FilePath);
          }
          else AddedFiles.Add(FilePath);
          DatasToSave.Add(FilePath, ExportedJsonString);
      }
      // FDelete(CurrExistDataFiles) → FCheckOut(EditFiles) → 저장 → FMarkForAdd(AddedFiles)
      ```

  - <strong>같은 데이터는 같은 문자열로</strong>
    - 문자열 비교가 의미 있으려면 직렬화 순서가 매번 같아야 함
    - export 전에 액터를 GUID 순으로 정렬, DataAsset도 GUID 키 순으로 정렬해 저장
  - <strong>JSON · DataAsset 두 경로</strong>
    - JSON은 서버용 생성 데이터 폴더(`GeneratedData_Server`)에 저장
    - 클라이언트용 데이터는 `FAreaToolAssetGenerator<TargetActor, TargetAssetSet>` 템플릿으로 `/Game/GameAsset/Area/<레벨>/` 아래 DataAsset으로 저장
    - DataAsset도 기존 에셋을 JSON 문자열로 바꿔 비교한 뒤 변경분만 체크아웃 · 추가, 사라진 에셋은 삭제
  - <strong>메타데이터에 없는 리전 파일 정리</strong>
    - 전체 레벨 export 후 `CleanUp()`이 Region 메타데이터에 없는 리전 이름의 파일을 소스 컨트롤에서 삭제
  - export 결과는 런타임 메타데이터로 사용 → [메타데이터 파이프라인 페이지](/projects/metadata-pipeline/)

- <strong>Commandlet 기반 CI</strong>

  - export를 사람이 에디터에서 레벨마다 실행하면 빠지는 레벨이 생길 수 있음
  - 에디터 UI 없이 Commandlet으로 전체 레벨의 검증 · export를 실행하고 Jenkins CI에 연동
  - 사람 실수와 무관하게 빌드 단계에서 데이터 검증 · 생성 보장
  - <strong>`UAreaToolExportCommandlet` → `ExportAllLevels()`</strong>
    - Commandlet은 `UAreaToolSubsystem::ExportAllLevels()`만 호출
    - Region 메타데이터에 등록된 레벨 목록을 돌며 레벨 로드 → 검증 · export 반복, 마지막에 `CleanUp()`
    - 에디터 메뉴의 전체 export도 같은 함수 사용
  - <strong>헤드리스에서도 에디터와 같은 상태로 레벨 로드</strong>
    - 맵만 열면 World Partition 셀 · 데이터 레이어 · NavMesh가 로드되지 않아 배치 액터 수집과 NavMesh 검증이 동작하지 않음
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

  - <strong>Slate 없는 환경 대응</strong>
    - 디버그 입력 처리기는 `!IsRunningCommandlet() && FSlateApplication::IsInitialized()`일 때만 등록
    - Commandlet 경로에서는 경고 팝업을 띄우지 않음
  - <strong>레벨 데이터 빌더 Commandlet에 통합</strong>
    - NavMesh · Landscape 등을 굽는 팀 공용 `SolLevelDataBuilderCommandlet`에 빌더 팩토리(`USolLevelDataBuilderFactory`)를 추가해, 명령줄 스위치 이름으로 실행할 빌더 선택
    - AreaTool은 `-AreaToolData` 스위치로 레벨마다 export, 모든 맵 처리 후 팩토리 `CleanUp()` 한 번 호출
    - Jenkins 파이프라인이 이 Commandlet을 `-AreaToolData`와 함께 호출
