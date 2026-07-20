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

# ── 시퀀스 다이어그램 (participants + 순서 있는 messages) ─────────
# participants: [label, ...]  (left→right)
# messages: [{"frm","to","label","ret"(bool)}]
HEAD_Y, HEAD_H, MSG_TOP, MSG_STEP = 52, 38, 108, 46

def _seq_layout(participants):
    xs, cx, boxes = 24, [], []
    for p in participants:
        w = max(int(len(p) * 8.6) + 26, 118)
        boxes.append((xs, w)); cx.append(xs + w / 2); xs += w + 34
    return boxes, cx, xs + 24  # boxes, centers, total width

def seq_svg(title, participants, messages):
    boxes, cx, W = _seq_layout(participants)
    H = MSG_TOP + max(1, len(messages)) * MSG_STEP + 28
    life_bottom = H - 20
    P = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" font-family="Inter, \'Malgun Gothic\', sans-serif">']
    P.append('<defs>'
             f'<marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="{EDGE}"/></marker>'
             f'<marker id="arrowo" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M 0 1 L 9 5 L 0 9" fill="none" stroke="{EDGE}" stroke-width="1.3"/></marker>'
             '</defs>')
    P.append(f'<rect x="0.5" y="0.5" width="{W-1}" height="{H-1}" rx="14" fill="{CARD_BG}" stroke="{CARD_BORDER}"/>')
    P.append(f'<text x="20" y="30" font-size="14" font-weight="700" fill="{TITLE}">{esc(title)}</text>')
    # lifelines
    for c in cx:
        P.append(f'<line x1="{c:.1f}" y1="{HEAD_Y+HEAD_H}" x2="{c:.1f}" y2="{life_bottom}" stroke="{CARD_BORDER}" stroke-width="1.3" stroke-dasharray="4 5"/>')
    # participant headers
    fill, stroke = PAL["core"]
    for (x, w), p in zip(boxes, participants):
        P.append(f'<rect x="{x}" y="{HEAD_Y}" width="{w}" height="{HEAD_H}" rx="8" fill="{fill}" stroke="{stroke}" stroke-width="1.5"/>')
        P.append(f'<text x="{x+w/2:.1f}" y="{HEAD_Y+HEAD_H/2+4:.1f}" text-anchor="middle" font-size="12" font-weight="600" fill="{TEXT}">{esc(p)}</text>')
    # messages
    for i, m in enumerate(messages):
        y = MSG_TOP + i * MSG_STEP
        a = participants.index(m["frm"]); b = participants.index(m["to"])
        ret = m.get("ret"); dash = ' stroke-dasharray="6 4"' if ret else ""
        mk = "url(#arrowo)" if ret else "url(#arrow)"
        if a == b:  # self message loop
            x = cx[a]
            P.append(f'<path d="M {x:.1f} {y:.1f} h 46 v 20 h -46" fill="none" stroke="{EDGE}" stroke-width="1.4"{dash} marker-end="{mk}"/>')
            P.append(f'<text x="{x+54:.1f}" y="{y+3:.1f}" font-size="10.5" fill="#475569">{esc(m["label"])}</text>')
        else:
            x1, x2 = cx[a], cx[b]
            P.append(f'<line x1="{x1:.1f}" y1="{y:.1f}" x2="{x2:.1f}" y2="{y:.1f}" stroke="{EDGE}" stroke-width="1.4"{dash} marker-end="{mk}"/>')
            P.append(f'<text x="{(x1+x2)/2:.1f}" y="{y-6:.1f}" text-anchor="middle" font-size="10.5" fill="#475569">{esc(m["label"])}</text>')
    P.append("</svg>")
    return "\n".join(P)

def seq_drawio(name, participants, messages):
    boxes, cx, W = _seq_layout(participants)
    H = MSG_TOP + max(1, len(messages)) * MSG_STEP + 28
    life_bottom = H - 20
    fill, stroke = PAL["core"]
    cells = ['<mxCell id="0"/>', '<mxCell id="1" parent="0"/>']
    for i, ((x, w), p) in enumerate(zip(boxes, participants)):
        cells.append(f'<mxCell id="p{i}" value="{esc(p)}" style="rounded=1;whiteSpace=wrap;html=1;fillColor={fill};strokeColor={stroke};fontColor={TEXT};fontSize=12;" vertex="1" parent="1"><mxGeometry x="{x}" y="{HEAD_Y}" width="{w}" height="{HEAD_H}" as="geometry"/></mxCell>')
        c = cx[i]
        cells.append(f'<mxCell id="l{i}" style="endArrow=none;dashed=1;html=1;strokeColor={CARD_BORDER};" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="{c:.0f}" y="{HEAD_Y+HEAD_H}" as="sourcePoint"/><mxPoint x="{c:.0f}" y="{life_bottom:.0f}" as="targetPoint"/></mxGeometry></mxCell>')
    for i, m in enumerate(messages):
        y = MSG_TOP + i * MSG_STEP
        a = participants.index(m["frm"]); b = participants.index(m["to"])
        ret = m.get("ret")
        style = f"html=1;endArrow={'open' if ret else 'block'};{'dashed=1;' if ret else ''}strokeColor={EDGE};fontSize=10;fontColor=#475569;"
        if a == b:
            x = cx[a]
            cells.append(f'<mxCell id="m{i}" value="{esc(m["label"])}" style="{style}" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="{x:.0f}" y="{y}" as="sourcePoint"/><mxPoint x="{x+46:.0f}" y="{y+20}" as="targetPoint"/></mxGeometry></mxCell>')
        else:
            cells.append(f'<mxCell id="m{i}" value="{esc(m["label"])}" style="{style}" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="{cx[a]:.0f}" y="{y}" as="sourcePoint"/><mxPoint x="{cx[b]:.0f}" y="{y}" as="targetPoint"/></mxGeometry></mxCell>')
    body = "".join(cells)
    return (f'<mxfile host="app.diagrams.net"><diagram name="{esc(name)}">'
            f'<mxGraphModel dx="900" dy="600" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" '
            f'arrows="1" fold="1" page="1" pageScale="1" pageWidth="1100" pageHeight="850" math="0" shadow="0">'
            f'<root>{body}</root></mxGraphModel></diagram></mxfile>')

def emit_seq(slug, title, participants, messages):
    with open(os.path.join(OUT_SVG, slug + ".svg"), "w", encoding="utf-8") as f:
        f.write(seq_svg(title, participants, messages))
    with open(os.path.join(OUT_DRAWIO, slug + ".drawio"), "w", encoding="utf-8") as f:
        f.write(seq_drawio(title, participants, messages))
    print("emitted (seq)", slug)

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
]
d1_edges = [
    dict(src="tcp", dst="geo", label="패킷"),
    dict(src="ws", dst="geo", label="Noti"),
    dict(src="geo", dst="mgr", label="수신"),
    dict(src="meta", dst="mgr", label="메타데이터"),
]
emit("sol-architecture", "Sol 클라이언트 아키텍처 — 서버 · 코어 · 매니저", d1_nodes, d1_edges)

# ═══════════════════════════════════════════════════════════════
# D2. VisualData 데이터 흐름
# ═══════════════════════════════════════════════════════════════
vd_nodes = [
    N("vgd",   "VisualGameData\n액션·전투 데이터",                        40, 66, 210, 56, "data"),
    N("comp",  "UVisualDataModuleComponent\n전 엔티티 부착",              300, 66, 280, 58, "entity"),
    N("parts", "파츠 SkeletalMesh 맵\nMaster·Face·Torso·Helmet·Wing·Cape", 630, 60, 250, 66, "data"),
    N("base",  "FVisualDataModuleBase\n경량 TSharedPtr · ModuleCast RTTI", 300, 182, 280, 56, "core"),
    N("pc",    "FVisualDataModulePC",                                     170, 296, 210, 50, "core"),
    N("others","NPC · Spirit · Item · FieldObject · Totem 모듈",           430, 296, 300, 50, "core"),
    N("attach","FPCModuleAttachment\nWeapon · Armor · Helmet (소켓)",      170, 400, 250, 56, "manager"),
]
vd_edges = [
    dict(src="vgd", dst="comp", label="세팅"),
    dict(src="comp", dst="parts", label="TMap"),
    dict(src="comp", dst="base", label="현재 모듈 보유"),
    dict(src="base", dst="pc", label="상속"),
    dict(src="base", dst="others", label="상속"),
    dict(src="pc", dst="attach", label="소켓 부착"),
]
emit("visualdata-flow", "VisualData — 컴포넌트 · 타입별 모듈 · 어태치먼트 구조", vd_nodes, vd_edges)

# ═══════════════════════════════════════════════════════════════
# D4. 인게임 연출 파이프라인
# ═══════════════════════════════════════════════════════════════
emit_seq("cinema-pipeline", "인게임 연출 — 별자리 룰렛/순례 연출 라이프사이클",
  ["CinemaConstellationManager", "CineConstellationRoulette", "PocketLevelSubsystem", "ALevelSequenceActor", "SceneCapture2D"],
  [
    {"frm":"CinemaConstellationManager","to":"PocketLevelSubsystem","label":"SpawnPocketLevel (연출 공간 구성)"},
    {"frm":"CinemaConstellationManager","to":"CineConstellationRoulette","label":"Appear(PointRid) 트리거"},
    {"frm":"CineConstellationRoulette","to":"CinemaConstellationManager","label":"CreateLevelSeqActor(SoftObjectPtr)"},
    {"frm":"CinemaConstellationManager","to":"ALevelSequenceActor","label":"SetSequence(LoadSynchronous) 비동기"},
    {"frm":"CineConstellationRoulette","to":"ALevelSequenceActor","label":"Play() (PlaySequence)"},
    {"frm":"SceneCapture2D","to":"SceneCapture2D","label":"SetVisibility(true) → RenderTarget → UI 합성"},
    {"frm":"ALevelSequenceActor","to":"CineConstellationRoulette","label":"OnFinished","ret":True},
    {"frm":"CineConstellationRoulette","to":"CinemaConstellationManager","label":"DestroyLevelSeqActors()"},
    {"frm":"CinemaConstellationManager","to":"ALevelSequenceActor","label":"Stop() + Destroy() (메모리 해제)"},
    {"frm":"SceneCapture2D","to":"SceneCapture2D","label":"SetVisibility(false) 연출 종료"},
  ])

# ── 최적화: 기법 맵 (관계도) ──────────────────────────────────
opt_nodes = [
    N("root",  "퍼포먼스 / 메모리 최적화",                          310, 48, 250, 46, "manager"),
    N("ui",    "UI 렌더링 (Slate)",                                 40, 132, 240, 46, "ui"),
    N("tick",  "Tick 제어",                                         310, 132, 240, 46, "core"),
    N("mem",   "메모리 관리",                                       580, 132, 260, 46, "entity"),
    N("ui1",   "Global Invalidation 동적 토글 · ForceVolatile",     40, 212, 240, 56, "data"),
    N("tick1", "Significance 거리별 Tick",                          310, 212, 240, 48, "data"),
    N("tick2", "상태별 Tick 비활성화",                              310, 278, 240, 48, "data"),
    N("mem1",  "오브젝트 풀링 — Tick 先비활성화\n(freed-tick 방지)", 580, 212, 260, 56, "data"),
    N("mem2",  "명시적 GC · 약참조 · 지연 로드",                     580, 286, 260, 48, "data"),
]
opt_edges = [
    dict(src="root", dst="ui"), dict(src="root", dst="tick"), dict(src="root", dst="mem"),
    dict(src="ui", dst="ui1"),
    dict(src="tick", dst="tick1"), dict(src="tick1", dst="tick2"),
    dict(src="mem", dst="mem1"), dict(src="mem1", dst="mem2"),
]
emit("optimization-map", "퍼포먼스 최적화 — 기법 한눈에", opt_nodes, opt_edges)

# ── 아웃게임: 서버 Noti → Manager → UI (Manager 패턴) ──────────
emit_seq("outgame-noti", "아웃게임 — 서버 Noti → Manager → UI (Manager 패턴)",
  ["서버", "UNetworkNotiClient", "UGuildManager", "CommonUI Widget"],
  [
    {"frm":"서버","to":"UNetworkNotiClient","label":"NotifyEvt 푸시 (WebSocket)"},
    {"frm":"UNetworkNotiClient","to":"UGuildManager","label":"OnNotiServerEventReceived()"},
    {"frm":"UGuildManager","to":"UGuildManager","label":"상태 갱신 (GuildNotify)"},
    {"frm":"UGuildManager","to":"CommonUI Widget","label":"OnGuildDonation.Broadcast()","ret":True},
    {"frm":"CommonUI Widget","to":"UGuildManager","label":"RequestGuildDonation() 사용자 입력"},
    {"frm":"UGuildManager","to":"UNetworkNotiClient","label":"ProcessRequest() 요청 전송"},
    {"frm":"UNetworkNotiClient","to":"서버","label":"요청"},
    {"frm":"서버","to":"UNetworkNotiClient","label":"결과 재푸시","ret":True},
  ])

# ── 라이브: 별자리 룰렛 결과 불일치 레이스와 해결 ──────────────
emit_seq("live-race", "라이브 — 별자리 룰렛 결과 불일치 레이스와 해결",
  ["서버(Notify)", "NetworkNotiClient", "ConstellationManager", "룰렛 연출", "결과 확정"],
  [
    {"frm":"룰렛 연출","to":"서버(Notify)","label":"point/grow 요청 + 로컬 연출 선진행"},
    {"frm":"서버(Notify)","to":"NetworkNotiClient","label":"WebSocket 결과 비동기 도착 (시점 불확정)","ret":True},
    {"frm":"NetworkNotiClient","to":"ConstellationManager","label":"OnNotiServerEventReceived(kPointGrow)","ret":True},
    {"frm":"ConstellationManager","to":"룰렛 연출","label":"SetResultWithAngle()","ret":True},
    {"frm":"룰렛 연출","to":"룰렛 연출","label":"[경합] 전이 전 도착=미반영 / Spinning 중=각도 튐"},
    {"frm":"룰렛 연출","to":"결과 확정","label":"[버그] 로컬 착지 슬롯으로 산정 → 불일치","ret":True},
    {"frm":"룰렛 연출","to":"결과 확정","label":"[수정] 확정 기준을 서버 SelectedSlotIndex 단일화"},
    {"frm":"결과 확정","to":"룰렛 연출","label":"Notify 수신까지 Spinning 유지 후 확정","ret":True},
    {"frm":"룰렛 연출","to":"ConstellationManager","label":"OnRouletteSpinFinished(서버 결과)","ret":True},
  ])

# ── 데이터 파이프라인 (관계도) ────────────────────────────────
dp_nodes = [
    N("cmdlet","Export Commandlet\n(UAreaToolExport · CI/Jenkins)", 40, 64, 210, 56, "core"),
    N("src",   "원본 데이터\nExcel · 에셋 · 레벨",                  40, 150, 210, 56, "data"),
    N("gen",   "AreaTool Generator\n(FAreaToolJsonGenerator)",       300, 107, 190, 56, "ui"),
    N("val",   "검증자 체인\nRid·Name·NavMesh·Folder·Region",       300, 214, 220, 56, "core"),
    N("exp",   "Export + P4 Reconcile\n(SaveAndReconcile)",          560, 214, 200, 56, "core"),
    N("out",   "Generated 메타데이터\n(RidType 키)",                 560, 107, 200, 56, "data"),
    N("rt",    "런타임\nUMetadataSubsystem",                         800, 107, 180, 56, "manager"),
]
dp_edges = [
    dict(src="cmdlet", dst="gen", label="Main() 실행"),
    dict(src="src", dst="gen", label="원본 로드"),
    dict(src="gen", dst="val", label="Validate()"),
    dict(src="val", dst="exp", label="통과 시 Export()"),
    dict(src="exp", dst="out", label="JSON·P4"),
    dict(src="out", dst="rt", label="기동 시 로드"),
]
emit("pipeline-flow", "데이터 파이프라인 — 검증·생성·배포 자동화", dp_nodes, dp_edges)

print("\nDONE. SVG →", os.path.normpath(OUT_SVG), "| drawio →", os.path.normpath(OUT_DRAWIO))
