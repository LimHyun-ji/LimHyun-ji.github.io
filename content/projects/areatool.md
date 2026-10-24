---
layout: project
order: 8
title: "AreaTool — 레벨 · 스폰 데이터 저작 & 검증 자동화"
role: "Tools / Pipeline"
period: "2023 — 현재 (상시)"
summary: "레벨 영역 · NPC 스폰 · 순찰 데이터를 배치하는 AreaTool의 검증자 체인, P4 연동 export, Commandlet 기반 CI."
tags: ["Editor Tooling", "AreaTool", "Validator", "Commandlet", "CI", "Perforce"]
highlights:
  - "스폰 데이터 편집을 2D Polygon → 3D Point Actor로 전환해 레벨 위에서 직접 배치하는 저작 UX로 개선"
  - "RID · 이름 · NavMesh · 폴더 · 리전 검증자 체인(IAreaToolValidator) — 잘못된 데이터의 런타임 유입 차단"
  - "Export 시 P4 reconcile로 변경분만 자동 체크아웃 · 추가"
  - "AreaToolExportCommandlet + Jenkins CI로 레벨 데이터 검증 · export를 빌드 단계에서 강제"
---

> **목적** — 레벨 · 스폰 데이터를 레벨 위에서 직접 배치하고, 검증과 export를 사람 손을 거치지 않게 자동화
>
> **성과** — 잘못된 레벨 데이터의 런타임 유입 차단, 수작업 · 누락 감소
>
> **기여** — 3D Point Actor 저작 UX, 검증자 체인, P4 연동 export, Commandlet CI

## 개요

- 레벨 영역 · NPC 스폰 · 순찰(Patrol) 데이터를 배치하는 **레벨 데이터 저작 툴**
- 배치 → 검증 → export → 런타임 메타데이터까지의 흐름을 자동화

<img class="diagram" src="/images/diagrams/pipeline-flow.svg" alt="AreaTool 파이프라인: 원본(Excel·에셋·레벨)→AreaTool Generator→검증자 체인→Export+P4 Reconcile→Generated 메타데이터(RidType)→런타임 MetadataSubsystem, Commandlet(CI)이 실행" />

## 1. 저작 UX — 2D Polygon → 3D Point Actor

- 스폰 데이터 편집을 2D Polygon에서 **3D Point Actor**로 전환
- 레벨 위에서 스폰 지점을 직접 보며 배치 → 실제 위치와 데이터의 어긋남 감소

## 2. 검증자 체인 (데이터 무결성)

- export 전 **검증자 체인** 통과: RID · 이름 중복 · NavMesh · 폴더 구조 · 리전
- 잘못된 데이터의 런타임 유입 차단

```cpp
// SolEditor/AreaTool/AreaToolValidator.h — 인터페이스 + 구현체 체인
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
| 검증 | `IAreaToolValidator` 체인 — RID · 이름 · NavMesh · 폴더 · 리전 |
| Export | `FAreaToolJsonGenerator` JSON 직렬화 + P4 reconcile |
| 자동화 | `UAreaToolExportCommandlet` · Jenkins CI |
| 출력 | Generated 메타데이터(`RidType`) → 런타임 `MetaDataSubsystem` |
