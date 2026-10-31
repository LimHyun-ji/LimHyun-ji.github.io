---
layout: project
order: 7
title: "데이터 파이프라인 — Excel ↔ JSON 변환 기능 확장 (Python)"
role: "Tools / Pipeline"
period: "2023.02 — 현재 (상시)"
summary: "기획 Excel ↔ JSON 메타데이터 변환 파이프라인(Python)에 Cron식 변환 확장 · Unit 단위계 지원 · Custom Validation Script 지원을 추가."
tags: ["Python", "Data Pipeline", "Validation", "Cron", "Metadata"]
highlights:
  - "Python 기반 Excel ↔ JSON 메타데이터 변환 파이프라인 개선"
  - "Cron식 변환 확장 — 기존 Cron 변환에 한글 반복 일정(매일 · 매월 N일 · 주말 · 주중) 입력과 KR 시간 기준 저장 추가"
  - "Unit 단위계 지원 — 단위가 붙은 값을 파이프라인에서 일관된 단위로 처리"
  - "Custom Validation Script 지원 — 데이터별 검증 스크립트를 붙여 변환 단계에서 잘못된 값을 차단"
---

> **목적** — 기획이 Excel에 입력한 데이터를 사람이 다시 손보지 않고, 검증된 형태로 런타임 메타데이터까지 전달
>
> **성과** — 잘못된 데이터의 런타임 유입 차단, 기획 데이터 작성 편의성 향상
>
> **기여** — Python 변환 파이프라인에 Cron식 변환 확장 · Unit 단위계 · Custom Validation Script 기능 추가


## 문제 해결 요약

<div class="cases">
  <div class="case">
    <p class="case-title">잘못된 값의 런타임 유입</p>
    <dl>
      <dt>문제</dt><dd>잘못된 값 · 단위 착오가 변환을 거쳐 런타임까지 그대로 반영</dd>
      <dt>해결</dt><dd>Custom Validation Script + Unit 단위계로 변환 단계에서 검사</dd>
      <dt>결과</dt><dd>규칙에 맞지 않는 데이터를 변환 시점에 차단</dd>
    </dl>
    <a class="case-more" href="#case-validation">자세히 ↓</a>
  </div>
</div>


## 개요

- 기획 Excel 데이터를 JSON 메타데이터로 변환하는 **Python 데이터 파이프라인**
- 기존 변환 흐름 위에 **데이터 표현력**(Cron식 · 단위계)과 **데이터 무결성**(커스텀 검증) 기능을 추가
- 변환된 메타데이터는 런타임 `MetaDataSubsystem`이 `RidType` 키로 조회

<img class="diagram" src="/images/diagrams/data-pipeline-flow.svg" alt="데이터 파이프라인 자동화 흐름: 기획 Excel 데이터 입력 → Python 파이프라인이 Cron식 변환 · Unit 단위계 처리 → Custom Validation Script로 데이터별 검증(실패 시 차단) → 검증 통과 데이터만 JSON 메타데이터로 출력 → 런타임 MetaDataSubsystem이 RidType 키로 조회" />

## 구현 내용

- <strong>Cron식 변환 지원</strong>

  - 반복 일정(예: 특정 요일 · 시각마다 열리는 컨텐츠)을 기획은 Excel에서 `월수금 09:00:00` 같은 한글 표기로 입력
  - 파이프라인이 이를 Cron식(`초 분 시 일 월 요일`)으로 변환해 JSON에 반영 → 일정 데이터를 사람이 풀어서 적지 않아도 됨
  - <strong>한글 표기 ↔ Cron식 양방향 변환 (`UnitCron`)</strong>
    - `checkin`은 Excel 한글 표기 → Cron식, `checkout`은 Cron식 → 한글 표기
    - 팀의 단위 변환 구조(`unit_converter_map`의 `cron`) 위에서 아래 두 가지를 확장
  - <strong>KR 기준 시각으로 통일</strong>
    - 기존 변환은 KR → UTC로 바꾸면서 요일 인덱스를 날짜 차이만큼 밀어 저장
    - Cron식을 KR 로컬 시각 그대로 저장하도록 바꾸고, 런타임 `FDateTimeUtils::CronNext`의 결과 변환도 함께 수정
    - 상수 리셋 시각 · 월드보스 종료 시각 · 스케줄 스폰 시각 등 기존 데이터의 Cron식도 KR 기준으로 변환
  - <strong>표기 확장 — 매일 · 매월 · 주말 · 주중</strong>
    - 요일 없이 시각만 쓰면 매일(`* * *`), `매월 N일`은 일(day) 필드, `주말` / `주중`은 `6,0` / `1,2,3,4,5`로 변환
    - 역변환 시 요일 집합이 주말 · 주중과 같으면 다시 그 단어로 표시 (`frozenset` 비교)
    - 데이터의 `* * 1,2,3,4,5,6,0` 같은 요일 나열을 `* * *`로 정리

      ```python
      # unit_lib.py — UnitCron.checkin: 한글 표기 → Cron식
      day_pattern = r'(매월\s*(\d{1,2})일|[월화수목금토일]+|주말|주중)'
      pattern = rf'^(?:{day_pattern}\s+)?([01]?[0-9]|2[0-3]):([0-5]?[0-9]):([0-5]?[0-9])'
      m = re.fullmatch(pattern, _kr_cron)
      t = time(hour=int(m.group(3)), minute=int(m.group(4)), second=int(m.group(5)))
      hms = f'{t.second} {t.minute} {t.hour}'

      if m.group(2) is not None:                      # "매월 15일 05:00:00"
          cron = f'{hms} {int(m.group(2))} * *'
      elif m.group(1) is None:                        # "05:00:00" → 매일
          cron = f'{hms} * * *'
      elif m.group(1) in UnitCron.SPECIAL_DAY_MAP:    # "주말" → 6,0 / "주중" → 1,2,3,4,5
          cron = f'{hms} * * {UnitCron.SPECIAL_DAY_MAP[m.group(1)]}'
      else:                                           # "월수금" → 1,3,5
          days = ",".join(str(UnitCron.krweek_val_array.index(d)) for d in m.group(1))
          cron = f'{hms} * * {days}'
      ```

- <strong>Unit 단위계 지원</strong>

  - 단위가 붙은 값을 파이프라인에서 인식해 일관된 단위로 처리
  - 기획은 읽기 쉬운 단위로 입력하고, 런타임은 정해진 단위의 값만 받음 → 단위 착오로 인한 데이터 오류 감소
  - <strong>단위 클래스 = checkin / checkout 한 쌍</strong>
    - 단위마다 Excel → JSON(`checkin`)과 JSON → Excel(`checkout`) 변환을 한 클래스에 둠
    - 처음 구현한 단위: 기간(`1d 2h 30m` ↔ ms) · 퍼센트(10억 배율 정수 ↔ Excel 퍼센트 서식) · 시각(KR ↔ UTC) · 거리(`3m 20cm` ↔ cm)
    - 이후 팀에서 한글 단위 표기 · 음수 거리 · 무게 · Cron 등으로 확장 (`unit_converter_map`에 등록)
  - <strong>열 단위 / 값 단위 적용</strong>
    - 지정한 열 전체를 변환하는 방식과, 종류 열의 값에 따라 해당 행만 변환하는 방식 두 가지
    - 예: 같은 값 열이라도 종류가 퍼센트인 행만 퍼센트로 변환
    - 퍼센트로 바뀐 셀 위치를 모아 두었다가 Excel 생성 시 퍼센트 서식을 적용

<div id="case-validation" class="case-anchor"></div>

- <strong>Custom Validation Script 지원</strong>

  - 변환 단계에 데이터별 규칙을 검사하는 장치가 없으면, 잘못된 값이 JSON으로 변환되어 런타임까지 그대로 들어감
  - 테이블별 Python 스크립트(`MetaData/Script/<테이블>.py`)에 검증 함수를 두면 검증 단계에서 자동으로 실행 → 규칙에 맞지 않는 데이터를 걸러냄
  - 단위 착오는 Unit 단위계 지원으로 함께 줄임
  - <strong>스키마 확장 키워드로 연결</strong>
    - 스키마 로드 시 `properties`가 있는 모든 object 스키마에 커스텀 검증 키워드를 기본값 true로 주입
    - `jsonschema` Draft 2020-12 검증기에 이 키워드 처리기를 등록 → object마다 테이블 스크립트를 경로로 import해 검증 함수를 호출
    - 반환된 `ValidationError`는 일반 스키마 오류와 함께 수집되고, 스크립트나 함수가 없으면 아무 일도 하지 않음 → 필요한 테이블에만 스크립트 추가

      ```python
      # utils/schema.py — properties가 있는 object 스키마마다 키워드 기본값 주입
      def __insert_custom_validate_instance_properties(schema_json_content):
          if not isinstance(schema_json_content, dict):
              return
          if schema_json_content.get('type') == 'object' and 'properties' in schema_json_content \
                  and 'validate_instance_custom' not in schema_json_content:
              schema_json_content['validate_instance_custom'] = True
          for schema_object in schema_json_content:
              __insert_custom_validate_instance_properties(schema_json_content[schema_object])

      # validator.py — 키워드 처리기: 테이블 스크립트를 경로로 import해 호출 (공용 lib 경로 등록은 생략)
      def __validate_instance_custom(_data_uri, _validator, _value, _instance, _schema):
          if _value is True:
              path = (defines.SCRIPT_ROOT / _data_uri).with_suffix('.py')
              script_module = import_by_path(path)
              if script_module and hasattr(script_module, 'validate_instance'):
                  yield from script_module.validate_instance(_instance, _schema)
      ```

    - 이후 팀에서 테이블 전체를 한 번에 검사하는 `validate()` 훅이 추가되어, 행 단위 · 테이블 단위 두 가지로 사용
  - <strong>테이블별 규칙 예</strong>
    - `DatePeriod` — `start_datetime`이 `end_datetime`보다 늦으면 실패
    - `NpcShopGoods` — 판매 기간이 노출 기간 안에 포함되지 않으면 실패 (`DatePeriod` 테이블을 조회해 비교, 현재는 공용 검증 모듈로 이동)
    - `RetentionReward` — 보상 경험치가 `PcExperienceReward`의 최대 경험치를 넘으면 실패

- <strong>런타임 연결 — MetaDataSubsystem</strong>

  - 변환된 메타데이터 테이블을 런타임 `MetaDataSubsystem`이 제공, 컨텐츠 Manager들이 `RidType` 키로 조회
  - 테이블은 `SOL_METADATA_TABLE_TYPE(테이블, 키 타입, 구조체)` 매크로로 선언하며, 키는 `RidType` 외에 `FName` · enum · 복합 키(`TPair` / `TTuple`)도 사용
  - 담당 컨텐츠의 테이블(리텐션 보상 · 재화 등급 · 스케줄 스폰 시각 · 세금 · 랭크 등)을 이 구조에 추가
  - 에디터 툴의 export 결과도 같은 경로로 유입
    - 레벨 · 스폰 데이터 → [AreaTool 페이지](/projects/areatool/)
    - VisualData 매핑 · 액션 메타데이터 → [VisualData 에디터 & Commandlet 페이지](/projects/visualdata-editor/)
