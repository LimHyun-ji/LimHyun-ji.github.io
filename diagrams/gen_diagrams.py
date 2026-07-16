# -*- coding: utf-8 -*-
"""
Sol 클라이언트 아키텍처 다이어그램 생성기.
하나의 스펙(nodes/edges)에서 .drawio(편집용)와 .svg(사이트 임베드용)를 동시에 출력.
- 코드 분석 기반: 실제 클래스명(USolGeoSubsystem, UVisualDataModuleComponent, FSolWidgetInputProcessor 등)
- SVG는 라이트/다크 페이지 어디에 올려도 동일하게 보이는 self-contained 'figure card' 스타일
"""
import os, html

OUT_DRAWIO = os.path.dirname(os.path.abspath(__file__))
OUT_SVG = os.path.join(OUT_DRAWIO, "..", "public", "images", "diagrams")
os.makedirs(OUT_SVG, exist_ok=True)

# ── 팔레트 (클래스별 fill/stroke) ─────────────────────────────
PAL = {
    "server": ("#e8f1ff", "#4a80c8"),
    "core":   ("#dbe9ff", "#3b6fb0"),
    "manager":("#e3f5ee", "#2fa37a"),
    "entity": ("#fdeede", "#d9822b"),
    "ui":     ("#efe8fb", "#7c5cc4"),
    "data":   ("#eef2f7", "#64748b"),
    "accent": ("#7db4ff", "#2f6bd6"),
}
TEXT = "#1e293b"
EDGE = "#7787a2"
CARD_BG = "#ffffff"
CARD_BORDER = "#e2e8f0"
TITLE = "#0f172a"

# drawio 스타일 매핑
def drawio_style(cls):
    fill, stroke = PAL[cls]
    return f"rounded=1;whiteSpace=wrap;html=1;fillColor={fill};strokeColor={stroke};fontColor={TEXT};fontSize=12;arcSize=12;"

def esc(s):
    return html.escape(s, quote=True)

# ── SVG 렌더 ──────────────────────────────────────────────────
def svg_node(n):
    fill, stroke = PAL[n["cls"]]
    x, y, w, h = n["x"], n["y"], n["w"], n["h"]
    lines = n["label"].split("\n")
    # 폰트: 첫 줄 강조, 나머지 보조
    ts = []
    total = len(lines)
    line_h = 15
    start_y = y + h/2 - (total-1)*line_h/2 + 4
    for i, ln in enumerate(lines):
        weight = "600" if i == 0 else "400"
        size = "12.5" if i == 0 else "11"
        fill_t = TEXT if i == 0 else "#475569"
        ts.append(f'<text x="{x+w/2:.1f}" y="{start_y+i*line_h:.1f}" text-anchor="middle" '
                  f'font-size="{size}" font-weight="{weight}" fill="{fill_t}">{esc(ln)}</text>')
    return (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="9" ry="9" '
            f'fill="{fill}" stroke="{stroke}" stroke-width="1.5"/>' + "".join(ts))

def rect_of(nodes, nid):
    for n in nodes:
        if n["id"] == nid:
            return n
    raise KeyError(nid)

def svg_edge(nodes, e):
    S = rect_of(nodes, e["src"]); D = rect_of(nodes, e["dst"])
    scx, scy = S["x"]+S["w"]/2, S["y"]+S["h"]/2
    dcx, dcy = D["x"]+D["w"]/2, D["y"]+D["h"]/2
    Sb, St, Sl, Sr = S["y"]+S["h"], S["y"], S["x"], S["x"]+S["w"]
    Db, Dt, Dl, Dr = D["y"]+D["h"], D["y"], D["x"], D["x"]+D["w"]
    if Dt >= Sb - 2:      # 아래로
        sx, sy, ex, ey = scx, Sb, dcx, Dt; mid = (Sb+Dt)/2
        d = f"M {sx:.1f} {sy:.1f} L {sx:.1f} {mid:.1f} L {ex:.1f} {mid:.1f} L {ex:.1f} {ey:.1f}"
        lx, ly = (sx+ex)/2, mid
    elif Db <= St + 2:    # 위로
        sx, sy, ex, ey = scx, St, dcx, Db; mid = (St+Db)/2
        d = f"M {sx:.1f} {sy:.1f} L {sx:.1f} {mid:.1f} L {ex:.1f} {mid:.1f} L {ex:.1f} {ey:.1f}"
        lx, ly = (sx+ex)/2, mid
    elif Dl >= Sr - 2:    # 오른쪽
        sx, sy, ex, ey = Sr, scy, Dl, dcy; mid = (Sr+Dl)/2
        d = f"M {sx:.1f} {sy:.1f} L {mid:.1f} {sy:.1f} L {mid:.1f} {ey:.1f} L {ex:.1f} {ey:.1f}"
        lx, ly = mid, (sy+ey)/2
    elif Dr <= Sl + 2:    # 왼쪽
        sx, sy, ex, ey = Sl, scy, Dr, dcy; mid = (Sl+Dr)/2
        d = f"M {sx:.1f} {sy:.1f} L {mid:.1f} {sy:.1f} L {mid:.1f} {ey:.1f} L {ex:.1f} {ey:.1f}"
        lx, ly = mid, (sy+ey)/2
    else:                 # 대각 fallback
        sx, sy, ex, ey = scx, Sb, dcx, Dt
        d = f"M {sx:.1f} {sy:.1f} L {ex:.1f} {ey:.1f}"
        lx, ly = (sx+ex)/2, (sy+ey)/2
    dash = ' stroke-dasharray="5 4"' if e.get("dashed") else ""
    out = f'<path d="{d}" fill="none" stroke="{EDGE}" stroke-width="1.5"{dash} marker-end="url(#arrow)"/>'
    if e.get("label"):
        lab = e["label"]; tw = len(lab)*6.6 + 8
        out += (f'<rect x="{lx-tw/2:.1f}" y="{ly-9:.1f}" width="{tw:.1f}" height="17" rx="4" '
                f'fill="{CARD_BG}" opacity="0.92"/>'
                f'<text x="{lx:.1f}" y="{ly+3.5:.1f}" text-anchor="middle" font-size="10.5" fill="#475569">{esc(lab)}</text>')
    return out

def build_svg(title, nodes, edges):
    maxx = max(n["x"]+n["w"] for n in nodes) + 24
    maxy = max(n["y"]+n["h"] for n in nodes) + 20
    W, H = maxx, maxy
    parts = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" font-family="Inter, \'Malgun Gothic\', sans-serif">']
    parts.append('<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">'
                 f'<path d="M 0 0 L 10 5 L 0 10 z" fill="{EDGE}"/></marker></defs>')
    parts.append(f'<rect x="0.5" y="0.5" width="{W-1}" height="{H-1}" rx="14" fill="{CARD_BG}" stroke="{CARD_BORDER}"/>')
    parts.append(f'<text x="20" y="30" font-size="14" font-weight="700" fill="{TITLE}">{esc(title)}</text>')
    for e in edges:
        parts.append(svg_edge(nodes, e))
    for n in nodes:
        parts.append(svg_node(n))
    parts.append("</svg>")
    return "\n".join(parts)

# ── drawio 렌더 ───────────────────────────────────────────────
def build_drawio(name, nodes, edges):
    cells = ['<mxCell id="0"/>', '<mxCell id="1" parent="0"/>']
    for n in nodes:
        val = esc(n["label"].replace("\n", "&#10;"))
        cells.append(f'<mxCell id="{n["id"]}" value="{val}" style="{drawio_style(n["cls"])}" vertex="1" parent="1">'
                     f'<mxGeometry x="{n["x"]}" y="{n["y"]}" width="{n["w"]}" height="{n["h"]}" as="geometry"/></mxCell>')
    for i, e in enumerate(edges):
        dashed = "dashed=1;" if e.get("dashed") else ""
        style = f"edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;endArrow=block;strokeColor={EDGE};{dashed}fontSize=10;fontColor=#475569;"
        lab = esc(e.get("label", ""))
        cells.append(f'<mxCell id="e{i}" value="{lab}" style="{style}" edge="1" parent="1" '
                     f'source="{e["src"]}" target="{e["dst"]}"><mxGeometry relative="1" as="geometry"/></mxCell>')
    body = "".join(cells)
    return (f'<mxfile host="app.diagrams.net"><diagram name="{esc(name)}">'
            f'<mxGraphModel dx="900" dy="600" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" '
            f'arrows="1" fold="1" page="1" pageScale="1" pageWidth="1100" pageHeight="800" math="0" shadow="0">'
            f'<root>{body}</root></mxGraphModel></diagram></mxfile>')

def emit(slug, title, nodes, edges):
    with open(os.path.join(OUT_SVG, slug + ".svg"), "w", encoding="utf-8") as f:
        f.write(build_svg(title, nodes, edges))
    with open(os.path.join(OUT_DRAWIO, slug + ".drawio"), "w", encoding="utf-8") as f:
        f.write(build_drawio(title, nodes, edges))
    print("emitted", slug)

# ═══════════════════════════════════════════════════════════════
# D1. Sol 클라이언트 전체 아키텍처
# ═══════════════════════════════════════════════════════════════
def N(id, label, x, y, w, h, cls): return dict(id=id, label=label, x=x, y=y, w=w, h=h, cls=cls)

d1_nodes = [
    N("tcp",  "게임 서버 · TCP\nNetworkClient",        130, 64, 220, 52, "server"),
    N("ws",   "Noti 서버 · WebSocket\nNetworkNotiClient", 400, 64, 240, 52, "server"),
    N("geo",  "USolGeoSubsystem\nTCP 수신 · Noti 리스너 · Protobuf", 250, 168, 340, 58, "core"),
    N("meta", "MetaDataSubsystem\nRidType 키",          40, 168, 180, 58, "data"),
    N("mgr",  "Feature Managers\nUGuildManager · UTravelManager …\nUSolGameInstanceSubsystem + INetworkNotiClientListener",
              190, 286, 460, 72, "manager"),
    N("vis",  "UVisualDataModuleComponent\n전 엔티티 외형·전투 데이터",  60, 408, 300, 56, "entity"),
    N("ui",   "UPrimaryGameLayout\nCommonUI 레이어 스택",              480, 408, 300, 56, "ui"),
]
d1_edges = [
    dict(src="tcp", dst="geo", label="패킷"),
    dict(src="ws", dst="geo", label="Noti"),
    dict(src="geo", dst="mgr", label="수신"),
    dict(src="meta", dst="mgr", label="메타데이터"),
    dict(src="mgr", dst="vis", label="외형·전투"),
    dict(src="mgr", dst="ui", label="델리게이트"),
]
emit("sol-architecture", "Sol 클라이언트 아키텍처 — 서버 · 코어 · 매니저 · 표현", d1_nodes, d1_edges)

# ═══════════════════════════════════════════════════════════════
# D2. VisualData 데이터 흐름
# ═══════════════════════════════════════════════════════════════
d2_nodes = [
    N("vgd",  "VisualGameData\n액션·전투 데이터",          60, 64, 200, 54, "data"),
    N("comp", "UVisualDataModuleComponent\n전 엔티티 공통", 320, 64, 260, 54, "entity"),
    N("mod",  "타입별 모듈\nPC · NPC · Spirit · Item …",    320, 158, 260, 54, "core"),
    N("load", "비동기 로드\nStreamableManager",             60, 158, 200, 54, "core"),
    N("rule", "전이 규칙\nFull / Partial / No",             60, 252, 200, 54, "manager"),
    N("apply","파츠·어태치먼트·FX 적용",                    320, 252, 260, 54, "manager"),
    N("vis",  "로드 완료 → EntityVisibility 표시",          320, 346, 260, 50, "ui"),
    N("evt",  "전투/액션 이벤트",                           60, 346, 200, 50, "server"),
]
d2_edges = [
    dict(src="vgd", dst="comp", label="세팅"),
    dict(src="comp", dst="mod", label="생성"),
    dict(src="mod", dst="load", label="에셋"),
    dict(src="load", dst="rule"),
    dict(src="rule", dst="apply", label="갱신 범위"),
    dict(src="apply", dst="vis"),
    dict(src="evt", dst="mod", label="OnEvent", dashed=True),
]
emit("visualdata-flow", "VisualData — 데이터 → 모듈 → 부분 갱신 → 표시", d2_nodes, d2_edges)

# ═══════════════════════════════════════════════════════════════
# D4. 인게임 연출 파이프라인
# ═══════════════════════════════════════════════════════════════
d4_nodes = [
    N("trig", "연출 트리거\n룰렛 · 주사위 · 퀘스트",   60, 150, 200, 56, "server"),
    N("pl",   "PocketLevel Instance\n인게임과 분리된 공간", 320, 64, 250, 56, "core"),
    N("seq",  "LevelSequenceActor\n런타임 생성 + binding",  320, 158, 250, 56, "core"),
    N("cap",  "SceneCapture2D → RenderTarget",             320, 252, 250, 50, "entity"),
    N("uic",  "UI 위젯에 합성",                            630, 252, 190, 50, "ui"),
    N("end",  "연출 종료 → Actor 파괴 · 캡처 off",         320, 346, 250, 50, "manager"),
]
d4_edges = [
    dict(src="trig", dst="pl"),
    dict(src="pl", dst="seq", label="레벨 구성"),
    dict(src="seq", dst="cap", label="SoftObjectPtr 로드"),
    dict(src="cap", dst="uic", label="3D→UI"),
    dict(src="seq", dst="end", dashed=True),
]
emit("cinema-pipeline", "인게임 연출 — PocketLevel · Sequence · SceneCapture", d4_nodes, d4_edges)

print("\nDONE. SVG →", os.path.normpath(OUT_SVG), "| drawio →", os.path.normpath(OUT_DRAWIO))
