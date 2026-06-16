---
layout: project
order: 5
title: "에디터 툴 & 데이터 파이프라인"
role: "Tools / Pipeline"
period: "2023.02 — 현재 (입사 직후 ~ 상시)"
summary: "입사 직후 데이터 코드 생성 파이프라인을 단독 구축한 것을 시작으로, 콘텐츠 제작 생산성과 데이터 무결성을 위한 사내 에디터 툴과 빌드 파이프라인을 개발."
tags: ["Editor Tooling", "Python", "Commandlet", "CI", "Metadata"]
highlights:
  - "입사 첫 3개월에 Excel→JSON→C++ enum/struct 자동 생성 Python 파이프라인을 단독 구축 (P4 체크인/아웃 자동화·JSON Schema URI 검증·한글 인코딩, CL 2377~3056)"
  - "레벨/스폰 데이터 AreaTool을 Commandlet 기반 CI로 자동화 — 검증자 체인(RID·이름·NavMesh·폴더·리전)으로 잘못된 데이터의 런타임 유입 차단"
  - "메타데이터 Generator·VisualData Editor 등 데이터 주도 에디터 툴 개발, VisualData 에디터는 타입별 클래스 분리·AssetMigration 자동화로 대규모 리팩토링"
  - "Export 시 P4 reconcile로 변경분만 체크아웃되게 연동 — 수동 체크아웃 실수 방지"
---

## 개요

콘텐츠 제작팀의 생산성과 게임 데이터의 무결성을 높이기 위한 **사내 에디터 툴과 빌드 파이프라인**을
개발했습니다. 게임플레이 기능 못지않게 비중이 큰 작업 영역으로, 데이터가 자동으로 검증·생성·배포되는
흐름을 만드는 데 집중했습니다.

## 주요 작업

### 데이터 코드 생성 파이프라인 — 입사 첫 3개월, 단독 구축
합류 직후 가장 먼저 맡은 일이 **데이터 파이프라인 전체를 세우는 것**이었습니다.
**Excel 원본 → JSON → C++ enum/struct 자동 생성** 흐름을 Python으로 단독 구축하면서,
Perforce 체크인/아웃 자동화, JSON Schema URI 기반 검증, 리스트 형식(`use_effect[0]/[1]`)·한글 인코딩 처리까지
직접 정의했습니다(CL 2377~3056). 기획이 Excel만 고치면 검증된 C++ 코드가 자동으로 떨어지는 구조라
반복 작업과 휴먼 에러를 크게 줄였고, 이후 모든 메타데이터 작업의 토대가 됐습니다.

### 레벨 / 스폰 데이터 파이프라인 (AreaTool)
레벨 영역·NPC 스폰·순찰(Patrol) 데이터를 다루는 AreaTool을 개선하고,
**Commandlet 기반 CI**로 레벨데이터 검증과 export를 자동화해 수작업과 누락을 줄였습니다.
스폰 데이터는 2D Polygon 편집에서 **3D Point Actor** 편집으로 전환해 저작 UX를 개선했습니다(CL 16683).

### 데이터 주도 에디터 툴
메타데이터 Generator, VisualData Editor(캐릭터 외형/소켓 프리뷰) 등
데이터 주도 설계를 지원하는 에디터 도구를 개발했습니다. VisualData 에디터는 2025년
EditorModule 이전·PreviewActor 병합·타입별(PC/NPC/FieldObject/Item/Spirit) 클래스 분리·
`VisualDataInterface` 제거, 구 에셋을 신 타입으로 자동 변환하는 **AssetMigration 툴**까지
대규모로 리팩토링해 에디터 아키텍처 부채를 일괄 해소했습니다.

## 기술 요약

| 영역 | 내용 |
|------|------|
| 언어 | C++ · Python |
| 에디터 | UE5 Editor Module(`SolEditor`) · `UDeveloperSettings` |
| 자동화 | Commandlet 기반 CI(Jenkins) · P4 자동화 스크립트 |
| 데이터 | 메타데이터 Generator · VisualData Editor · `RidType` 키 |
| 출력 | 검증된 Generated 메타데이터 → 런타임 `MetaDataSubsystem` |

## 파이프라인 구조

원본 데이터가 에디터 툴·Commandlet을 거쳐 **검증·생성·배포**되는 자동화 흐름입니다.

<div class="mermaid">
flowchart LR
  SRC["원본 데이터<br/>Excel · 에셋 · 레벨"] --> TOOL["에디터 툴<br/>AreaTool · Generator"]
  TOOL --> CMD["Commandlet<br/>(CI 자동 실행)"]
  CMD --> VAL["검증 · Export"]
  VAL --> GEN["Generated 메타데이터<br/>(RidType 키)"]
  GEN --> RT["런타임<br/>MetaDataSubsystem"]
</div>

## 핵심 구현

### Commandlet 기반 CI
레벨/비주얼 데이터 export를 **에디터 UI 없이 Commandlet으로** 실행해 Jenkins CI에 물렸습니다 — 사람이 잊어도 빌드가 데이터를 검증·생성합니다.
```cpp
// SolEditor/AreaTool/Commandlet/AreaToolExportCommandlet.h
class UAreaToolExportCommandlet : public UCommandlet {
    virtual int32 Main(const FString& FullCommandLine) override; // → AreaToolSubsystem::ExportAllLevels()
};
// VisualDataExportCommandlet → FVisualDataExport::Execute_ExportAllJson()
```

### 검증자 체인 (데이터 무결성)
export 전에 **검증자 체인**으로 리소스ID/이름 중복/네비메시/폴더구조/리전을 통과시켜, 잘못된 데이터가 런타임으로 새는 걸 차단했습니다.
```cpp
// SolEditor/AreaTool/AreaToolValidator.h — 인터페이스 + 구현체 체인
class IAreaToolValidator { virtual bool Validate(const AAreaToolActor&, const FString& ErrorScope); };
// FRidValidator / FNameValidator(TSet 중복검사) / FNavMeshValidator / FFolderValidator / FRegionValidator
```

### Export + 소스컨트롤 연동
월드 액터를 JSON으로 직렬화하고, **P4와 reconcile**해 변경분만 체크아웃/추가되도록 했습니다(수동 체크아웃 실수 방지).
```cpp
// SolEditor/AreaTool/AreaToolGenerator.h — FAreaToolJsonGenerator
void Export() override;
void SaveAndReconcile(const TMap<FString, TArray<TSharedPtr<FJsonValue>>>& ExportedFileDatas); // P4 연동
TArray<TSharedPtr<IAreaToolValidator>> Validators;
```
`FVisualDataExport`는 NPC/갓아머/정령/필드오브젝트 매핑과 액션 메타데이터를 JSON으로 내보냅니다(`Execute_ExportAssetType(..., bUseP4v)`).

> 미니맵의 RenderTarget 텍스처 변환·퀘스트 인디케이터는 '인게임 연출 & GPU 렌더링 파이프라인' 페이지에서 다룹니다.
