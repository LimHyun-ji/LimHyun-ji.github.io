import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

// ---------------------------------------------------------------------------
// Exported contract
// ---------------------------------------------------------------------------
export type HelmetVariant = 'none' | 'knight' | 'horned';
export type ArmorVariant  = 'emerald' | 'gold' | 'steel';
export type WeaponVariant = 'none' | 'sword' | 'staff' | 'axe';

export interface Loadout {
  helmet: HelmetVariant;
  armor:  ArmorVariant;
  weapon: WeaponVariant;
  cape:   boolean;
}

export const DEFAULT_LOADOUT: Loadout = {
  helmet: 'knight',
  armor:  'emerald',
  weapon: 'sword',
  cape:   true,
};

export interface VisualDataScene {
  applyLoadout(next: Loadout, opts?: { highlight?: boolean }): void;
  setAutoRotate(on: boolean): void;
  resize(): void;
  dispose(): void;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------
export function createVisualDataScene(
  canvas: HTMLCanvasElement,
  initial: Loadout,
): Promise<VisualDataScene> {
  return new Promise((resolve) => {

    // -----------------------------------------------------------------------
    // Renderer
    // -----------------------------------------------------------------------
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.setClearColor(0x000000, 0);

    const initW = canvas.clientWidth  || 600;
    const initH = canvas.clientHeight || 400;
    renderer.setSize(initW, initH, false);

    // -----------------------------------------------------------------------
    // Scene & camera  — character ~1.95 units tall, torso framed
    // -----------------------------------------------------------------------
    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, initW / initH, 0.1, 100);
    camera.position.set(0, 1.3, 3.6);
    camera.lookAt(0, 1.1, 0);

    // -----------------------------------------------------------------------
    // Environment — PMREM reflections via RoomEnvironment
    // -----------------------------------------------------------------------
    const pmremGen = new THREE.PMREMGenerator(renderer);
    try {
      const roomEnv = new RoomEnvironment();
      scene.environment = pmremGen.fromScene(roomEnv).texture;
      roomEnv.dispose();
    } catch {
      // RoomEnvironment unavailable — lights-only fallback
    }
    pmremGen.dispose();

    // -----------------------------------------------------------------------
    // Lights — Emerald-Forge palette
    // -----------------------------------------------------------------------
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));

    const keyLight = new THREE.PointLight(0x3fd69a, 2.8, 22);
    keyLight.position.set(2.5, 3.5, 2.0);
    scene.add(keyLight);

    const fillLight = new THREE.PointLight(0xf2b23e, 1.6, 20);
    fillLight.position.set(-2.0, 2.5, 1.5);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.45);
    rimLight.position.set(0, 3, -4);
    scene.add(rimLight);

    // -----------------------------------------------------------------------
    // OrbitControls
    // -----------------------------------------------------------------------
    const controls = new OrbitControls(camera, canvas);
    controls.target.set(0, 1.1, 0);
    controls.enablePan       = false;
    controls.enableZoom      = true;
    controls.minDistance     = 1.8;
    controls.maxDistance     = 6.5;
    controls.autoRotateSpeed = 1.8;
    controls.update();

    // -----------------------------------------------------------------------
    // Palette
    // -----------------------------------------------------------------------
    const ARMOR_COLOR: Record<ArmorVariant, number> = {
      emerald: 0x3fd69a,
      gold:    0xf2b23e,
      steel:   0x9fb0ad,
    };

    // -----------------------------------------------------------------------
    // Shared base materials  (bodyMat is re-coloured by armor variant)
    // -----------------------------------------------------------------------
    const bodyMat = new THREE.MeshStandardMaterial({
      color:       ARMOR_COLOR[initial.armor],
      metalness:   0.62,
      roughness:   0.32,
      flatShading: true,
    });

    const skinMat = new THREE.MeshStandardMaterial({
      color:       0xffd5a8,
      metalness:   0.0,
      roughness:   0.82,
      flatShading: true,
    });

    // -----------------------------------------------------------------------
    // Local helpers
    // -----------------------------------------------------------------------
    function mkMesh(geo: THREE.BufferGeometry, mat: THREE.Material): THREE.Mesh {
      const m = new THREE.Mesh(geo, mat);
      m.castShadow = true;
      return m;
    }

    function mkStd(
      params: THREE.MeshStandardMaterialParameters,
    ): THREE.MeshStandardMaterial {
      return new THREE.MeshStandardMaterial({ flatShading: true, ...params });
    }

    /** Dispose all geometries and materials in an Object3D subtree. */
    function disposeObject(root: THREE.Object3D): void {
      root.traverse(child => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          const mats = Array.isArray(child.material)
            ? child.material
            : [child.material];
          mats.forEach(m => (m as THREE.Material).dispose());
        }
      });
    }

    /** Collect all MeshStandardMaterial instances in a subtree. */
    function extractStdMats(root: THREE.Object3D): THREE.MeshStandardMaterial[] {
      const acc: THREE.MeshStandardMaterial[] = [];
      root.traverse(child => {
        if (child instanceof THREE.Mesh) {
          const mats = Array.isArray(child.material)
            ? child.material
            : [child.material];
          mats.forEach(m => {
            if (m instanceof THREE.MeshStandardMaterial) acc.push(m);
          });
        }
      });
      return acc;
    }

    // -----------------------------------------------------------------------
    // Humanoid skeleton — all THREE primitives, flat-shaded low-poly look
    // Character proportions: feet y≈0, top-of-head y≈1.975
    // -----------------------------------------------------------------------
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // Torso  y 0.95 – 1.55
    const torsoMesh = mkMesh(new THREE.BoxGeometry(0.50, 0.60, 0.28), bodyMat);
    torsoMesh.position.set(0, 1.25, 0);

    // Pelvis y 0.85 – 1.05
    const pelvisMesh = mkMesh(new THREE.BoxGeometry(0.44, 0.20, 0.26), bodyMat);
    pelvisMesh.position.set(0, 0.95, 0);

    // Upper legs
    const ulGeo = new THREE.BoxGeometry(0.18, 0.32, 0.18);
    const ulL = mkMesh(ulGeo, bodyMat); ulL.position.set(-0.13, 0.69, 0);
    const ulR = mkMesh(ulGeo, bodyMat); ulR.position.set( 0.13, 0.69, 0);

    // Lower legs
    const llGeo = new THREE.BoxGeometry(0.15, 0.33, 0.16);
    const llL = mkMesh(llGeo, bodyMat); llL.position.set(-0.13, 0.365, 0);
    const llR = mkMesh(llGeo, bodyMat); llR.position.set( 0.13, 0.365, 0);

    // Feet
    const footGeo = new THREE.BoxGeometry(0.16, 0.10, 0.23);
    const footL = mkMesh(footGeo, bodyMat); footL.position.set(-0.13, 0.10, 0.04);
    const footR = mkMesh(footGeo, bodyMat); footR.position.set( 0.13, 0.10, 0.04);

    // Pauldrons (shoulder armour)
    const pGeo = new THREE.BoxGeometry(0.20, 0.16, 0.22);
    const pL = mkMesh(pGeo, bodyMat); pL.position.set(-0.36, 1.50, 0);
    const pR = mkMesh(pGeo, bodyMat); pR.position.set( 0.36, 1.50, 0);

    // Upper arms
    const uaGeo = new THREE.BoxGeometry(0.13, 0.29, 0.13);
    const uaL = mkMesh(uaGeo, bodyMat); uaL.position.set(-0.37, 1.22, 0);
    const uaR = mkMesh(uaGeo, bodyMat); uaR.position.set( 0.37, 1.22, 0);

    // Forearms (bare skin)
    const faGeo = new THREE.BoxGeometry(0.11, 0.26, 0.11);
    const faL = mkMesh(faGeo, skinMat); faL.position.set(-0.37, 0.96, 0);
    const faR = mkMesh(faGeo, skinMat); faR.position.set( 0.37, 0.96, 0);

    // Hands
    const handGeo = new THREE.BoxGeometry(0.11, 0.10, 0.09);
    const handL = mkMesh(handGeo, skinMat); handL.position.set(-0.37, 0.82, 0);
    const handR = mkMesh(handGeo, skinMat); handR.position.set( 0.37, 0.82, 0);

    // Neck
    const neckMesh = mkMesh(new THREE.BoxGeometry(0.14, 0.10, 0.14), skinMat);
    neckMesh.position.set(0, 1.62, 0);

    // Head — low-poly sphere (6×5 segments for faceted look)
    const headMesh = mkMesh(new THREE.SphereGeometry(0.175, 6, 5), skinMat);
    headMesh.position.set(0, 1.80, 0);

    rootGroup.add(
      torsoMesh, pelvisMesh,
      ulL, ulR, llL, llR, footL, footR,
      pL, pR, uaL, uaR, faL, faR,
      handL, handR, neckMesh, headMesh,
    );

    // Armour-driven meshes — used to scope emissive flash for armor changes
    const armorMeshes: THREE.MeshStandardMaterial[] = [
      torsoMesh, pelvisMesh,
      ulL, ulR, llL, llR, footL, footR,
      pL, pR, uaL, uaR,
    ]
      .map(m => m.material)
      .filter((m): m is THREE.MeshStandardMaterial =>
        m instanceof THREE.MeshStandardMaterial,
      );

    // -----------------------------------------------------------------------
    // Sockets — named empty Object3Ds parented to rootGroup
    // These mirror UE5 socket empties used in the VisualData attachment system
    // -----------------------------------------------------------------------
    const socketHead      = new THREE.Object3D();
    const socketRightHand = new THREE.Object3D();
    const socketBack      = new THREE.Object3D();

    socketHead.name      = 'socketHead';
    socketRightHand.name = 'socketRightHand';
    socketBack.name      = 'socketBack';

    // head centre y=1.80, r=0.175 → top of head ≈ y 1.975
    socketHead.position.set(0, 1.975, 0);
    // grip point just below right hand mesh centre
    socketRightHand.position.set(0.37, 0.77, 0);
    // mid-back of torso
    socketBack.position.set(0, 1.22, -0.155);

    rootGroup.add(socketHead, socketRightHand, socketBack);

    // -----------------------------------------------------------------------
    // Equipment builders — each constructs from primitives, returns a Group
    // -----------------------------------------------------------------------

    // ---- Helmets ----

    function buildHelmetKnight(): THREE.Group {
      const g  = new THREE.Group();
      const bm = mkStd({ color: 0x3a4a55, metalness: 0.82, roughness: 0.18 });
      const vm = mkStd({ color: 0x1a2530, metalness: 0.90, roughness: 0.10 });

      // Dome — upper 58% of a sphere (partial phi arc)
      g.add(mkMesh(
        new THREE.SphereGeometry(0.20, 6, 5, 0, Math.PI * 2, 0, Math.PI * 0.58),
        bm,
      ));

      // Cheek plates
      const cGeo = new THREE.BoxGeometry(0.07, 0.11, 0.09);
      for (const x of [-0.14, 0.14]) {
        const cp = mkMesh(cGeo, bm);
        cp.position.set(x, -0.11, 0.13);
        g.add(cp);
      }

      // Visor slit
      const visor = mkMesh(new THREE.BoxGeometry(0.19, 0.04, 0.06), vm);
      visor.position.set(0, -0.05, 0.18);
      g.add(visor);

      return g;
    }

    function buildHelmetHorned(): THREE.Group {
      const g       = buildHelmetKnight();
      const hornMat = mkStd({ color: 0xd4a520, metalness: 0.50, roughness: 0.38 });
      const hornGeo = new THREE.ConeGeometry(0.05, 0.30, 5);
      for (const x of [-0.16, 0.16]) {
        const horn = mkMesh(hornGeo, hornMat);
        horn.position.set(x, 0.17, 0);
        horn.rotation.z = x < 0 ? 0.28 : -0.28;
        g.add(horn);
      }
      return g;
    }

    // ---- Weapons ----

    function buildWeaponSword(): THREE.Group {
      const g        = new THREE.Group();
      const bladeMat = mkStd({ color: 0xd0e8ff, metalness: 0.96, roughness: 0.04 });
      const guardMat = mkStd({ color: 0xf2b23e, metalness: 0.80, roughness: 0.20 });
      const hiltMat  = mkStd({ color: 0x6b4c2a, metalness: 0.10, roughness: 0.80 });

      // Blade — hangs below socket (grip at local y≈0)
      const blade = mkMesh(new THREE.BoxGeometry(0.046, 0.56, 0.015), bladeMat);
      blade.position.y = -0.33;
      g.add(blade);

      // Crossguard
      const guard = mkMesh(new THREE.BoxGeometry(0.22, 0.04, 0.04), guardMat);
      guard.position.y = -0.03;
      g.add(guard);

      // Hilt (grip)
      const hilt = mkMesh(new THREE.BoxGeometry(0.04, 0.17, 0.04), hiltMat);
      hilt.position.y = 0.11;
      g.add(hilt);

      // Pommel sphere
      const pommel = mkMesh(new THREE.SphereGeometry(0.045, 5, 4), guardMat);
      pommel.position.y = 0.215;
      g.add(pommel);

      return g;
    }

    function buildWeaponStaff(): THREE.Group {
      const g        = new THREE.Group();
      const shaftMat = mkStd({ color: 0x6b4c2a, metalness: 0.10, roughness: 0.75 });
      const orbMat   = mkStd({
        color:             0x8ef0cd,
        metalness:         0.30,
        roughness:         0.20,
        emissive:          new THREE.Color(0x3fd69a),
        emissiveIntensity: 0.40,
      });

      const shaft = mkMesh(new THREE.BoxGeometry(0.055, 0.82, 0.055), shaftMat);
      shaft.position.y = -0.36;
      g.add(shaft);

      const orb = mkMesh(new THREE.SphereGeometry(0.10, 6, 5), orbMat);
      orb.position.y = 0.11;
      g.add(orb);

      return g;
    }

    function buildWeaponAxe(): THREE.Group {
      const g       = new THREE.Group();
      const headMat = mkStd({ color: 0x9fb0ad, metalness: 0.86, roughness: 0.14 });
      const hiltMat = mkStd({ color: 0x5a3d1e, metalness: 0.10, roughness: 0.82 });

      const handle = mkMesh(new THREE.BoxGeometry(0.055, 0.58, 0.055), hiltMat);
      handle.position.y = -0.23;
      g.add(handle);

      // Wide axe head — offset + slight rotation for distinct silhouette
      const axeHead = mkMesh(new THREE.BoxGeometry(0.30, 0.24, 0.07), headMat);
      axeHead.position.set(0.09, 0.08, 0);
      axeHead.rotation.z = -0.28;
      g.add(axeHead);

      // Back spike
      const spike = mkMesh(new THREE.BoxGeometry(0.09, 0.07, 0.05), headMat);
      spike.position.set(-0.10, 0.05, 0);
      g.add(spike);

      return g;
    }

    // ---- Cape ----

    function buildCape(): THREE.Group {
      const g = new THREE.Group();

      // Custom trapezoid — wider at top, narrows toward bottom, slight z-drape
      const positions = new Float32Array([
        -0.23,  0.00,  0.00,  //  0 top-L
         0.23,  0.00,  0.00,  //  1 top-R
        -0.17, -0.30, -0.04,  //  2 mid-L
         0.17, -0.30, -0.04,  //  3 mid-R
        -0.09, -0.62, -0.08,  //  4 bot-L
         0.09, -0.62, -0.08,  //  5 bot-R
      ]);
      const indices = new Uint16Array([0, 2, 1, 1, 2, 3, 2, 4, 3, 3, 4, 5]);
      const capeGeo = new THREE.BufferGeometry();
      capeGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      capeGeo.setIndex(new THREE.BufferAttribute(indices, 1));
      capeGeo.computeVertexNormals();

      g.add(mkMesh(
        capeGeo,
        mkStd({ color: 0x1a2c24, metalness: 0.0, roughness: 0.92, side: THREE.DoubleSide }),
      ));

      // Gold clasp at collar
      const clasp = mkMesh(
        new THREE.BoxGeometry(0.09, 0.045, 0.045),
        mkStd({ color: 0xf2b23e, metalness: 0.72, roughness: 0.28 }),
      );
      clasp.position.y = 0.022;
      g.add(clasp);

      return g;
    }

    // -----------------------------------------------------------------------
    // Emissive-pulse system  (~0.6 s sine arc, driven inside the render loop)
    // -----------------------------------------------------------------------
    interface PulseEntry {
      materials: THREE.MeshStandardMaterial[];
      startTime: number;
      duration:  number;
    }
    const pulses: PulseEntry[] = [];

    function triggerPulse(mats: THREE.MeshStandardMaterial[]): void {
      if (mats.length === 0) return;
      // Prime emissive colour; intensity starts at 0 and ramps up in the loop
      mats.forEach(m => { m.emissive.set(0x3fd69a); m.emissiveIntensity = 0; });
      pulses.push({ materials: mats, startTime: performance.now(), duration: 600 });
    }

    // -----------------------------------------------------------------------
    // Loadout state — diff-driven; only changed slots are rebuilt
    // Mirrors the VisualData PartialUpdate / TransitionRule pattern in UE5
    // -----------------------------------------------------------------------
    let currentLoadout: Loadout = { ...initial };
    let helmetGroup: THREE.Group | null = null;
    let weaponGroup: THREE.Group | null = null;
    let capeGroup:   THREE.Group | null = null;

    function applyHelmet(variant: HelmetVariant, hl: boolean): void {
      if (helmetGroup) {
        disposeObject(helmetGroup);
        socketHead.remove(helmetGroup);
        helmetGroup = null;
      }
      if (variant === 'none') return;
      helmetGroup = variant === 'knight' ? buildHelmetKnight() : buildHelmetHorned();
      socketHead.add(helmetGroup);
      if (hl) triggerPulse(extractStdMats(helmetGroup));
    }

    function applyWeapon(variant: WeaponVariant, hl: boolean): void {
      if (weaponGroup) {
        disposeObject(weaponGroup);
        socketRightHand.remove(weaponGroup);
        weaponGroup = null;
      }
      if (variant === 'none') return;
      if      (variant === 'sword') weaponGroup = buildWeaponSword();
      else if (variant === 'staff') weaponGroup = buildWeaponStaff();
      else                          weaponGroup = buildWeaponAxe();
      socketRightHand.add(weaponGroup);
      if (hl) triggerPulse(extractStdMats(weaponGroup));
    }

    function applyCape(enabled: boolean, hl: boolean): void {
      if (capeGroup) {
        disposeObject(capeGroup);
        socketBack.remove(capeGroup);
        capeGroup = null;
      }
      if (!enabled) return;
      capeGroup = buildCape();
      socketBack.add(capeGroup);
      if (hl) triggerPulse(extractStdMats(capeGroup));
    }

    function applyArmor(variant: ArmorVariant, hl: boolean): void {
      bodyMat.color.setHex(ARMOR_COLOR[variant]);
      if (hl) triggerPulse(armorMeshes);
    }

    // Seed initial state (no highlight; no diff needed on first run)
    applyHelmet(initial.helmet, false);
    applyWeapon(initial.weapon, false);
    applyCape(initial.cape,     false);
    // bodyMat already initialised with initial.armor colour above

    // -----------------------------------------------------------------------
    // Render / animation loop
    // -----------------------------------------------------------------------
    let rafId    = 0;
    let disposed = false;

    function tick(): void {
      if (disposed) return;
      rafId = requestAnimationFrame(tick);

      // Drive emissive pulses (sine arc: 0 → peak → 0 over 600 ms)
      const now = performance.now();
      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i];
        const t = (now - p.startTime) / p.duration; // 0..1
        if (t >= 1) {
          p.materials.forEach(m => { m.emissive.set(0x000000); m.emissiveIntensity = 0; });
          pulses.splice(i, 1);
        } else {
          const intensity = Math.sin(t * Math.PI) * 1.8; // peak ~1.8
          p.materials.forEach(m => { m.emissiveIntensity = intensity; });
        }
      }

      controls.update();
      renderer.render(scene, camera);
    }

    tick();

    // -----------------------------------------------------------------------
    // Public API
    // -----------------------------------------------------------------------
    const api: VisualDataScene = {

      applyLoadout(next: Loadout, opts?: { highlight?: boolean }): void {
        const hl = opts?.highlight ?? false;
        // Only rebuild the slots that actually changed
        if (next.helmet !== currentLoadout.helmet) applyHelmet(next.helmet, hl);
        if (next.armor  !== currentLoadout.armor)  applyArmor(next.armor,  hl);
        if (next.weapon !== currentLoadout.weapon) applyWeapon(next.weapon, hl);
        if (next.cape   !== currentLoadout.cape)   applyCape(next.cape,    hl);
        currentLoadout = { ...next };
      },

      setAutoRotate(on: boolean): void {
        controls.autoRotate = on;
      },

      resize(): void {
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        if (w === 0 || h === 0) return;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
      },

      dispose(): void {
        disposed = true;
        cancelAnimationFrame(rafId);
        controls.dispose();

        // Collect unique materials (shared instances must not be disposed twice)
        const matsToDispose = new Set<THREE.Material>();
        scene.traverse(obj => {
          if (obj instanceof THREE.Mesh) {
            obj.geometry.dispose();
            const mats = Array.isArray(obj.material)
              ? obj.material
              : [obj.material];
            mats.forEach(m => matsToDispose.add(m as THREE.Material));
          }
        });
        matsToDispose.forEach(m => m.dispose());

        if (scene.environment) {
          scene.environment.dispose();
          scene.environment = null;
        }
        renderer.dispose();
      },
    };

    resolve(api);
  });
}
