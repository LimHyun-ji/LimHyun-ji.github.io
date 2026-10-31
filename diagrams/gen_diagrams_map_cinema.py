# -*- coding: utf-8 -*-
"""맵 설계 페이지 보조 다이어그램 (월드맵 입력 흐름 · 맵 뷰어 Strategy 구조).
gen_diagrams.py의 N / emit을 재사용한다. (import 시 기존 다이어그램도 다시 출력됨)
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gen_diagrams import N, emit

# ── 월드맵 입력: FSolWidgetInputProcessor → URegionMapWidget ──
wi_nodes = [
    N("slate",  "FSlateApplication\n입력 전처리기 등록",            20, 60, 190, 52, "core"),
    N("proc",   "FSolWidgetInputProcessor\n터치 · 마우스 판별",      310, 60, 230, 52, "manager"),
    N("zoom",   "OnZoom\n핀치 거리 변화 · 휠",                       20, 170, 190, 52, "data"),
    N("drag",   "OnDrag\n한 손가락 · 마우스 누름 이동",              290, 170, 230, 52, "data"),
    N("click",  "OnClick\n이동 8px 이하 · 핀치 아님",                560, 170, 200, 52, "data"),
    N("region", "URegionMapWidget\nZoom() · Drag()",                 150, 280, 230, 52, "ui"),
    N("adjust", "GetAdjustMapPos\n줌 · DPI 기준 이동 범위 Clamp",    490, 280, 250, 52, "accent"),
    N("apply",  "SetAdjustMapPos\nRenderTranslation · Scale 보간",   490, 380, 250, 52, "ui"),
]
wi_edges = [
    dict(src="slate", dst="proc", label="PreProcess"),
    dict(src="proc", dst="zoom"),
    dict(src="proc", dst="drag"),
    dict(src="proc", dst="click"),
    dict(src="zoom", dst="region"),
    dict(src="drag", dst="region"),
    dict(src="region", dst="adjust", label="목표 위치"),
    dict(src="adjust", dst="apply", label="Tick마다"),
]
emit("worldmap-input", "월드맵 입력 — FSolWidgetInputProcessor → URegionMapWidget", wi_nodes, wi_edges)

# ── 맵 뷰어 Strategy: 공유 쉘 + 타입별 Strategy ──
ms_nodes = [
    N("screen",  "UWorldMapScreen\nRegion · EMapViewerType 지정",   20, 60, 230, 52, "ui"),
    N("shell",   "URegionMapWidget (공유 쉘)\n줌 · 드래그 · 아이콘 · 입력", 290, 60, 280, 52, "core"),
    N("base",    "UMapViewerStrategy\n타입별로 달라지는 부분만",      300, 170, 260, 52, "manager"),
    N("world",   "UWorldMapViewerStrategy\nWorldMapImage · 확대/드래그 허용", 120, 280, 280, 56, "entity"),
    N("dungeon", "UDungeonMapViewerStrategy\nMiniMapImage · 고정 배율 · 정보 패널", 440, 280, 290, 56, "entity"),
]
ms_edges = [
    dict(src="screen", dst="shell", label="Update()"),
    dict(src="shell", dst="base", label="ViewerType 매칭"),
    dict(src="base", dst="world", dashed=True),
    dict(src="base", dst="dungeon", dashed=True),
]
emit("mapdesign-strategy", "맵 뷰어 Strategy — View 공유 · 데이터 소스만 교체", ms_nodes, ms_edges)
