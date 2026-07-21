# -*- coding: utf-8 -*-
"""Notion 원본 markdown(scratchpad/notion/<slug>.md) → content/side/<slug>.md 변환.
- 이미지: Notion S3 서명 URL을 public/images/side/<slug>/ 로 다운로드(영구 보존)
- video/callout/color-header/embed/unknown 블록 정리
"""
import os, re, json, urllib.request, mimetypes

ROOT = os.path.dirname(os.path.abspath(__file__))               # content/side
REPO = os.path.abspath(os.path.join(ROOT, "..", ".."))
RAW  = os.path.join(REPO, "..", "scratchpad", "notion")         # scratchpad/notion (fallback below)
if not os.path.isdir(RAW):
    RAW = os.environ.get("NOTION_RAW", RAW)
IMG_ROOT = os.path.join(REPO, "public", "images", "side")

META = {
 "genshin":   dict(title="원신 (Genshin) 모작", subtitle="오픈월드 RPG · Unity", engine="Unity / C#",
                   period="2022.07", team="개발자 2인", status="Highlights",
                   tags=["Unity","C#","FSM","Object Pooling","Cinemachine"], image="/images/yt/genshin.jpg",
                   video="https://youtu.be/K3E_Jpei_Oc", git="https://github.com/LimHyun-ji/GenshinImpact_Copy", doc="https://www.miricanvas.com/v/11mr28x"),
 "journey":   dict(title="Journey To Space", subtitle="우주·행성 탐험 FPS RPG · Unreal", engine="Unreal / C++",
                   period="2021.07 – 2021.08", team="개발자 2인", status="Highlights",
                   tags=["Unreal","C++","AI Behavior","Destructible","FPS RPG"], image="/images/yt/journey.jpg",
                   video="https://youtu.be/xfQBWUyWXu8", git="https://github.com/LimHyun-ji/Space-To-Journey", doc=""),
 "ittakestwo":dict(title="It Takes Two 모작", subtitle="2인 협동 어드벤처 · Unity", engine="Unity / C#",
                   period="2022.08", team="개발자 2인", status="Highlights",
                   tags=["Unity","FSM","Shader","Bezier","IK"], image="/images/ittakestwo-1.png",
                   video="https://youtu.be/23g39-UNHLQ", git="https://github.com/LimHyun-ji/ItTakesTwo_GG", doc="https://www.miricanvas.com/v/11j6dmn"),
 "cinepx":    dict(title="Cinepx", subtitle="메타버스 영화 촬영 플랫폼 · Unity", engine="Unity / C#",
                   period="2022.10 – 2022.11", team="XR 2 · AI 2 · CR 1", status="Highlights",
                   tags=["Unity","Cinemachine","RenderTexture","Optimization"], image="/images/cinepx-1.png",
                   video="https://youtu.be/aKcv3BfkqDQ", git="https://github.com/LimHyun-ji/AppleBox", doc="https://www.miricanvas.com/v/11mr28x"),
 "bridge":    dict(title="Bridge Theater: Red Riding Hood", subtitle="관객 참여형 VR 연극 · 경진대회 우수상", engine="Unreal / C++",
                   period="2021.09 – 2021.10", team="개발자 2 · 모델러 2", status="Highlights",
                   tags=["Unreal","C++","VR","LiveLink","Behavior Tree"], image="/images/yt/bridge.jpg",
                   video="https://youtu.be/D6_bDRrNd8w", git="https://github.com/LimHyun-ji/VR-Theater", doc=""),
 "squid":     dict(title="오징어게임 VR", subtitle="무궁화 꽃이 피었습니다 · 기업 연계", engine="Unreal / BP·C++",
                   period="2021.11", team="개발자 2 · 모델러 2", status="",
                   tags=["Unreal","VR","Blueprint","OnlineSubsystem","멀티플레이"], image="/images/yt/squid.jpg",
                   video="https://youtu.be/hiWAjNyuSsM", git="", doc=""),
 "zezz":      dict(title="Zezz", subtitle="Zepeto+Sims 마이홈 메타버스 · Unity", engine="Unity / C#",
                   period="2022.09", team="개발자 2인", status="Highlights",
                   tags=["Unity","Firebase","Realtime DB","Building System"], image="/images/yt/zezz.jpg",
                   video="https://youtu.be/dXVODz3MJaY", git="", doc="https://www.miricanvas.com/v/11mr28x"),
 "midnight":  dict(title="Midnight Gallery", subtitle="Interactive Art · Unity", engine="Unity / C#",
                   period="2022.08 – 2022.09", team="XR 4 · AI 2 · 모델러 2 · 사운드 1", status="GameJam",
                   tags=["Unity","AI Hand Tracking","Compute Shader","Interactive Art"], image="/images/yt/midnight.jpg",
                   video="https://youtu.be/IDryaiFv-Mw", git="", doc=""),
 "healthmr":  dict(title="헬스 트레이닝 MR", subtitle="MR 헬스 콘텐츠 · 게임잼", engine="Unity / Oculus Quest",
                   period="2022.07", team="개발자 3 · 모델러 2", status="GameJam",
                   tags=["MR","Passthrough API","Oculus Quest","GameManager"], image="/images/yt/healthmr.jpg",
                   video="https://youtu.be/WjROo7WEGCY", git="", doc=""),
 "fruit":     dict(title="Fruit Game", subtitle="모바일 미니게임 · Unity", engine="Unity / C#",
                   period="2021.06", team="개발자 1 (본인)", status="",
                   tags=["Unity","C#","2D","Collision"], image="/images/yt/fruit.jpg",
                   video="https://youtu.be/wzn5y_Gpyq8", git="", doc=""),
 "shooting":  dict(title="Shooting Game", subtitle="Java 슈팅 게임 · 학습", engine="Java",
                   period="2021.03", team="개발자 1 (본인)", status="",
                   tags=["Java","OOP","GUI"], image="/images/yt/shooting.jpg",
                   video="https://youtu.be/Zu2oAUBnlsk", git="", doc=""),
 "musical":   dict(title="뮤지컬 관리 프로그램", subtitle="데이터베이스 · Java JDBC", engine="Java / MySQL",
                   period="2021.05 – 2021.06", team="개발자 3", status="",
                   tags=["Java","JDBC","MySQL"], image="/images/yt/musical.jpg",
                   video="https://youtu.be/wdOllSk33T0", git="", doc=""),
}

def dl_image(url, slug, n):
    os.makedirs(os.path.join(IMG_ROOT, slug), exist_ok=True)
    ext = ".png"
    base = url.split("?")[0].lower()
    for e in (".png",".jpg",".jpeg",".gif",".webp"):
        if base.endswith(e): ext = ".jpg" if e==".jpeg" else e; break
    fn = f"img{n}{ext}"
    dst = os.path.join(IMG_ROOT, slug, fn)
    try:
        req = urllib.request.Request(url, headers={"User-Agent":"Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=30) as r, open(dst,"wb") as f:
            f.write(r.read())
        return f"/images/side/{slug}/{fn}"
    except Exception as e:
        print("  ! image dl fail", slug, n, str(e)[:80]); return None

def strong(s):  # **x** -> <strong>x</strong>
    return re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", s, flags=re.S)

def convert(slug, md):
    # 이미지 다운로드/치환
    imgs = re.findall(r"!\[\]\((https://prod-files-secure[^)]+)\)", md)
    for i,u in enumerate(imgs,1):
        local = dl_image(u,slug,i)
        if local: md = md.replace(f"![]({u})", f"![]({local})")
        else:     md = md.replace(f"![]({u})", "")
    # 콜아웃 -> div (bold를 strong으로)
    def cb(m):
        inner = m.group("inner").strip()
        icon = m.group("icon") or "💡"
        return f'<div class="callout"><span class="ci">{icon}</span> {strong(inner)}</div>'
    md = re.sub(r'<callout icon="(?P<icon>[^"]*)"[^>]*>(?P<inner>.*?)</callout>', cb, md, flags=re.S)
    # 헤더 color 속성 제거
    md = re.sub(r'\s*\{color="[^"]*"\}', "", md)
    # 불필요 블록 제거
    md = re.sub(r'<video[^>]*>\s*</video>\s*', "", md)
    md = re.sub(r'<embed[^>]*>\s*</embed>\s*', "", md)
    md = re.sub(r'<unknown[^>]*/>\s*', "", md)
    md = re.sub(r'<unknown[^>]*>.*?</unknown>\s*', "", md, flags=re.S)
    md = md.replace("<empty-block/>", "")
    # 탭 -> 2space (중첩 렌더)
    md = "\n".join(re.sub(r"^\t+", lambda m: "  "*len(m.group(0)), ln) for ln in md.splitlines())
    md = re.sub(r"\n{3,}", "\n\n", md).strip()
    return md

def esc(s): return s.replace('"','\\"')

def emit(slug):
    raw = os.path.join(RAW, slug+".md")
    if not os.path.exists(raw): print("skip (no raw):", slug); return
    m = META[slug]
    body = convert(slug, open(raw,encoding="utf-8").read())
    tags = ", ".join(f'"{t}"' for t in m["tags"])
    fm = [f'---', f'title: "{esc(m["title"])}"', f'subtitle: "{esc(m["subtitle"])}"',
          f'engine: "{m["engine"]}"', f'period: "{m["period"]}"', f'team: "{esc(m["team"])}"',
          f'status: "{m["status"]}"', f'image: "{m["image"]}"', f'video: "{m["video"]}"',
          f'tags: [{tags}]',
          f'links: {{ git: "{m["git"]}", doc: "{m["doc"]}", video: "{m["video"]}" }}', f'---', '']
    out = os.path.join(ROOT, slug+".md")
    open(out,"w",encoding="utf-8").write("\n".join(fm)+body+"\n")
    print("emitted", slug, f"({len(body)} chars)")

if __name__ == "__main__":
    import sys
    targets = sys.argv[1:] if len(sys.argv) > 1 else list(META)
    for slug in targets: emit(slug)
