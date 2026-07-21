---
layout: project
order: 5
title: "데이터 파이프라인 & 에디터 자동화"
role: "Tools / Pipeline"
period: "2023.02 — 현재 (입사 직후 ~ 상시)"
summary: "입사 직후 Excel→JSON→C++ 자동 생성 파이프라인을 단독 설계·구축한 것을 시작으로, AreaTool 검증 체인·Commandlet CI 등 데이터 무결성과 제작 생산성을 위한 사내 에디터 툴과 빌드 파이프라인을 개발."
tags: ["Editor Tooling", "Python", "Commandlet", "CI", "Metadata"]
highlights:
  - "입사 첫 3개월에 Excel→JSON→C++ enum/struct 자동 생성 파이프라인을 단독 설계·구축 (Perforce 자동화·JSON Schema 검증·한글 인코딩)"
  - "레벨 배치 툴(AreaTool): RID·이름·NavMesh·폴더·리전 검증자 체인, Export 시 P4 reconcile로 변경분만 체크아웃"
  - "Commandlet 기반 CI(Jenkins) 연동으로 데이터 검증·생성을 빌드 단계에서 강제 — 잘못된 데이터의 런타임 유입 차단"
  - "VisualData 에디터는 EditorModule 이전·타입별 클래스 분리·구 에셋 자동 변환(AssetMigration)으로 대규모 리팩토링"
---

- 입사 직후 **데이터 코드 생성 파이프라인 단독 구축** → 에디터 툴·빌드 파이프라인 상시 담당
- 데이터 자동 **검증·생성·배포** 흐름 구축 → 수작업 반복·런타임 데이터 유입 차단

> **목적** — 데이터 무결성·제작 생산성을 위한 사내 에디터 툴과 빌드 파이프라인
>
> **성과** — 잘못된 데이터의 런타임 유입 차단, 반복 작업·휴먼에러↓
>
> **기여** — 입사 첫 3개월 코드 생성 파이프라인 단독 구축, AreaTool 검증 체인·Commandlet CI, VisualData 에디터 리팩토링

## 개요

- 콘텐츠 제작팀 생산성·게임 데이터 무결성 향상을 위한 **사내 에디터 툴·빌드 파이프라인** 개발
- 데이터 자동 검증·생성·배포 흐름 구축 집중

<img class="diagram" src="/images/diagrams/pipeline-flow.svg" alt="데이터 파이프라인 관계도: 원본(Excel·에셋·레벨)→AreaTool Generator→검증자 체인→Export+P4 Reconcile→Generated 메타데이터(RidType)→런타임 MetadataSubsystem, Commandlet(CI)이 실행" />

## 주요 작업

### 데이터 코드 생성 파이프라인 — 입사 첫 3개월, 단독 구축

- **Excel 원본 → JSON → C++ enum/struct** 자동 생성 흐름 Python 단독 설계·구축
- Perforce 체크인/아웃 자동화·JSON Schema 검증·리스트 형식(`use_effect[0]/[1]`)·한글 인코딩 처리 포함
- 기획 Excel 수정 → 검증된 C++ 자동 생성 구조 (반복 작업·휴먼에러 감소)
- 이후 모든 메타데이터 작업의 토대

> **증상** 한글 깨짐·수동 P4 체크아웃 누락 · **해결** 한글 인코딩 파이프라인 내장 + P4 reconcile 자동 연동 → 파이프라인 단계 차단

### 레벨 / 스폰 데이터 파이프라인 (AreaTool)

- 레벨 영역·NPC 스폰·순찰(Patrol) 데이터 AreaTool 개선
- **Commandlet 기반 CI** 연동 → 레벨데이터 검증·export 자동화 (수작업·누락 감소)
- 스폰 데이터 편집: 2D Polygon → **3D Point Actor** 전환 (저작 UX 개선)

### 데이터 주도 에디터 툴

- 메타데이터 Generator·VisualData Editor(캐릭터 외형/소켓 프리뷰) 개발
- VisualData 에디터 2025년 대규모 리팩토링: EditorModule 이전·PreviewActor 병합·타입별(PC/NPC/FieldObject/Item/Spirit) 클래스 분리·`VisualDataInterface` 제거
- 구 에셋 → 신 타입 자동 변환 **AssetMigration 툴** 구현 → 에디터 아키텍처 부채 일괄 해소

## 기술 요약

| 영역 | 내용 |
|------|------|
| 언어 | C++ · Python |
| 에디터 | UE5 Editor Module(`SolEditor`) · `UDeveloperSettings` |
| 자동화 | Commandlet 기반 CI(Jenkins) · P4 자동화 스크립트 |
| 데이터 | 메타데이터 Generator · VisualData Editor · `RidType` 키 |
| 출력 | 검증된 Generated 메타데이터 → 런타임 `MetaDataSubsystem` |

## 핵심 구현

### Commandlet 기반 CI

- **에디터 UI 없이 Commandlet**으로 레벨/비주얼 데이터 export 실행 → Jenkins CI 연동
- 사람 실수와 무관하게 빌드 단계 데이터 검증·생성 보장

```cpp
// SolEditor/AreaTool/Commandlet/AreaToolExportCommandlet.h
class UAreaToolExportCommandlet : public UCommandlet {
    virtual int32 Main(const FString& FullCommandLine) override; // → AreaToolSubsystem::ExportAllLevels()
};
// VisualDataExportCommandlet → FVisualDataExport::Execute_ExportAllJson()
```

### 검증자 체인 (데이터 무결성)

- export 전 **검증자 체인** 통과: RID·이름 중복·NavMesh·폴더구조·리전
- 잘못된 데이터 런타임 유입 차단

```cpp
// SolEditor/AreaTool/AreaToolValidator.h — 인터페이스 + 구현체 체인
class IAreaToolValidator { virtual bool Validate(const AAreaToolActor&, const FString& ErrorScope); };
// FRidValidator / FNameValidator(TSet 중복검사) / FNavMeshValidator / FFolderValidator / FRegionValidator
```

### Export + 소스컨트롤 연동

- 월드 액터 JSON 직렬화 후 **P4 reconcile** → 변경분만 자동 체크아웃/추가 (수동 실수 방지)

```cpp
// SolEditor/AreaTool/AreaToolGenerator.h — FAreaToolJsonGenerator
void Export() override;
void SaveAndReconcile(const TMap<FString, TArray<TSharedPtr<FJsonValue>>>& ExportedFileDatas); // P4 연동
TArray<TSharedPtr<IAreaToolValidator>> Validators;
```

- `FVisualDataExport`: NPC/갓아머/정령/필드오브젝트 매핑·액션 메타데이터 JSON export (`Execute_ExportAssetType(..., bUseP4v)`)

> 미니맵의 RenderTarget 텍스처 변환·퀘스트 인디케이터는 '인게임 연출 & GPU 렌더링 파이프라인' 페이지에서 다룹니다.
