# -*- coding: utf-8 -*-
"""퍼포먼스 / VisualData 페이지 보강용 다이어그램 (gen_diagrams.py 헬퍼 재사용)."""
import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gen_diagrams import N, emit, emit_seq   # importing re-emits existing diagrams; that's fine

# ═══════════════════════════════════════════════════════════════
# VisualData AssetMigration — 슈퍼클래스 에셋 → 타입별 클래스 에셋
# (CL 134885 코드 전환 · 134886 에셋 생성/참조 교체 · 134894 클래스 삭제 · 134895 구 에셋 삭제)
# ═══════════════════════════════════════════════════════════════
mig_nodes = [
    N("old",   "구 에셋 · UVisualGameData\n전 타입 필드가 한 클래스에 모임\nGameAsset/VisualData",   20, 70, 250, 74, "data"),
    N("tool",  "VisualData Migration\n에디터 메뉴 → 타입별 변환",                                  320, 76, 230, 62, "manager"),
    N("new",   "신 에셋 · 타입별 클래스\nGameAsset/VisualDataAsset",                               600, 76, 230, 62, "entity"),
    N("meta",  "Metadata 에셋\nVisualGameDataAsset 참조 교체",                                      870, 196, 230, 62, "data"),
    N("base",  "UVisualGameDataBase\nUVisualGameData_PC · _GodArmor · _Npc\n_Spirit · _Item · _FieldObject", 300, 300, 290, 74, "core"),
    N("fact",  "UVisualGameDataFactory\n생성 타입 → 클래스 매핑",                                    20, 432, 250, 58, "manager"),
    N("exp",   "FVisualDataExport\nUVisualGameDataBase 필터 · 클래스 프로퍼티 export",              330, 432, 330, 58, "manager"),
    N("del",   "구 클래스 · 구 에셋 삭제",                                                           20, 196, 250, 50, "data"),
]
mig_edges = [
    dict(src="old",  dst="tool", label="읽기"),
    dict(src="tool", dst="new",  label="타입별 생성"),
    dict(src="new",  dst="meta", label="참조"),
    dict(src="old",  dst="del",  label="이전 후", dashed=True),
    dict(src="base", dst="fact", label="신규 생성"),
    dict(src="base", dst="exp",  label="JSON export"),
    dict(src="new",  dst="base", label="인스턴스"),
]
emit("visualdata-migration", "VisualData AssetMigration — 슈퍼클래스 에셋 → 타입별 클래스 에셋", mig_nodes, mig_edges)
