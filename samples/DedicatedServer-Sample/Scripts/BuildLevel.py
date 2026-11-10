"""
Ore Rush 레벨 자동 구성 스크립트 (Unreal Editor Python).

실행 방법 (셋 중 하나):
  1) 에디터: Tools > Execute Python Script... > 이 파일 선택
  2) 에디터 Output Log 의 Cmd 를 Python 으로 바꾸고:  exec(open(r"<프로젝트 경로>/Scripts/BuildLevel.py", encoding="utf-8").read())
  3) Unreal MCP 서버가 연결되어 있다면, 그 서버의 "Python 실행" 도구로 이 파일 내용을 실행

여러 번 실행해도 된다. 이전에 이 스크립트가 만든 액터(태그 'OreRush')를 지우고 다시 배치한다.
채집 노드와 봇은 서버(NSGameMode)가 런타임에 스폰하므로 여기서는 배치하지 않는다.

배치 (위에서 본 모습):

          PlayerStart x8 (반지름 700)
                ·   ·   ·
              ·  [납품 구역]  ·      ← 중앙 800 x 800
                ·   ·   ·
     ── 광석(큐브) 고리: 반지름 1200 ~ 노드 수에 비례 ──
     ── 금광(구): 고리 바깥쪽 35% 구간 ──
     바닥: 30000 x 30000 (노드 3000개 부하 테스트까지 커버)
"""

import math
import unreal

MAP_PATH = "/Game/Maps/NetSample"
TAG = "OreRush"
FLOOR_SIZE = 30000.0          # cm
PLAYER_START_COUNT = 8
PLAYER_START_RADIUS = 700.0

level_subsystem = unreal.get_editor_subsystem(unreal.LevelEditorSubsystem)
actor_subsystem = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)


def log(message):
    unreal.log("[OreRush] " + message)


def open_or_create_map():
    if unreal.EditorAssetLibrary.does_asset_exist(MAP_PATH):
        level_subsystem.load_level(MAP_PATH)
        log("Loaded " + MAP_PATH)
    else:
        level_subsystem.new_level(MAP_PATH)
        log("Created " + MAP_PATH)


def clear_previous():
    removed = 0
    for actor in actor_subsystem.get_all_level_actors():
        if TAG in [str(t) for t in actor.tags]:
            actor_subsystem.destroy_actor(actor)
            removed += 1
    if removed:
        log("Removed %d previous actors" % removed)


def spawn(actor_class, label, location=(0, 0, 0), rotation=(0, 0, 0)):
    actor = actor_subsystem.spawn_actor_from_class(
        actor_class,
        unreal.Vector(*location),
        unreal.Rotator(roll=rotation[0], pitch=rotation[1], yaw=rotation[2]),
    )
    actor.set_actor_label(label)
    actor.set_editor_property("tags", [unreal.Name(TAG)])
    return actor


def build_floor():
    floor = spawn(unreal.StaticMeshActor, "Floor", (0, 0, -50))
    floor.static_mesh_component.set_static_mesh(unreal.load_asset("/Engine/BasicShapes/Cube.Cube"))
    scale = FLOOR_SIZE / 100.0
    floor.set_actor_scale3d(unreal.Vector(scale, scale, 1.0))   # 윗면이 Z=0


def build_lighting():
    sun = spawn(unreal.DirectionalLight, "Sun", (0, 0, 1000), (0, -45, 30))
    sun.light_component.set_editor_property("intensity", 8.0)
    try:
        sun.light_component.set_editor_property("atmosphere_sun_light", True)
    except Exception:
        pass

    spawn(unreal.SkyAtmosphere, "SkyAtmosphere")

    sky = spawn(unreal.SkyLight, "SkyLight", (0, 0, 500))
    try:
        sky.light_component.set_editor_property("real_time_capture", True)
    except Exception:
        pass

    spawn(unreal.ExponentialHeightFog, "HeightFog", (0, 0, 0))


def build_gameplay():
    # 납품 구역 (C++ ANSDepositZone). 박스 반높이 200 → 바닥에 붙도록 Z=200
    if hasattr(unreal, "NSDepositZone"):
        spawn(unreal.NSDepositZone, "DepositZone", (0, 0, 200))
    else:
        unreal.log_warning("[OreRush] NSDepositZone class not found. Build the C++ module first. (Server will spawn one at the origin.)")

    for i in range(PLAYER_START_COUNT):
        angle = 2.0 * math.pi * i / PLAYER_START_COUNT
        x = PLAYER_START_RADIUS * math.cos(angle)
        y = PLAYER_START_RADIUS * math.sin(angle)
        yaw = math.degrees(angle) + 180.0   # 중앙을 바라보게
        spawn(unreal.PlayerStart, "PlayerStart_%d" % (i + 1), (x, y, 100), (0, 0, yaw))


def main():
    open_or_create_map()
    clear_previous()
    build_floor()
    build_lighting()
    build_gameplay()
    level_subsystem.save_current_level()
    log("Done. Saved " + MAP_PATH)


main()
