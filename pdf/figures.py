"""PDF 사례별 설명 그림(SVG) 생성기 — 코드 대신 수식 · 구조를 그림으로 보여준다.
실행: python pdf/figures.py  → pdf/assets/fig/*.svg (build.mjs가 HTML에 인라인으로 넣는다)
      웹사이트용 사본은 pdf/assets/web/*.svg → node pdf/webfigs.mjs가 PNG로 렌더해
      public/images/diagrams/fig-*.png로 저장 (<img>로 넣은 SVG는 웹 폰트를 못 써서 글자 폭이 달라짐)
"""
import math, os

OUT = os.path.join(os.path.dirname(__file__), 'assets', 'fig')
WEB_OUT = os.path.join(os.path.dirname(__file__), 'assets', 'web')
WEB = {'hit', 'obtain', 'traj', 'uiparticle', 'ray', 'centroid', 'minimap', 'transition', 'pocket', 'lod', 'quest', 'editorBone', 'editorModule'}
os.makedirs(OUT, exist_ok=True)
os.makedirs(WEB_OUT, exist_ok=True)

G, g = '#0F7A42', '#22A862'      # green (진한 / 밝은)
Y, y = '#8A6700', '#F5C000'      # yellow
O, o = '#B24A22', '#F7845A'      # orange
B = '#2F6A9E'
K, M, L = '#26312b', '#6b7570', '#d5ddd8'
BG_G, BG_Y, BG_O, BG_B, BG_K = '#e8f5ee', '#fff7e0', '#fdeee6', '#e8f0f8', '#f3f5f4'
COLORS = {'g': G, 'y': Y, 'o': O, 'b': B, 'k': K, 'm': M}


def esc(s):
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


def defs():
    m = ''.join(
        f'<marker id="ah-{k}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">'
        f'<path d="M0,0 L10,5 L0,10 z" fill="{c}"/></marker>' for k, c in COLORS.items())
    return f'<defs>{m}</defs>'


def svg(name, w, h, body):
    s = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" '
         f'font-family="Pretendard, \'Malgun Gothic\', sans-serif">{defs()}{"".join(body)}</svg>')
    open(os.path.join(OUT, name + '.svg'), 'w', encoding='utf-8').write(s)
    # 웹사이트용 사본 — 다크 테마 위에서도 보이게 흰 카드 배경 + 여백 (public/images/diagrams/fig-*.svg)
    if name in WEB:
        p = 16
        web = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{-p} {-p} {w + 2 * p} {h + 2 * p}" width="{w + 2 * p}" height="{h + 2 * p}" '
               f'font-family="Pretendard, \'Malgun Gothic\', sans-serif">{defs()}'
               f'<rect x="{-p}" y="{-p}" width="{w + 2 * p}" height="{h + 2 * p}" rx="14" fill="#ffffff"/>{"".join(body)}</svg>')
        open(os.path.join(WEB_OUT, 'fig-' + name + '.svg'), 'w', encoding='utf-8').write(web)


def T(x, y, s, size=13, c=K, w=500, a='start', mono=False, italic=False):
    ff = ' font-family="JetBrains Mono, Consolas, monospace"' if mono else ''
    st = ' font-style="italic"' if italic else ''
    size = size + 1
    return f'<text x="{x:.1f}" y="{y:.1f}" font-size="{size}" fill="{c}" font-weight="{w}" text-anchor="{a}"{ff}{st}>{esc(s)}</text>'


def Ln(x1, y1, x2, y2, c=K, w=1.6, dash=None, arrow=None, ak='k'):
    d = f' stroke-dasharray="{dash}"' if dash else ''
    a = f' marker-end="url(#ah-{ak})"' if arrow else ''
    return f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{c}" stroke-width="{w}"{d}{a}/>'


def Path(d, c=K, w=1.6, fill='none', dash=None, arrow=None, ak='k', op=1):
    ds = f' stroke-dasharray="{dash}"' if dash else ''
    a = f' marker-end="url(#ah-{ak})"' if arrow else ''
    return f'<path d="{d}" stroke="{c}" stroke-width="{w}" fill="{fill}" opacity="{op}"{ds}{a}/>'


def R(x, y, w, h, fill=BG_K, stroke=L, rx=8, sw=1.2, dash=None):
    d = f' stroke-dasharray="{dash}"' if dash else ''
    return f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="{rx}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"{d}/>'


def C(x, y, r, fill='none', stroke=K, sw=1.6, dash=None):
    d = f' stroke-dasharray="{dash}"' if dash else ''
    return f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"{d}/>'


def box(x, y, w, h, title, sub=None, fill=BG_K, stroke=L, tc=K, size=13.5, subsize=11.5):
    out = [R(x, y, w, h, fill, stroke)]
    if sub:
        out.append(T(x + w / 2, y + h / 2 - 3, title, size, tc, 700, 'middle'))
        lines = sub if isinstance(sub, list) else [sub]
        for i, s in enumerate(lines):
            out.append(T(x + w / 2, y + h / 2 + 14 + i * 14, s, subsize, M, 500, 'middle'))
    else:
        out.append(T(x + w / 2, y + h / 2 + 5, title, size, tc, 700, 'middle'))
    return ''.join(out)


# ─────────────────────────────────────────── 1. 피격 타이밍 — 속도 커브 역산
def fig_hit():
    W, H = 540, 280
    x0, x1, y0, y1 = 64, 500, 226, 36
    X = lambda u: x0 + (x1 - x0) * u
    Yv = lambda s: y0 - (y0 - y1) * s
    S = lambda u: 1 - (1 - u) ** 2                     # 감속 커브 (누적 이동 비율)
    r = 0.6
    us = 1 - math.sqrt(1 - r)
    b = [Ln(x0, y0, x1 + 10, y0, M, 1.2, arrow=1, ak='m'), Ln(x0, y0, x0, y1 - 12, M, 1.2, arrow=1, ak='m')]
    for i in range(0, 25):                               # 1/60초 샘플 (개략)
        b.append(Ln(X(i / 24), y0, X(i / 24), y0 + 4, M, 1))
    b.append(Path(f'M{X(0)},{Yv(0)} L{X(1)},{Yv(1)}', M, 1.4, dash='5 4'))
    pts = ' '.join(f'{X(i / 80):.1f},{Yv(S(i / 80)):.1f}' for i in range(81))
    b.append(f'<polyline points="{pts}" fill="none" stroke="{G}" stroke-width="2.6"/>')
    b.append(Ln(x0, Yv(r), x1, Yv(r), O, 1.4, dash='4 4'))
    b.append(Ln(X(us), Yv(r), X(us), y0, G, 1.6, dash='3 3'))
    b.append(Ln(X(r), Yv(r), X(r), y0, M, 1.2, dash='3 3'))
    b.append(C(X(us), Yv(r), 5, G, '#fff', 2))
    b.append(C(X(r), Yv(r), 4, '#fff', M, 1.6))
    b += [T(x0 - 8, Yv(r) + 4, 'r', 14, O, 800, 'end'), T(x0 - 8, Yv(1) + 4, '1', 12, M, 600, 'end'),
          T(x0 - 8, y0 + 4, '0', 12, M, 600, 'end'),
          T(X(us), y0 + 20, 't*', 14, G, 800, 'middle'), T(X(r), y0 + 20, '등속 가정', 12, M, 600, 'middle'),
          T(x1 + 6, y0 + 20, 't / T', 13, M, 600, 'end'), T(x0 + 6, y1 - 16, 'S(t / T) — 속도 커브의 누적 이동 비율', 12.5, M, 600),
          T(X(0.22), Yv(0.86), '실제 이펙트 (가감속)', 13, G, 700), 
          T(X(0.04), Yv(r) - 8, 'r = d(start, target) / L', 12.5, O, 700),
          T(X(us) + 10, Yv(r) + 22, '1/60초 간격으로 처음 r에 닿는 시각', 12, G, 600)]
    svg('hit', W, H, b)


# ─────────────────────────────────────────── 2. 획득 연출 — 선분 판정 + Delta 분할
def fig_obtain():
    W, H = 540, 262
    b = []
    cx, cy, rr = 168, 120, 34
    p0, p1 = (40, 196), (300, 46)
    # 선분-점 거리
    dx, dy = p1[0] - p0[0], p1[1] - p0[1]
    t = ((cx - p0[0]) * dx + (cy - p0[1]) * dy) / (dx * dx + dy * dy)
    qx, qy = p0[0] + t * dx, p0[1] + t * dy
    b += [C(cx, cy, rr, BG_G, g, 1.6, '4 3'), C(cx, cy, 4, G, G), T(cx - 10, cy + rr + 18, 'Target', 12, G, 700, 'middle'),
          T(cx - rr + 2, cy - rr - 6, '판정 반경 r', 12, G, 600),
          Ln(*p0, *p1, K, 2.2, arrow=1, ak='k'), C(*p0, 5, '#fff', K, 2), C(*p1, 5, '#fff', O, 2),
          T(p0[0] + 4, p0[1] + 20, 'P(t)', 12.5, K, 700), T(p1[0] - 4, p1[1] - 10, 'P(t + Δt)', 12.5, O, 700, 'end'),
          Ln(cx, cy, qx, qy, G, 1.8), C(qx, qy, 3, G, G), T(qx - 14, qy + 16, 'd', 13, G, 800),
          T(10, 236, '✗ 점 판정 — 이동 후 위치가 반경 밖이라 놓침', 12.5, O, 700),
          T(10, 254, '✓ 선분 판정 — d ≤ r 이면 목표로 스냅', 12.5, G, 700)]
    # 오른쪽: Delta 분할
    x, w = 334, 190
    b += [T(x, 40, 'Δt = 0.10초 (히칭)', 13, K, 800), R(x, 50, w, 26, BG_O, o)]
    b.append(T(x + w / 2, 68, '한 번에 적분하면 궤적이 튐', 11.5, O, 700, 'middle'))
    b.append(Ln(x + w / 2, 82, x + w / 2, 102, M, 1.4, arrow=1, ak='m'))
    parts = [0.03, 0.03, 0.03, 0.01]
    cur = x
    for i, p in enumerate(parts):
        ww = w * p / 0.10
        b.append(R(cur, 108, ww - 3, 30, BG_G, g, 5))
        if p >= 0.03:
            b.append(T(cur + (ww - 3) / 2, 128, f'{p:.2f}', 11, G, 700, 'middle'))
        cur += ww
    b += [T(x, 160, '0.03초 이하 스텝으로 나눠 적분', 12, K, 600),
          T(x, 182, '스텝 상한 MaxSubSteps = 8', 12, K, 600),
          T(x, 200, '→ 남는 시간은 버려 루프 방지', 12, M, 600)]
    svg('obtain', W, H, b)


# ─────────────────────────────────────────── 3. 궤적 — 로컬 기저 확산
def fig_traj():
    W, H = 540, 270
    sx, sy = 130, 138
    px, py = 470, 140
    b = [f'<ellipse cx="{sx}" cy="{sy}" rx="22" ry="78" fill="{BG_Y}" stroke="{y}" stroke-width="1.4" opacity=".9"/>',
         T(sx, sy + 98, '발사 방향에 수직인 평면', 12, Y, 700, 'middle'),
         Ln(sx, sy, sx + 120, sy, K, 2.2, arrow=1, ak='k'), T(sx + 124, sy + 5, 'forward', 12.5, K, 700),
         Ln(sx, sy, sx, sy - 62, O, 2.2, arrow=1, ak='o'), T(sx + 6, sy - 62, 'U', 13, O, 800),
         Ln(sx, sy, sx - 26, sy + 40, B, 2.2, arrow=1, ak='b'), T(sx - 38, sy + 52, 'R', 13, B, 800)]
    offs = [(-70, 0.55), (-38, 0.35), (46, 0.4), (78, 0.6), (-8, 0.2)]
    for i, (off, k) in enumerate(offs):
        c1x, c1y = sx + 90, sy + off * 1.5
        c2x, c2y = px - 120, py + off * k
        b.append(Path(f'M{sx},{sy} C{c1x},{c1y} {c2x},{c2y} {px},{py}', G, 1.8, op=0.85))
    b += [C(px, py, 9, BG_G, G, 2), T(px, py + 28, 'Player', 12.5, G, 700, 'middle'), C(sx, sy, 5, K, K),
          T(sx - 30, sy - 4, 'Target', 12, K, 700, 'end'), T(sx - 30, sy + 12, '(피격자)', 11, M, 600, 'end'),
          T(232, 32, 'dir = normalize(R · a + U · b)', 13, K, 800, mono=True),
          T(232, 52, '랜덤 가중치 a, b → 평면 위 무작위 확산', 12, M, 600),
          T(232, 238, '가속 누적 → 랜덤 성분 감소 → 목표로 수렴', 12, G, 700),
          T(232, 256, '먼 대상일수록 초기 확산 크게 (거리 보간)', 12, M, 600)]
    svg('traj', W, H, b)


# ─────────────────────────────────────────── 4. UI 파티클 — 회전각 복원
def fig_uiparticle():
    W, H = 540, 270
    th = math.radians(-24)
    cx, cy = 128, 132
    hw, hh = 92, 58                                      # 비균일 스케일 (가로로 늘어난 부모)
    corners = [(-hw, -hh), (hw, -hh), (hw, hh), (-hw, hh)]
    rot = lambda x, y: (cx + x * math.cos(th) - y * math.sin(th), cy + x * math.sin(th) + y * math.cos(th))
    pts = ' '.join(f'{rot(x, y)[0]:.1f},{rot(x, y)[1]:.1f}' for x, y in corners)
    b = [f'<polygon points="{pts}" fill="{BG_B}" stroke="{B}" stroke-width="1.6"/>',
         T(cx, 30, '부모 위젯: 회전 θ + 비균일 스케일', 12.5, B, 700, 'middle')]
    for i in range(7):                                    # 방출 위치: 부모 회전을 따라감
        x, y = -60 + i * 20, -14 + (i % 3) * 14
        px, py = rot(x, y)
        b.append(C(px, py, 4.5, o, '#fff', 1.2))
    ax, ay = rot(hw + 30, 0)
    b.append(Ln(cx, cy, ax, ay, B, 1.6, dash='4 3', arrow=1, ak='b'))
    b.append(T(cx + 70, cy + 52, 'θ', 15, B, 800))
    b.append(T(cx, 238, '파티클이 부모 회전 · 스케일을 그대로 따라가야 함', 12, M, 600, 'middle'))
    x = 268
    b += [R(x, 44, 262, 70, BG_O, o), T(x + 12, 66, '✗ 기존', 12.5, O, 800),
          T(x + 12, 86, 'cos θ = A / √(B² + D²)', 12.5, K, 600, mono=True),
          T(x + 12, 104, '비균일 스케일에서 틀림 · 1 초과 시 NaN', 11.5, M, 600),
          R(x, 128, 262, 92, BG_G, g), T(x + 12, 150, '✓ 수정', 12.5, G, 800),
          T(x + 12, 170, 'M = [A B; C D] → θ = atan2(B, A)', 12, K, 600, mono=True),
          T(x + 12, 190, "p' = R(θ) · (S · p)", 12.5, K, 600, mono=True),
          T(x + 12, 209, '스케일을 먼저, 회전은 나중에', 11.5, M, 600)]
    svg('uiparticle', W, H, b)


# ─────────────────────────────────────────── 5. 광선 · 선분 교차
def fig_ray():
    W, H = 540, 296
    poly = [(140, 222), (250, 160), (490, 200), (330, 266)]
    P, Q = poly[1], poly[2]
    s = 0.5
    X = (P[0] + s * (Q[0] - P[0]), P[1] + s * (Q[1] - P[1]))
    Oc = (36, 52)
    sc = 0.22                                            # 화면(클릭) 위치
    Sc = (Oc[0] + sc * (X[0] - Oc[0]), Oc[1] + sc * (X[1] - Oc[1]))
    pts = ' '.join(f'{x},{y}' for x, y in poly)
    b = [f'<polygon points="{pts}" fill="{BG_Y}" stroke="{y}" stroke-width="1.6"/>',
         T(250, 236, 'Territory 폴리곤', 12, Y, 700, 'middle'),
         Ln(*P, *Q, O, 3), T(P[0] - 8, P[1] - 6, 'P', 14, O, 800, 'end'), T(Q[0] + 6, Q[1] + 16, 'Q', 14, O, 800),
         T(Q[0] - 50, Q[1] + 24, 'e = Q − P', 12.5, O, 700, 'middle'),
         R(Sc[0] - 22, Sc[1] - 26, 44, 52, '#fff', M, 4, 1.2, '3 3'), T(Sc[0], Sc[1] - 32, '화면', 11.5, M, 600, 'middle'),
         Ln(*Oc, *X, B, 2, arrow=1, ak='b'), C(*Oc, 6, B, '#fff', 2), T(Oc[0] - 4, Oc[1] - 12, 'O (카메라)', 12.5, B, 700),
         C(*Sc, 4, '#fff', B, 2), T(Sc[0] + 26, Sc[1] + 4, '클릭 → Deproject', 11.5, B, 600),
         T(Oc[0] + 70, Oc[1] + 54, 'd', 14, B, 800),
         C(*X, 7, G, '#fff', 2.4), T(X[0] + 12, X[1] - 12, 'X = O + t · d', 13, G, 800),
         T(330, 286, '→ X를 로컬 좌표로 바꿔 P, Q 사이에 삽입', 12, G, 700, 'middle')]
    lx = 300
    b += [T(lx, 30, '① n = d × e ≈ 0 → 평행, 제외', 12.5, K, 600),
          T(lx, 50, '② (P − O) · n ≈ 0 → 동일 평면', 12.5, K, 600),
          T(lx, 70, '③ t, s ∈ [0, 1] → 실제 교차', 12.5, K, 600),
          T(lx, 92, '교차점은 로컬 좌표로 바꿔 저장', 11.5, M, 600)]
    svg('ray', W, H, b)


# ─────────────────────────────────────────── 6. Shoelace 무게중심
def fig_centroid():
    W, H = 540, 286
    raw = [(70, 230), (70, 200), (70, 170), (70, 140), (70, 110), (70, 80), (70, 46), (170, 46), (170, 150),
           (470, 150), (470, 230)]
    poly = [(round(170 + (x - 70) * 0.85), round(30 + (yy - 46) * 0.9)) for x, yy in raw]
    n = len(poly)
    A = sum(poly[i][0] * poly[(i + 1) % n][1] - poly[(i + 1) % n][0] * poly[i][1] for i in range(n)) / 2
    Cx = sum((poly[i][0] + poly[(i + 1) % n][0]) * (poly[i][0] * poly[(i + 1) % n][1] - poly[(i + 1) % n][0] * poly[i][1]) for i in range(n)) / (6 * A)
    Cy = sum((poly[i][1] + poly[(i + 1) % n][1]) * (poly[i][0] * poly[(i + 1) % n][1] - poly[(i + 1) % n][0] * poly[i][1]) for i in range(n)) / (6 * A)
    mx = sum(p[0] for p in poly) / n
    my = sum(p[1] for p in poly) / n
    pts = ' '.join(f'{x},{y}' for x, y in poly)
    b = [f'<polygon points="{pts}" fill="{BG_Y}" stroke="{y}" stroke-width="1.8"/>']
    for p in poly:
        b.append(C(*p, 4, '#fff', Y, 1.6))
    lx = poly[0][0] - 16
    b += [T(lx, 40, '꼭짓점이 왼쪽 변에 몰린', 12, M, 600, 'end'), T(lx, 56, '오목 다각형', 12, M, 600, 'end'),
          C(mx, my, 7, o, '#fff', 2), Ln(mx - 9, my, lx, my, O, 1.2, dash='2 2'),
          T(lx - 4, my - 4, '꼭짓점 평균 ✗', 13, O, 800, 'end'), T(lx - 4, my + 13, '점 분포에 끌려감', 11.5, M, 600, 'end'),
          C(Cx, Cy, 7, G, '#fff', 2), T(Cx + 12, Cy + 5, '면적 가중 중심 ✓', 13, G, 800),
          T(20, 236, 'A = ½ Σ (xᵢ yᵢ₊₁ − xᵢ₊₁ yᵢ)', 13, K, 700),
          T(20, 256, 'C = Σ (Pᵢ + Pᵢ₊₁) · crossᵢ / 6A', 13, K, 700),
          T(20, 276, '변마다 외적(부호 있는 면적 × 2)을 누적 — 면적 분포를 반영', 11.5, M, 600)]
    svg('centroid', W, H, b)


# ─────────────────────────────────────────── 7. 미니맵 좌표 변환
def fig_minimap():
    W, H = 540, 270
    wx, wy, ww, wh = 22, 52, 210, 170
    b = [R(wx, wy, ww, wh, BG_Y, y, 6), T(wx + 8, wy + 20, 'World', 12.5, Y, 800),
         C(wx, wy + wh, 5, Y, '#fff', 1.6), T(wx, wy + wh + 20, 'Origin', 12, Y, 700),
         Ln(wx, wy + wh + 30, wx + ww, wy + wh + 30, M, 1.2, arrow=1, ak='m'), T(wx + ww / 2, wy + wh + 46, 'WorldSize', 12, M, 600, 'middle')]
    P = (wx + ww * 0.62, wy + wh * 0.42)
    b += [C(*P, 6, G, '#fff', 2), T(P[0] + 10, P[1] - 8, 'P', 13, G, 800),
          Ln(250, 130, 296, 130, K, 1.8, arrow=1, ak='k'),
          T(273, 116, 'uv', 12.5, K, 800, 'middle'),
          T(wx, 30, 'uv = (P − Origin) / WorldSize ∈ [0, 1]', 13, K, 800, mono=True)]
    bx, by, bw, bh = 314, 58, 200, 150
    b += [R(bx, by, bw, bh, BG_G, g, 6), T(bx + 8, by - 8, '미니맵 (MPC → 머티리얼이 GPU에서 표시)', 11.5, G, 700),
          C(bx + bw / 2, by + bh / 2, 6, G, '#fff', 2), T(bx + bw / 2 + 10, by + bh / 2 + 18, '나', 12, G, 700)]
    far = (bx + bw + 16, by + 20)
    cl = (bx + bw, by + bh / 2 - (bh / 2 - 20) * (bw / 2) / (bw / 2 + 16))
    b += [C(*far, 5, '#fff', O, 1.6, '2 2'), T(far[0] + 4, far[1] + 24, '파티원', 11.5, O, 700, 'end'),
          Ln(bx + bw / 2, by + bh / 2, cl[0] - 4, cl[1] + 2, O, 1.4, dash='3 3'),
          C(cl[0], cl[1], 6, o, '#fff', 2),
          Ln(cl[0] - 12, cl[1] + 6, cl[0] + 8, cl[1] - 4, O, 2.2, arrow=1, ak='o'),
          T(bx + 8, by + bh + 22, '박스 밖: 경계로 Clamp + atan2 화살표', 12, O, 700)]
    svg('minimap', W, H, b)


# ─────────────────────────────────────────── 8. 외형 전이 규칙
def fig_transition():
    # 헬멧만 바꿨을 때 다시 로드하는 파츠 범위 비교 (전: 전신, 후: 바뀐 파츠만)
    W, H = 540, 250
    parts = ['Master', 'Face', 'Torso', 'Helmet', 'Attach']
    x0, pw, gap = 96, 80, 6
    b = [T(20, 24, '예: 헬멧만 바꾼 경우 — 다시 로드하는 파츠', 13, K, 800),
         T(20, 74, '이전', 14, O, 800),
         T(20, 144, '이후', 14, G, 800)]
    for k, name in enumerate(parts):
        x = x0 + k * (pw + gap)
        b.append(R(x, 46, pw, 44, BG_O, o, 6))
        b.append(T(x + pw / 2, 64, name, 12, K, 700, 'middle'))
        b.append(T(x + pw / 2, 81, '재로드', 11, O, 700, 'middle'))
        hit = name == 'Helmet'
        b.append(R(x, 116, pw, 44, BG_G if hit else '#f4f5f4', g if hit else L, 6, dash=None if hit else '3 3'))
        b.append(T(x + pw / 2, 134, name, 12, K if hit else M, 700, 'middle'))
        b.append(T(x + pw / 2, 151, '교체' if hit else '유지', 11, G if hit else M, 700, 'middle'))
    b += [Ln(20, 180, 520, 180, L, 1),
          T(20, 204, 'EvaluateTransitionRule(Next)', 12, B, 700, mono=True),
          T(20, 226, 'NoUpdate 동일 · PartialUpdate 바뀐 파츠만 · FullReset 메인 파츠 교체 시', 11.5, M, 600)]
    svg('transition', W, H, b)


# ─────────────────────────────────────────── 9. PocketLevel · 시퀀스 수명
def fig_pocket():
    W, H = 540, 250
    top = [('Stream In', 'PocketLevel'), ('원점 덮어쓰기', 'TransformOrigin'), ('재생', 'Soft 로드')]
    bot = [('시작 프레임 Jump', 'Keep State 원복'), ('Stop · Destroy', None),
           ('Stream Out', 'ViewTarget → Pawn')]
    b = [T(20, 22, '생성', 12.5, G, 800), T(20, 142, '정리', 12.5, O, 800)]
    for i, (t, s) in enumerate(top):
        x = 20 + i * 176
        b.append(box(x, 30, 160, 70, t, s, BG_G, g, G))
        if i < 2:
            b.append(Ln(x + 160, 65, x + 174, 65, K, 1.6, arrow=1, ak='k'))
    b.append(Path('M 452 100 C 452 130, 452 130, 452 148', K, 1.6, arrow=1, ak='k'))
    for i, (t, s) in enumerate(bot[::-1]):
        x = 20 + i * 176
        b.append(box(x, 150, 160, 70, t, s, BG_O, o, O))
    for i in range(2):
        x = 20 + (i + 1) * 176
        b.append(Ln(x, 185, x - 14, 185, K, 1.6, arrow=1, ak='k'))
    b.append(T(20, 242, '연출이 끝나면 자원 · 카메라 상태가 남지 않음', 12.5, M, 600))
    svg('pocket', W, H, b)


# ─────────────────────────────────────────── 10. LOD 파츠 · 정렬 키
def fig_lod():
    W, H = 540, 262
    x0, x1 = 120, 516
    rows = [('Master', True), ('Torso', True), ('Face', False), ('Helmet', False)]
    seg = (x1 - x0) / 4
    b = [T(20, 24, 'Torso LOD 기준 파츠 표시 (OptimizeLOD = 2)', 12.5, K, 800)]
    for i in range(4):
        b.append(T(x0 + seg * i + seg / 2, 48, f'LOD {i}', 12, M, 700, 'middle'))
    for r, (name, keep) in enumerate(rows):
        yy = 60 + r * 34
        b.append(T(x0 - 12, yy + 18, name, 13, K, 700, 'end'))
        for i in range(4):
            vis = keep or i < 2
            b.append(R(x0 + seg * i + 3, yy, seg - 6, 24, BG_G if vis else '#f1f1f1', g if vis else L, 5))
            b.append(T(x0 + seg * i + seg / 2, yy + 17, '표시' if vis else '숨김', 11.5, G if vis else M, 700, 'middle'))
    b.append(Ln(x0 + seg * 2, 40, x0 + seg * 2, 200, O, 1.6, dash='4 3'))
    b.append(Ln(x0, 206, x1, 206, M, 1.2, arrow=1, ak='m'))
    b.append(T(x1, 222, '거리 →', 11.5, M, 600, 'end'))
    b += [T(20, 236, '1초 Tick에서 LOD가 바뀐 경우에만 Visibility 갱신', 12, G, 700),
          T(20, 254, '정렬: 키를 정렬 전 1회 계산 → Lookup O(N log N) → O(N)', 12, B, 700)]
    svg('lod', W, H, b)


# ─────────────────────────────────────────── 11. 퀘스트 → R16F 텍스처
def fig_quest():
    W, H = 540, 262
    b = [R(20, 34, 150, 120, BG_Y, y, 6), T(28, 52, '맵', 12, Y, 800)]
    qs = [(70, 92, 20), (124, 76, 14), (110, 128, 18)]
    for i, (x, yv, r) in enumerate(qs):
        b.append(C(x, yv, r, 'rgba(247,132,90,.25)', O, 1.6))
        b.append(T(x, yv + 4, f'q{i}', 11, O, 800, 'middle'))
    b.append(Ln(176, 94, 206, 94, K, 1.6, arrow=1, ak='k'))
    b.append(T(191, 122, '÷ World', 10.5, M, 600, 'middle'))
    b.append(T(191, 135, 'Size', 10.5, M, 600, 'middle'))
    cells = ['x0', 'y0', 'r0', 'x1', 'y1', 'r1', 'x2', 'y2', 'r2']
    cw = 34
    for i, c in enumerate(cells):
        x = 212 + i * cw
        b.append(R(x, 78, cw - 2, 32, [BG_O, BG_G, BG_B][i % 3], [o, g, B][i % 3], 3))
        b.append(T(x + (cw - 2) / 2, 99, c, 11.5, K, 700, 'middle', mono=True))
    b += [T(212, 68, 'FFloat16 배열 → R16F 텍스처 (1 × 3N)', 12.5, K, 800),
          T(212, 130, 'CreateTransient(3N, 1, PF_R16F)', 12, K, 600, mono=True),
          T(212, 148, 'Mip Lock · Memcpy · Unlock → UpdateResource', 11.5, M, 600),
          Ln(360, 158, 360, 182, K, 1.6, arrow=1, ak='k'),
          box(212, 188, 306, 58, '머티리얼 (GPU)', 'for i < N → (xᵢ, yᵢ, rᵢ) 원을 직접 그림', BG_G, g, G),
          T(20, 186, '위젯 0개', 14, G, 800), T(20, 206, '퀘스트가 늘어도', 12, M, 600),
          T(20, 222, 'UI 비용 그대로', 12, M, 600)]
    svg('quest', W, H, b)


# ─────────────────────────────────────────── 12. 에디터 본 트랜스폼 프리뷰
def fig_editorbone():
    W, H = 540, 262
    b = [T(20, 22, '인게임', 12.5, M, 800),
         box(20, 30, 200, 50, 'ULocomotionAnimInstance', '체형 본 적용', BG_K, L, K, 12.5),
         T(20, 108, '에디터 프리뷰', 12.5, B, 800),
         box(20, 116, 200, 50, 'UDebugSkelMeshComponent', None, BG_B, B, B, 12.5),
         Ln(120, 166, 120, 186, B, 1.6, arrow=1, ak='b'),
         box(20, 190, 200, 50, 'UAnimPreviewInstance', '인게임 경로를 타지 않음', BG_B, B, B, 12.5),
         Path('M 120 116 C 120 98, 120 98, 120 84', O, 1.4, dash='3 3'),
         T(132, 100, '✗ 체형 미반영', 12, O, 700),
         Ln(262, 215, 224, 215, G, 1.8, arrow=1, ak='g'), T(243, 207, '주입', 10.5, G, 700, 'middle'),
         box(266, 190, 256, 50, 'UEditorTransformBonesComponent', 'ModifyBone(Bone) — find-or-add', BG_G, g, G, 12.5),
         T(266, 120, '에디터 전용 경로', 12.5, G, 800),
         T(266, 142, '인게임 AnimInstance 대신', 12, K, 600),
         T(266, 162, '프리뷰 인스턴스에 본 노드를 직접 추가', 12, K, 600)]
    svg('editorBone', W, H, b)


# ─────────────────────────────────────────── 13. 에디터 모듈 재사용 (Factory Method)
def fig_editormodule():
    W, H = 540, 270
    b = [T(20, 22, 'Component', 12.5, M, 800), T(290, 22, 'Module', 12.5, M, 800),
         box(20, 30, 240, 58, 'UVisualDataModuleComponent', 'CreateModule() — Factory', BG_K, L, K, 12),
         box(20, 150, 240, 58, 'UVisualDataEditorModuleComponent', 'override CreateModule()', BG_B, B, B, 11.5),
         Ln(140, 150, 140, 92, K, 1.4, arrow=1, ak='k'), T(148, 124, '상속', 11.5, M, 600),
         box(290, 30, 230, 58, 'FVisualDataModulePC', '로드 · 파츠 적용 · 전이 규칙', BG_K, L, K, 12.5),
         box(290, 146, 230, 72, 'FVisualDataEditorModulePC', ['override 전이 규칙', 'ApplySocket · ClearModule'], BG_G, g, G, 12.5),
         Ln(405, 150, 405, 92, K, 1.4, arrow=1, ak='k'), T(413, 124, '상속', 11.5, M, 600),
         Ln(260, 179, 286, 179, G, 1.8, dash='4 3', arrow=1, ak='g'), T(273, 166, '생성', 10, G, 700, 'middle'),
         T(20, 236, '에디터는 "다른 부분만" override — 나머지는 인게임 코드 그대로 실행', 12.5, G, 700),
         T(20, 256, '캐릭터 뷰어 · FX 에디터도 같은 컴포넌트로 전환', 12, M, 600)]
    svg('editorModule', W, H, b)


# ─────────────────────────────────────────── 14. Slate Global Invalidation
def fig_slate():
    W, H = 540, 250
    b = [box(20, 20, 150, 56, '활성 화면 전환', 'ScreenStack'),
         Ln(170, 48, 196, 48, K, 1.6, arrow=1, ak='k'),
         box(200, 20, 150, 56, '화면 데이터', 'UseGlobalInvalidation', BG_B, B, B),
         Ln(350, 48, 376, 48, K, 1.6, arrow=1, ak='k'),
         box(380, 20, 140, 56, 'Toggle', 'Global Invalidation', BG_G, g, G),
         T(20, 106, '바뀌지 않은 위젯은 캐시 → 매 프레임 재계산 제거', 12.5, G, 700),
         R(20, 120, 245, 104, BG_O, o), T(32, 142, '부작용 1 · 2', 12.5, O, 800),
         T(32, 164, '계속 바뀌는 위젯 → ForceVolatile', 11.5, K, 600),
         T(32, 184, '경로 밖 값 변경 → 2틱 뒤 갱신', 11.5, K, 600),
         T(32, 204, '재접속 → InvalidateAllWidget', 11.5, K, 600),
         R(275, 120, 245, 104, BG_K, L), T(287, 142, '한계', 12.5, M, 800),
         T(287, 164, '갱신이 잦은 화면은', 11.5, K, 600), T(287, 184, '화면 단위로 꺼서', 11.5, K, 600),
         T(287, 204, '적용 범위를 제한', 11.5, K, 600)]
    svg('slate', W, H, b)


# ─────────────────────────────────────────── 15. AreaTool 시각화
def fig_areavis():
    W, H = 540, 200
    b = [R(20, 16, 240, 170, BG_B, B), T(34, 40, 'FPrimitiveSceneProxy', 13, B, 800),
         T(34, 62, '렌더 스레드 · 뷰마다 제출', 12, K, 600),
         T(34, 82, 'GetDynamicMeshElements', 11.5, M, 600),
         T(34, 106, '→ 스폰 반경 와이어 실린더', 12, B, 700),
         T(34, 130, 'GetViewRelevance', 11.5, M, 600), T(34, 148, 'bDrawOnlyIfSelected', 11.5, M, 600),
         T(34, 170, '→ 선택한 액터만 표시', 12, B, 700),
         R(280, 16, 240, 170, BG_G, g), T(294, 40, 'FComponentVisualizer', 13, G, 800),
         T(294, 62, '에디터 선택 시 그림', 12, K, 600),
         T(294, 82, '솔리드 실린더 + 캡 면', 11.5, M, 600),
         T(294, 106, '2D 폴리곤 → 삼각화', 12, G, 700),
         T(294, 126, '→ FDynamicMeshBuilder', 12, G, 700)]
    # 삼각화 미니 그림
    pts = [(420, 140), (470, 132), (500, 160), (455, 178), (412, 168)]
    b.append(f'<polygon points="{" ".join(f"{x},{yy}" for x, yy in pts)}" fill="#cdeedb" stroke="{G}" stroke-width="1.4"/>')
    for i in (2, 3):
        b.append(Ln(*pts[0], *pts[i], G, 1))
    svg('areaVis', W, H, b)


# ─────────────────────────────────────────── 16. 파츠 Attachment · FX 정리
def fig_weaponfx():
    W, H = 540, 250
    b = [T(20, 22, 'Attach', 12.5, G, 800),
         box(20, 30, 230, 74, '한 번의 FStreamableHandle', ['파츠 메시 · 추가 메시 · 이펙트', '함께 비동기 로드'], BG_G, g, G, 13),
         Ln(250, 67, 284, 67, K, 1.6, arrow=1, ak='k'),
         box(288, 30, 232, 74, '소켓 기반 Attachment', ['FPCModuleAttachment 파생', '주 / 보조 무기 · 방어구 · 헬멧'], BG_K, L, K, 13),
         T(20, 136, '재로드 · Detach', 12.5, O, 800),
         box(20, 144, 230, 56, '이전 핸들 취소', '끝나지 않은 로드를 정리', BG_O, o, O, 13),
         R(288, 144, 232, 82, '#fff', L), T(300, 166, 'Detach 시 FX', 12.5, K, 800),
         T(300, 188, '✗ ReleaseToPool()만 → 잔상', 12, O, 700),
         T(300, 210, '✓ DeactivateImmediate() 직접 호출', 12, G, 700),
         T(20, 228, '파츠를 자주 바꿔도 이전 로드 · 이펙트가 남지 않음', 12, M, 600)]
    svg('weaponFx', W, H, b)


for f in [fig_weaponfx, fig_slate, fig_areavis, fig_hit, fig_obtain, fig_traj, fig_uiparticle, fig_ray, fig_centroid, fig_minimap, fig_transition,
          fig_pocket, fig_lod, fig_quest, fig_editorbone, fig_editormodule]:
    f()
print('figures ->', OUT, len(os.listdir(OUT)))
