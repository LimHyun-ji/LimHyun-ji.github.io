# -*- coding: utf-8 -*-
"""
전투 서버 동기화 — 판정 시점 시퀀스 (combat-sync).
gen_diagrams.py 와 같은 'figure card' 스타일로 SVG + drawio 를 출력한다.
실행: python diagrams/gen_combat_sync.py  (worktree 루트에서)
"""
import os, html

HERE = os.path.dirname(os.path.abspath(__file__))
OUT_SVG = os.path.join(HERE, "..", "public", "images", "diagrams")
SLUG = "combat-sync"
TITLE_TXT = "전투 서버 동기화 — 판정 시점 시퀀스"

TEXT, SUB, EDGE = "#1e293b", "#475569", "#7787a2"
CARD_BG, CARD_BORDER, TITLE = "#ffffff", "#e2e8f0", "#0f172a"
HEAD = ("#dbe9ff", "#3b6fb0")          # 참여자
QUEUE = ("#eef2f7", "#64748b")         # 클라이언트 내부 처리
HIT = ("#fff7e6", "#d9a12b")           # 히트 판정 처리
MODEL = ("#fff1e6", "#e8823a")         # 시간 동기화 모델

# 레이아웃: 좌우 대칭. 클라이언트 처리 박스는 CLIENT 생명선 중심, 시간 동기화 박스는 SERVER 생명선 중심
M, BW, GAP = 50, 360, 40               # 바깥 여백, 박스 폭, 두 박스 사이 간격
W, H = 2 * M + 2 * BW + GAP, 576
CX, SX = M + BW // 2, W - M - BW // 2  # 생명선 x (CLIENT, SERVER)
BX = CX - BW // 2                      # 클라이언트 박스 x
HEAD_Y, HEAD_H = 52, 38

def esc(s): return html.escape(s, quote=True)

# (y, from, to, label)
MSGS = [
    (122, "C", "S", "1. CastCmd (skill_id, target_id)"),
    (160, "S", "C", "2. SkillCastResultEvt (Success)"),
    (198, "S", "C", "3. ActionEvt (NotifyInfoList 포함)"),
    (386, "S", "C", "4. LazyHitNotifyEvt (Hit_1 데미지)"),
    (480, "S", "C", "5. ChangeStatusEffectEvt (버프 / 디버프 / CC)"),
    (518, "S", "C", "6. AttackEndEvt (스킬 처리 완료)"),
]
# 클라이언트 측 처리 박스: (x, y, w, h, palette, [lines], bold_first)
BOXES = [
    (BX, 222, BW, 32, QUEUE, ["CLIENT: ActionQueue → 몽타주 재생 (SyncGameTime 기준)"]),
    (BX, 262, BW, 26, HIT,   ["Hit_0 (Immediate) → 즉시 데미지 적용"]),
    (BX, 294, BW, 26, HIT,   ["Hit_1 (Lazy) → 서버 확인 대기"]),
    (BX, 326, BW, 26, HIT,   ["Hit_2 (Immediate) → 즉시 데미지 적용"]),
    (BX, 408, BW, 30, HIT,   ["CLIENT: Hit_1 Lazy 데미지 적용"]),
]
MODEL_BOX = (SX - BW // 2, 222, BW, 130)   # 클라이언트 처리 박스 묶음(222~352)과 위아래 정렬
MODEL_LINES = [
    "SyncGameTime = ServerTime − (RTT/2 + 200ms)",
    "• 200ms 고정 버퍼로 네트워크 지연 흡수",
    "• RTT 변화 25ms 이상일 때만 갱신 (히스테리시스)",
    "• 지연 초과 시 이벤트 즉시 실행",
]

def build_svg():
    P = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" font-family="Inter, \'Malgun Gothic\', sans-serif">',
         '<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">'
         f'<path d="M 0 0 L 10 5 L 0 10 z" fill="{EDGE}"/></marker></defs>',
         f'<rect x="0.5" y="0.5" width="{W-1}" height="{H-1}" rx="14" fill="{CARD_BG}" stroke="{CARD_BORDER}"/>',
         f'<text x="20" y="30" font-size="14" font-weight="700" fill="{TITLE}">{esc(TITLE_TXT)}</text>']
    # lifelines + headers
    for x, name in ((CX, "CLIENT"), (SX, "SERVER")):
        P.append(f'<line x1="{x}" y1="{HEAD_Y+HEAD_H}" x2="{x}" y2="{H-24}" stroke="{CARD_BORDER}" stroke-width="1.3" stroke-dasharray="4 5"/>')
        P.append(f'<rect x="{x-70}" y="{HEAD_Y}" width="140" height="{HEAD_H}" rx="8" fill="{HEAD[0]}" stroke="{HEAD[1]}" stroke-width="1.5"/>')
        P.append(f'<text x="{x}" y="{HEAD_Y+HEAD_H/2+4}" text-anchor="middle" font-size="12" font-weight="700" fill="{TEXT}">{name}</text>')
    # client-side boxes
    for (x, y, w, h, pal, lines) in BOXES:
        P.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="7" fill="{pal[0]}" stroke="{pal[1]}" stroke-width="1.2"/>')
        P.append(f'<text x="{x+12}" y="{y+h/2+4}" font-size="11" fill="{TEXT}">{esc(lines[0])}</text>')
    # messages
    pos = {"C": CX, "S": SX}
    for (y, a, b, label) in MSGS:
        x1, x2 = pos[a], pos[b]
        P.append(f'<line x1="{x1}" y1="{y}" x2="{x2}" y2="{y}" stroke="{EDGE}" stroke-width="1.5" marker-end="url(#arrow)"/>')
        P.append(f'<text x="{(x1+x2)/2}" y="{y-7}" text-anchor="middle" font-size="10.5" fill="{SUB}">{esc(label)}</text>')
    # time sync model
    x, y, w, h = MODEL_BOX
    P.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="12" fill="{MODEL[0]}" stroke="{MODEL[1]}" stroke-width="1.5"/>')
    P.append(f'<text x="{x+w/2}" y="{y+24}" text-anchor="middle" font-size="12.5" font-weight="700" fill="{MODEL[1]}">시간 동기화 모델</text>')
    for i, t in enumerate(MODEL_LINES):
        weight = ' font-weight="600"' if i == 0 else ''
        P.append(f'<text x="{x+16}" y="{y+50+i*21}" font-size="11"{weight} fill="{TEXT}">{esc(t)}</text>')
    # legend
    # 범례: 항목 폭(사각형 20 + 라벨) 기준으로 같은 간격 배치, 전체를 가운데 정렬
    items = ((QUEUE, "클라이언트 내부 처리"), (HIT, "히트 판정 처리"), (MODEL, "시간 동기화"))
    lw = lambda s: sum(10.5 if ord(ch) >= 0x2E80 else 5.8 for ch in s)
    widths = [20 + lw(lab) for _, lab in items]
    SEP = 32
    lx, ly = (W - (sum(widths) + SEP * (len(items) - 1))) / 2, H - 22
    xs = [lx + sum(widths[:i]) + SEP * i for i in range(len(items))]
    for (pal, lab), bx in zip(items, xs):
        P.append(f'<rect x="{bx}" y="{ly-12}" width="14" height="14" rx="3" fill="{pal[0]}" stroke="{pal[1]}"/>')
        P.append(f'<text x="{bx+20}" y="{ly}" font-size="10.5" fill="{SUB}">{lab}</text>')
    P.append('</svg>')
    return "\n".join(P)

def build_drawio():
    cells = ['<mxCell id="0"/>', '<mxCell id="1" parent="0"/>']
    n = [0]
    def nid():
        n[0] += 1; return f"c{n[0]}"
    def vert(x, y, w, h, val, pal, extra=""):
        cells.append(f'<mxCell id="{nid()}" value="{esc(val)}" style="rounded=1;whiteSpace=wrap;html=1;align=left;spacingLeft=8;fillColor={pal[0]};strokeColor={pal[1]};fontColor={TEXT};fontSize=11;{extra}" vertex="1" parent="1"><mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/></mxCell>')
    for x, name in ((CX, "CLIENT"), (SX, "SERVER")):
        cells.append(f'<mxCell id="{nid()}" value="{name}" style="rounded=1;html=1;fillColor={HEAD[0]};strokeColor={HEAD[1]};fontStyle=1;" vertex="1" parent="1"><mxGeometry x="{x-70}" y="{HEAD_Y}" width="140" height="{HEAD_H}" as="geometry"/></mxCell>')
        cells.append(f'<mxCell id="{nid()}" style="endArrow=none;dashed=1;html=1;strokeColor={CARD_BORDER};" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="{x}" y="{HEAD_Y+HEAD_H}" as="sourcePoint"/><mxPoint x="{x}" y="{H-24}" as="targetPoint"/></mxGeometry></mxCell>')
    for (x, y, w, h, pal, lines) in BOXES:
        vert(x, y, w, h, lines[0], pal)
    pos = {"C": CX, "S": SX}
    for (y, a, b, label) in MSGS:
        cells.append(f'<mxCell id="{nid()}" value="{esc(label)}" style="html=1;endArrow=block;strokeColor={EDGE};fontSize=10;fontColor={SUB};" edge="1" parent="1"><mxGeometry relative="1" as="geometry"><mxPoint x="{pos[a]}" y="{y}" as="sourcePoint"/><mxPoint x="{pos[b]}" y="{y}" as="targetPoint"/></mxGeometry></mxCell>')
    x, y, w, h = MODEL_BOX
    vert(x, y, w, h, "<b>시간 동기화 모델</b><br>" + "<br>".join(MODEL_LINES), MODEL, "verticalAlign=top;spacingTop=6;")
    body = "".join(cells)
    return (f'<mxfile host="app.diagrams.net"><diagram name="{esc(TITLE_TXT)}"><mxGraphModel dx="900" dy="600" grid="1" gridSize="10" '
            f'guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1100" pageHeight="850" math="0" shadow="0">'
            f'<root>{body}</root></mxGraphModel></diagram></mxfile>')

if __name__ == "__main__":
    with open(os.path.join(OUT_SVG, SLUG + ".svg"), "w", encoding="utf-8") as f:
        f.write(build_svg())
    with open(os.path.join(HERE, SLUG + ".drawio"), "w", encoding="utf-8") as f:
        f.write(build_drawio())
    print("emitted", SLUG)
