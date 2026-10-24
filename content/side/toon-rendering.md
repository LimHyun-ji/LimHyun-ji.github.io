---
title: "UE5 Toon Rendering Demo"
subtitle: "카툰 렌더링 기법 연구 · Unreal Engine 5"
engine: "Unreal / C++ · HLSL"
period: "2026.10"
team: "solo"
status: "Highlights"
image: "/images/yt/toon-rendering.jpg"
video: ""
tags: ["Unreal", "C++", "HLSL", "Toon Shading", "NPR", "Custom Shading Model", "Mobile"]
links: { git: "", doc: "", video: "" }
---

## 프로젝트 소개

UE5에서 카툰(Toon) 렌더링 파이프라인을 직접 구현하는 기술 연구 프로젝트입니다.
Custom Shading Model 확장과 Post Process Material을 활용한 NPR(Non-Photorealistic Rendering) 기법을 구현하고,
모바일 환경에서의 성능까지 고려한 설계를 목표로 합니다.

기존 프로젝트에서 SceneCapture, RenderTarget, Compute Shader 등의 렌더링 경험을 쌓았으며,
이를 기반으로 커스텀 셰이딩과 NPR 기법으로 영역을 확장합니다.

## 기술 구현

### 1. Custom Shading Model 기반 Toon Shading

- UE5 엔진 소스를 수정하여 <strong>Custom Shading Model</strong> 추가
  - `ShadingModels.h`, `ShadingCommon.ush`, `DeferredShadingCommon.ush` 등 엔진 셰이더 파일 수정
- GBuffer에 커스텀 데이터를 기록하고, 라이팅 패스에서 <strong>Step Diffuse</strong>(계단식 음영)를 계산하는 HLSL 구현
- <strong>Ramp Texture</strong> 기반 라이팅 — 아티스트가 음영 단계를 텍스처로 제어할 수 있는 구조
- Specular 영역도 Step 처리하여 날카로운 하이라이트 표현

### 2. 아웃라인 렌더링 (이중 구현)

- <strong>Post Process 기반 Edge Detection</strong> — Depth/Normal 차이를 Custom Depth/Stencil과 SceneTexture로 검출하여 외곽선 생성
- <strong>Inverted Hull 방식</strong> — 메시의 노멀 방향으로 확장한 뒷면만 렌더링하는 전통적 아웃라인
- 두 방식의 장단점 비교 및 모바일 환경에서의 비용 분석

### 3. NPR 라이팅 기법

- <strong>Rim Lighting</strong> — Fresnel 기반 림라이트로 캐릭터 윤곽 강조
- <strong>Hatching / Halftone</strong> — 화면 공간 UV 기반 해칭 텍스처 매핑 또는 하프톤 패턴 적용
- <strong>그림자 색상 커스터마이징</strong> — 단순 어둡게가 아닌 보색/따뜻한 색으로 그림자를 표현하는 NPR 관습 반영

### 4. 모바일 최적화 고려

- SceneCapture 비용을 연출 구간에만 한정했던 기존 실무 경험을 활용한 GPU 비용 관리
- Post Process 패스 수 최소화 — 가능한 단일 패스에서 아웃라인 + 색상 양자화 처리
- Shading Model 분기 시 모바일 렌더러(ES3.1) 대응 여부 확인 및 Fallback 구현
- Material Quality Level 분기로 PC/모바일 품질 단계 분리

### 5. 기술 스택 상세

| 영역 | 기술 |
|------|------|
| 엔진 수정 | UE5 Custom Shading Model (엔진 소스 수정) |
| 셰이더 | HLSL — Custom Lighting, Edge Detection, Ramp Sampling |
| 머티리얼 | Post Process Material, Material Parameter Collection |
| 아웃라인 | Depth/Normal Edge Detection + Inverted Hull |
| NPR | Step Diffuse, Ramp Texture, Rim Light, Hatching |
| 최적화 | Mobile Shader Permutation, Quality Level 분기 |

## 📝배운 점

<div class="callout"><span class="ci">💡</span> <strong>UE5 렌더링 파이프라인 심층 이해</strong><br><br>엔진 소스 레벨에서 Shading Model을 추가하며 GBuffer 구성, Deferred Lighting 패스의 흐름, 그리고 Material Editor와 엔진 셰이더 코드가 어떻게 연결되는지를 실무적으로 학습했습니다.</div>

<div class="callout"><span class="ci">💡</span> <strong>HLSL 셰이더 작성 역량</strong><br><br>Custom Lighting Function과 Post Process 셰이더를 직접 HLSL로 작성하며, GPU 파이프라인에서의 데이터 흐름과 최적화 기법을 체득했습니다.</div>

<div class="callout"><span class="ci">💡</span> <strong>NPR과 모바일의 균형</strong><br><br>시각적 완성도와 모바일 성능 사이의 트레이드오프를 직접 프로파일링하며 판단하는 경험을 했습니다. 이는 실무에서 아트 디렉션의 요구와 기술적 제약을 조율하는 데 직접적으로 활용 가능합니다.</div>

## 관련 프로젝트 — 기존 셰이더/렌더링 경험

- <strong>It Takes Two 모작</strong> — Stencil Buffer 기반 Silhouette Shader, Computing Shader로 눈 위 궤적 생성 → [상세 보기](/side/ittakestwo/)
- <strong>Midnight Gallery</strong> — Compute Shader 기반 물 파동 상호작용 → [상세 보기](/side/midnight/)
- <strong>Sol (실무)</strong> — SceneCapture·RenderTarget 파이프라인, Material Parameter Collection 기반 GPU 렌더링 → [상세 보기](/projects/rendering-cinema/)
