# -*- coding: utf-8 -*-
"""툴 페이지(AreaTool 등) 전용 다이어그램. gen_diagrams.py의 N/emit을 재사용한다."""
import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gen_diagrams import N, emit, emit_seq   # importing re-emits existing diagrams; that's fine

# ── AreaTool: SaveAndReconcile — 파일 단위 비교 후 소스 컨트롤 작업 분류 ──
rc_nodes = [
    N("exp",   "Export 결과\n파일 경로별 JSON 배열",                     40, 64, 230, 52, "ui"),
    N("exist", "기존 파일 목록\nLevel/ · Region/ 하위 *.json",           40, 196, 230, 52, "data"),
    N("cmp",   "파일별 비교\n기존 파일 문자열 == 직렬화 결과?",           330, 64, 250, 56, "core"),
    N("del",   "Export에 없는 기존 파일\n→ FDelete",                    330, 196, 250, 52, "entity"),
    N("same",  "동일 → 건너뜀\n(체크아웃 · 저장 없음)",                  650, 40, 230, 48, "data"),
    N("edit",  "내용 변경 → FCheckOut 후 저장",                         650, 112, 230, 40, "manager"),
    N("add",   "새 파일 → 저장 후 FMarkForAdd",                         650, 176, 230, 40, "manager"),
]
rc_edges = [
    dict(src="exp", dst="cmp"),
    dict(src="exist", dst="del"),
    dict(src="cmp", dst="same"),
    dict(src="cmp", dst="edit"),
    dict(src="cmp", dst="add"),
]
emit("areatool-reconcile", "AreaTool Export — SaveAndReconcile 파일 분류", rc_nodes, rc_edges)
