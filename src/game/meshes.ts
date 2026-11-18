import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { distToPath, layout, type Path, type TowerKind } from "./balance";
import { makeEagle, makeFlame, makePennant, makePerson, makeShield, paint } from "./figures";

const BODY = new THREE.MeshStandardMaterial({
  vertexColors: true,
  roughness: 0.78,
  metalness: 0.06,
  flatShading: true,
});

const UNIT = {
  box: new THREE.BoxGeometry(1, 1, 1),
  sph: new THREE.SphereGeometry(1, 10, 8),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 8),
  cone: new THREE.ConeGeometry(1, 1, 8),
  ico: new THREE.IcosahedronGeometry(1, 0),
  dod: new THREE.DodecahedronGeometry(1, 0),
};

const _c = new THREE.Color();
const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();
const _e = new THREE.Euler();

function stamp(
  template: THREE.BufferGeometry,
  hex: string,
  x: number,
  y: number,
  z: number,
  rx = 0,
  ry = 0,
  rz = 0,
  sx = 1,
  sy = 1,
  sz = 1,
) {
  const g = template.clone();
  _p.set(x, y, z);
  _e.set(rx, ry, rz);
  _q.setFromEuler(_e);
  _s.set(sx, sy, sz);
  _m.compose(_p, _q, _s);
  g.applyMatrix4(_m);
  if (g.getAttribute("uv")) g.deleteAttribute("uv");
  _c.set(hex);
  const pos = g.getAttribute("position");
  const arr = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const n = 0.9 + 0.14 * Math.abs(Math.sin(pos.getX(i) * 9.1 + pos.getY(i) * 6.3 + pos.getZ(i) * 7.7));
    arr[i * 3] = _c.r * n;
    arr[i * 3 + 1] = _c.g * n;
    arr[i * 3 + 2] = _c.b * n;
  }
  g.setAttribute("color", new THREE.BufferAttribute(arr, 3));
  if (g.index) {
    const flat = g.toNonIndexed();
    g.dispose();
    return flat;
  }
  return g;
}

function fuse(parts: THREE.BufferGeometry[], name = "body", material: THREE.Material = BODY) {
  const geo = mergeGeometries(parts, false);
  if (!geo) throw new Error("mesh merge failed");
  for (const part of parts) part.dispose();
  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = true;
  mesh.name = name;
  return mesh;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const worldTime = { value: 0 };
const riverTime = { value: 0 };

export function tickScenery(time: number) {
  worldTime.value = time;
  riverTime.value = time;
}

const SCENERY = new THREE.MeshStandardMaterial({
  vertexColors: true,
  roughness: 0.92,
  metalness: 0.02,
});

const FOLIAGE = new THREE.MeshStandardMaterial({
  vertexColors: true,
  roughness: 0.88,
  metalness: 0,
});
FOLIAGE.onBeforeCompile = (shader) => {
  shader.uniforms.uTime = worldTime;
  shader.vertexShader = shader.vertexShader
    .replace("#include <common>", "#include <common>\nuniform float uTime;")
    .replace(
      "#include <begin_vertex>",
      `#include <begin_vertex>
       float sway = sin(uTime * 1.25 + position.y * 1.4) * position.y * 0.035;
       transformed.x += sway;
       transformed.z += cos(uTime * 1.05 + position.y) * position.y * 0.02;`,
    );
};

const TUNIC = "#9e2d2a";
const METAL = "#c5ccd2";
const BRONZE = "#a8844a";
const WOOD = "#7a4e2e";
const STONE = "#d5ccbe";
const STONE2 = "#b7ab9a";
const OLIVE = "#6e8a42";
const OLIVE2 = "#3f5a30";

const PLANK = new THREE.BoxGeometry(1, 1, 1);
const POST = new THREE.CylinderGeometry(1, 1, 1, 8);
const CAULDRON = new THREE.LatheGeometry(
  [
    new THREE.Vector2(0.05, 0),
    new THREE.Vector2(0.22, 0.06),
    new THREE.Vector2(0.26, 0.22),
    new THREE.Vector2(0.16, 0.34),
    new THREE.Vector2(0.2, 0.4),
  ],
  12,
);

function timber(
  geo: THREE.BufferGeometry,
  material: THREE.Material,
  x: number,
  y: number,
  z: number,
  rx = 0,
  ry = 0,
  rz = 0,
  sx = 1,
  sy = 1,
  sz = 1,
) {
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.set(x, y, z);
  mesh.rotation.set(rx, ry, rz);
  mesh.scale.set(sx, sy, sz);
  mesh.castShadow = true;
  return mesh;
}

function hangPennant(parent: THREE.Object3D, color: string, y: number, z = -0.15) {
  const flag = makePennant(color);
  flag.position.set(0.02, y, z);
  parent.add(flag);
  const pole = timber(POST, paint(WOOD, 0.84, 0.04), 0, y - 0.28, z, 0, 0, 0, 0.025, 0.7, 0.025);
  parent.add(pole);
}

export { makeEnemy } from "./figures";

export function makeTower(kind: TowerKind) {
  const g = new THREE.Group();
  g.name = kind;
  const color =
    kind === "scorpio"
      ? "#c4a15a"
      : kind === "sagittarii"
        ? "#8ea36a"
        : kind === "cohort"
          ? TUNIC
          : kind === "ballista"
            ? "#e3c16e"
            : kind === "naphtha"
              ? "#e07a32"
              : "#8aa0ad";
  const wood = paint(WOOD, 0.84, 0.04);
  const bronze = paint(BRONZE, 0.4, 0.66);
  const metal = paint(METAL, 0.32, 0.74);
  g.add(
    fuse([
      stamp(UNIT.cyl, STONE, 0, 0.1, 0, 0, 0, 0, 0.85, 0.2, 0.85),
      stamp(UNIT.cyl, STONE2, 0, 0.22, 0, 0, 0, 0, 0.62, 0.08, 0.62),
    ]),
  );
  const aim = new THREE.Group();
  aim.name = "aim";
  g.add(aim);

  if (kind === "scorpio") {
    aim.add(timber(PLANK, wood, 0, 0.42, 0, 0, 0, 0, 0.22, 0.1, 0.85));
    aim.add(timber(PLANK, wood, -0.12, 0.55, 0, 0, 0, 0, 0.06, 0.22, 0.7));
    aim.add(timber(PLANK, wood, 0.12, 0.55, 0, 0, 0, 0, 0.06, 0.22, 0.7));
    aim.add(timber(POST, bronze, 0, 0.62, -0.05, 0, 0, Math.PI / 2, 0.05, 0.34, 0.05));
    const arm = new THREE.Group();
    arm.name = "arm";
    arm.position.set(0, 0.66, 0.05);
    arm.userData.rest = -0.22;
    arm.add(timber(POST, wood, -0.24, 0.05, 0, 0, 0, 0.85, 0.035, 0.42, 0.035));
    arm.add(timber(POST, wood, 0.24, 0.05, 0, 0, 0, -0.85, 0.035, 0.42, 0.035));
    arm.add(timber(POST, metal, 0, 0.02, 0.22, Math.PI / 2, 0, 0, 0.025, 0.42, 0.025));
    arm.add(timber(POST, bronze, 0, 0.02, 0.4, Math.PI / 2, 0, 0, 0.04, 0.12, 0.04));
    aim.add(arm);
    hangPennant(aim, color, 1.05);
  } else if (kind === "ballista") {
    aim.add(timber(PLANK, wood, 0, 0.42, 0, 0, 0, 0, 0.85, 0.1, 0.36));
    aim.add(timber(PLANK, wood, 0, 0.5, 0, 0, 0, 0, 0.12, 0.12, 1.05));
    aim.add(timber(POST, bronze, -0.28, 0.62, -0.05, 0, 0, Math.PI / 2, 0.07, 0.22, 0.07));
    aim.add(timber(POST, bronze, 0.28, 0.62, -0.05, 0, 0, Math.PI / 2, 0.07, 0.22, 0.07));
    const arm = new THREE.Group();
    arm.name = "arm";
    arm.position.set(0, 0.72, 0);
    arm.userData.rest = -0.12;
    arm.add(timber(POST, wood, -0.42, 0.08, 0, 0, 0, 1.05, 0.04, 0.55, 0.04));
    arm.add(timber(POST, wood, 0.42, 0.08, 0, 0, 0, -1.05, 0.04, 0.55, 0.04));
    arm.add(timber(POST, metal, 0, 0.02, 0.28, Math.PI / 2, 0, 0, 0.035, 0.7, 0.035));
    arm.add(timber(POST, bronze, 0, 0.02, 0.62, Math.PI / 2, 0, 0, 0.055, 0.16, 0.055));
    aim.add(arm);
    hangPennant(aim, color, 1.2);
  } else if (kind === "onager") {
    aim.add(timber(PLANK, wood, -0.28, 0.55, 0, 0, 0, 0, 0.08, 0.55, 0.72));
    aim.add(timber(PLANK, wood, 0.28, 0.55, 0, 0, 0, 0, 0.08, 0.55, 0.72));
    aim.add(timber(PLANK, wood, 0, 0.4, -0.28, 0, 0, 0, 0.62, 0.08, 0.08));
    aim.add(timber(POST, bronze, 0, 0.72, -0.02, 0, 0, Math.PI / 2, 0.05, 0.5, 0.05));
    const arm = new THREE.Group();
    arm.name = "arm";
    arm.position.set(0, 0.72, -0.02);
    arm.userData.rest = -0.95;
    arm.rotation.x = -0.95;
    arm.add(timber(PLANK, wood, 0, 0.38, 0, 0, 0, 0, 0.08, 0.78, 0.08));
    arm.add(timber(PLANK, wood, 0, 0.74, 0.08, 0, 0, 0, 0.2, 0.08, 0.2));
    arm.add(timber(new THREE.SphereGeometry(0.1, 8, 6), paint(STONE2, 0.95, 0.02), 0, 0.74, 0.12));
    aim.add(arm);
    hangPennant(aim, color, 1.15, -0.35);
  } else if (kind === "cohort") {
    for (const x of [-0.34, 0, 0.34]) {
      const man = makePerson({
        cloth: TUNIC,
        hair: "#2a211c",
        weapon: "spear",
        shield: TUNIC,
        helm: true,
        crest: x === 0 ? "#e3c16e" : TUNIC,
        metal: METAL,
        k: 0.68,
        name: "soldier",
      });
      man.position.set(x, 0.2, 0);
      aim.add(man);
    }
    hangPennant(aim, color, 1.45);
  } else if (kind === "naphtha") {
    for (const [x, z] of [
      [-0.28, -0.28],
      [0.28, -0.28],
      [-0.28, 0.28],
      [0.28, 0.28],
    ] as const) {
      aim.add(timber(POST, wood, x, 0.7, z, 0, 0, 0, 0.045, 0.95, 0.045));
    }
    aim.add(timber(POST, wood, 0, 1.12, 0, 0, 0, 0, 0.38, 0.08, 0.38));
    aim.add(timber(CAULDRON, bronze, 0, 1.18, 0));
    const flame = makeFlame(0.18, 0.36, 0.18);
    flame.position.set(0, 1.52, 0);
    aim.add(flame);
    const tender = makePerson({
      cloth: "#6a3a28",
      hair: "#2a211c",
      weapon: "none",
      k: 0.55,
      name: "soldier",
    });
    tender.position.set(0.42, 0.2, 0.05);
    aim.add(tender);
    hangPennant(aim, color, 1.7);
  } else {
    for (const [x, z] of [
      [-0.32, -0.32],
      [0.32, -0.32],
      [-0.32, 0.32],
      [0.32, 0.32],
    ] as const) {
      aim.add(timber(POST, wood, x, 0.85, z, 0, 0, 0, 0.045, 1.25, 0.045));
    }
    aim.add(timber(PLANK, wood, 0, 1.42, 0, 0, 0, 0, 0.82, 0.08, 0.82));
    aim.add(timber(new THREE.ConeGeometry(0.48, 0.42, 8), paint("#6a3a28", 0.86, 0.03), 0, 1.68, 0));
    for (const [x, z, tunic] of [
      [-0.16, 0, TUNIC],
      [0.16, 0.04, "#8ea36a"],
    ] as const) {
      const man = makePerson({
        cloth: tunic,
        hair: "#222018",
        weapon: "bow",
        helm: true,
        metal: METAL,
        k: 0.5,
        name: "soldier",
      });
      man.position.set(x, 1.46, z);
      aim.add(man);
    }
    hangPennant(aim, color, 2.05);
  }

  g.traverse((obj) => {
    if (obj instanceof THREE.Mesh && obj.name !== "flame") obj.castShadow = true;
  });
  return g;
}

export function makeProjectile(visual: "arrow" | "bolt" | "pilum" | "stone" | "pot") {
  if (visual === "stone") {
    const rock = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), paint(STONE2, 0.95, 0.02));
    rock.scale.set(1, 0.82, 1);
    rock.castShadow = true;
    return rock;
  }
  if (visual === "pot") {
    const g = new THREE.Group();
    const pot = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), paint("#6a3a28", 0.8, 0.05));
    pot.scale.set(1, 0.85, 1);
    pot.castShadow = true;
    g.add(pot);
    const flame = makeFlame(0.09, 0.18, 0.09);
    flame.position.y = 0.1;
    g.add(flame);
    return g;
  }
  const len = visual === "bolt" ? 0.62 : visual === "pilum" ? 0.5 : 0.4;
  const thick = visual === "bolt" ? 0.028 : 0.012;
  const group = new THREE.Group();
  const shaftMat = paint(visual === "pilum" ? WOOD : METAL, visual === "pilum" ? 0.8 : 0.35, visual === "pilum" ? 0.05 : 0.7);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(thick, thick, len, 6), shaftMat);
  shaft.rotation.x = Math.PI / 2;
  shaft.castShadow = true;
  const head = new THREE.Mesh(new THREE.ConeGeometry(thick * 2.1, 0.12, 6), paint("#eee6d6", 0.35, 0.55));
  head.rotation.x = Math.PI / 2;
  head.position.z = len * 0.5;
  group.add(shaft, head);
  if (visual !== "pilum") {
    const fletch = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.012, 0.08), paint("#9e2d2a", 0.7, 0.02));
    fletch.position.z = -len * 0.42;
    group.add(fletch);
  }
  return group;
}

export function makePad() {
  const g = new THREE.Group();
  g.add(fuse([stamp(UNIT.cyl, STONE, 0, 0.08, 0, 0, 0, 0, 0.72, 0.14, 0.72), stamp(UNIT.cyl, STONE2, 0, 0.16, 0, 0, 0, 0, 0.48, 0.05, 0.48)]));
  const plus = fuse([
    stamp(UNIT.box, "#8d7b58", 0, 0.24, 0, 0, 0, 0, 0.28, 0.04, 0.06),
    stamp(UNIT.box, "#8d7b58", 0, 0.24, 0, 0, 0, 0, 0.06, 0.04, 0.28),
  ]);
  plus.name = "plus";
  g.add(plus);
  return g;
}

export function makeFort() {
  const root = new THREE.Group();
  root.add(
    fuse([
      stamp(UNIT.cyl, "#cbbfa8", 0, 0.08, 1.05, 0, 0, 0, 3.5, 0.16, 2.15),
      stamp(UNIT.box, "#b7a78c", 0, 0.18, 1.15, 0, 0, 0, 4.4, 0.08, 3.1),
    ]),
  );
  const tent = fuse([
    stamp(UNIT.cone, TUNIC, 0, 0.85, 1.7, 0, 0, 0, 0.7, 0.85, 0.9),
    stamp(UNIT.box, WOOD, 0.55, 0.7, 1.7, 0, 0, 0, 0.06, 1.15, 0.06),
  ]);
  tent.name = "tent";
  root.add(tent);
  const eagle = makeEagle();
  eagle.position.set(0.55, 1.32, 1.7);
  eagle.scale.setScalar(0.85);
  root.add(eagle);

  const posts: THREE.BufferGeometry[] = [];
  for (let i = -4; i <= 4; i++) {
    if (Math.abs(i) <= 1) continue;
    posts.push(stamp(UNIT.cyl, "#6b4a2c", i * 0.72, 0.55, 0.05, 0, 0, 0, 0.07, 0.85, 0.07));
    posts.push(stamp(UNIT.cone, "#6b4a2c", i * 0.72, 1.05, 0.05, 0, 0, 0, 0.09, 0.22, 0.09));
  }
  for (const x of [-3.15, 3.15]) {
    for (let z = 0.4; z <= 2.4; z += 0.7) {
      posts.push(stamp(UNIT.cyl, "#6b4a2c", x, 0.55, z, 0, 0, 0, 0.07, 0.85, 0.07));
      posts.push(stamp(UNIT.cone, "#6b4a2c", x, 1.05, z, 0, 0, 0, 0.09, 0.22, 0.09));
    }
  }
  const palisade = fuse(posts);
  palisade.name = "palisade";
  const palGroup = new THREE.Group();
  palGroup.name = "palisade";
  palGroup.add(palisade);
  root.add(palGroup);

  const wallBits: THREE.BufferGeometry[] = [];
  const wallSeg = (x: number, z: number, sx: number, sz: number) => {
    wallBits.push(stamp(UNIT.box, STONE, x, 0.55, z, 0, 0, 0, sx, 0.7, sz));
    const n = Math.max(1, Math.round(sx / 0.45));
    for (let i = 0; i < n; i++) {
      const ox = x - sx / 2 + 0.28 + i * (sx / n);
      wallBits.push(stamp(UNIT.box, STONE2, ox, 0.98, z, 0, 0, 0, 0.22, 0.22, sz * 0.9));
    }
  };
  wallSeg(-2.15, 0.05, 1.7, 0.38);
  wallSeg(2.15, 0.05, 1.7, 0.38);
  wallSeg(-3.15, 1.3, 0.38, 2.2);
  wallSeg(3.15, 1.3, 0.38, 2.2);
  wallSeg(0, 2.45, 5.6, 0.38);
  const curtain = new THREE.Group();
  curtain.name = "curtain";
  curtain.add(fuse(wallBits));
  root.add(curtain);

  const gate = new THREE.Group();
  gate.name = "gatehouse";
  gate.add(
    fuse([
      stamp(UNIT.box, STONE, -1.15, 0.95, 0.05, 0, 0, 0, 0.7, 1.5, 0.7),
      stamp(UNIT.box, STONE, 1.15, 0.95, 0.05, 0, 0, 0, 0.7, 1.5, 0.7),
      stamp(UNIT.box, STONE2, 0, 1.55, 0.05, 0, 0, 0, 1.5, 0.28, 0.62),
      stamp(UNIT.box, "#5a3822", -0.28, 0.55, 0.08, 0, 0, 0, 0.16, 0.9, 0.08),
      stamp(UNIT.box, "#6a4530", -0.08, 0.55, 0.08, 0, 0, 0, 0.16, 0.9, 0.08),
      stamp(UNIT.box, "#5a3822", 0.12, 0.55, 0.08, 0, 0, 0, 0.16, 0.9, 0.08),
      stamp(UNIT.box, "#6a4530", 0.3, 0.55, 0.08, 0, 0, 0, 0.16, 0.9, 0.08),
      stamp(UNIT.box, BRONZE, 0, 0.85, 0.14, 0, 0, 0, 0.95, 0.06, 0.06),
      stamp(UNIT.box, BRONZE, 0, 0.42, 0.14, 0, 0, 0, 0.95, 0.06, 0.06),
    ]),
  );
  for (const x of [-1.15, 1.15]) {
    const flame = makeFlame(0.14, 0.3, 0.14);
    flame.position.set(x, 1.82, 0.05);
    gate.add(flame);
  }
  const gateFlag = makePennant(TUNIC);
  gateFlag.position.set(0.15, 1.72, 0.2);
  gate.add(gateFlag);
  root.add(gate);

  const principia = new THREE.Group();
  principia.name = "principia";
  principia.add(
    fuse([
      stamp(UNIT.box, STONE, 0, 0.7, 1.7, 0, 0, 0, 1.8, 0.9, 1.3),
      stamp(UNIT.box, TUNIC, 0, 1.28, 1.7, 0, 0.15, 0, 2.05, 0.1, 1.55),
      stamp(UNIT.box, "#f3e6d0", 0, 0.85, 1.08, 0, 0, 0, 0.5, 0.72, 0.06),
      stamp(UNIT.cyl, STONE2, -0.62, 0.72, 1.08, 0, 0, 0, 0.07, 1.15, 0.07),
      stamp(UNIT.cyl, STONE2, -0.22, 0.72, 1.08, 0, 0, 0, 0.07, 1.15, 0.07),
      stamp(UNIT.cyl, STONE2, 0.22, 0.72, 1.08, 0, 0, 0, 0.07, 1.15, 0.07),
      stamp(UNIT.cyl, STONE2, 0.62, 0.72, 1.08, 0, 0, 0, 0.07, 1.15, 0.07),
      stamp(UNIT.cyl, BRONZE, 0, 1.55, 1.05, 0, 0, 0, 0.035, 0.7, 0.035),
    ]),
  );
  const aquila = makeEagle();
  aquila.position.set(0, 1.95, 1.05);
  aquila.scale.setScalar(0.7);
  principia.add(aquila);
  root.add(principia);

  for (const [x, z, ry] of [
    [-2.4, 0.05, 0],
    [2.4, 0.05, 0],
    [-3.15, 0.9, Math.PI / 2],
    [3.15, 1.7, -Math.PI / 2],
  ] as const) {
    const shield = makeShield(TUNIC);
    shield.position.set(x, 0.85, z);
    shield.rotation.y = ry;
    shield.scale.setScalar(0.55);
    curtain.add(shield);
  }

  const hit = new THREE.Mesh(
    new THREE.CylinderGeometry(1.35, 1.35, 1.6, 8),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
  );
  hit.position.set(0, 0.8, 1.55);
  hit.userData.fort = true;
  hit.name = "fort-hit";
  root.add(hit);
  root.userData.fort = true;
  return root;
}

export function makeGround(path: Path) {
  const geo = new THREE.PlaneGeometry(56, 48, 48, 40);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.getAttribute("position");
  const colors = new Float32Array(pos.count * 3);
  const a = new THREE.Color("#6f8c45");
  const b = new THREE.Color("#8eaa5c");
  const c = new THREE.Color("#5d7636");
  const dry = new THREE.Color("#c6b088");
  const water = new THREE.Color("#2f6c72");
  const col = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const n = Math.sin(x * 0.35) * Math.cos(z * 0.32) * 0.5 + Math.sin(x * 1.15 + z * 0.8) * 0.25 + 0.5;
    let minD = distToPath(path, x, z);
    const edge = Math.min(1, minD / 8);
    const y = Math.max(0, n - 0.45) * 1.7 * edge * edge;
    pos.setY(i, y);
    col.copy(a).lerp(b, n * 0.8).lerp(c, Math.min(1, y * 0.8));
    if (minD < 2.4) col.lerp(dry, (1 - minD / 2.4) * 0.55);
    if (x < -10.5) col.lerp(water, Math.min(1, (-10.5 - x) / 3));
    colors[i * 3] = col.r;
    colors[i * 3 + 1] = col.g;
    colors[i * 3 + 2] = col.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 }),
  );
  mesh.receiveShadow = true;
  mesh.name = "ground";
  return mesh;
}

export function makeRoad(path: Path) {
  const parts: THREE.BufferGeometry[] = [];
  const samples = 90;
  const left: number[] = [];
  const right: number[] = [];
  for (let i = 0; i <= samples; i++) {
    const s = path.sample((path.total * i) / samples);
    left.push(s.x + s.nx * 0.95, 0.05, s.z + s.nz * 0.95);
    right.push(s.x - s.nx * 0.95, 0.05, s.z - s.nz * 0.95);
    if (i % 3 === 0) {
      parts.push(stamp(UNIT.dod, STONE2, s.x + s.nx * 1.05, 0.08, s.z + s.nz * 1.05, 0, i, 0, 0.1, 0.08, 0.12));
      parts.push(stamp(UNIT.dod, STONE2, s.x - s.nx * 1.05, 0.08, s.z - s.nz * 1.05, 0, i * 0.7, 0, 0.1, 0.08, 0.12));
    }
  }
  const positions = new Float32Array((samples + 1) * 6);
  for (let i = 0; i <= samples; i++) {
    positions.set(left.slice(i * 3, i * 3 + 3), i * 6);
    positions.set(right.slice(i * 3, i * 3 + 3), i * 6 + 3);
  }
  const indices: number[] = [];
  for (let i = 0; i < samples; i++) {
    const a0 = i * 2;
    indices.push(a0, a0 + 1, a0 + 2, a0 + 1, a0 + 3, a0 + 2);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setIndex(indices);
  const roadCol = new Float32Array(positions.length);
  const dust = new THREE.Color("#a97848");
  for (let i = 0; i < roadCol.length; i += 3) {
    const n = 0.9 + Math.abs(Math.sin(positions[i]! * 3 + positions[i + 2]!)) * 0.15;
    roadCol[i] = dust.r * n;
    roadCol[i + 1] = dust.g * n;
    roadCol[i + 2] = dust.b * n;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(roadCol, 3));
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 }),
  );
  mesh.receiveShadow = true;
  mesh.name = "road";
  const group = new THREE.Group();
  group.add(mesh);
  if (parts.length) group.add(fuse(parts, "kerb"));
  return group;
}

export function makeRiver() {
  const geo = new THREE.PlaneGeometry(4.6, 38, 18, 48);
  const mesh = new THREE.Mesh(
    geo,
    new THREE.ShaderMaterial({
      transparent: true,
      uniforms: { uTime: riverTime },
      vertexShader: `
        uniform float uTime;
        varying vec2 vUv;
        varying float vCrest;
        void main() {
          vUv = uv;
          vec3 p = position;
          float crest = sin(p.y * 0.55 + uTime * 1.35) * 0.07 + sin(p.x * 1.8 + uTime * 0.8) * 0.035;
          p.z += crest;
          vCrest = crest;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        uniform float uTime;
        varying vec2 vUv;
        varying float vCrest;
        void main() {
          vec3 deep = vec3(0.07, 0.28, 0.32);
          vec3 mid = vec3(0.16, 0.52, 0.55);
          vec3 foam = vec3(0.78, 0.88, 0.84);
          float rip = sin(vUv.y * 46.0 + uTime * 1.7) * sin(vUv.x * 16.0 - uTime * 0.6);
          vec3 col = mix(deep, mid, clamp(vUv.x + rip * 0.18, 0.0, 1.0));
          col = mix(col, foam, smoothstep(0.04, 0.09, vCrest));
          float bank = smoothstep(0.0, 0.08, vUv.x) * smoothstep(1.0, 0.9, vUv.x);
          gl_FragColor = vec4(col, 0.55 + bank * 0.35);
        }
      `,
    }),
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(-13.7, 0.05, -1);
  mesh.receiveShadow = true;
  mesh.name = "river";
  return mesh;
}

export function makeSky() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const g = canvas.getContext("2d");
  if (!g) return new THREE.Mesh();
  const grd = g.createLinearGradient(0, 0, 0, 512);
  grd.addColorStop(0, "#3d6ea8");
  grd.addColorStop(0.28, "#7eb0d4");
  grd.addColorStop(0.52, "#f0c08a");
  grd.addColorStop(0.68, "#f6d7b0");
  grd.addColorStop(1, "#e7c49a");
  g.fillStyle = grd;
  g.fillRect(0, 0, 1024, 512);
  const sun = g.createRadialGradient(760, 300, 8, 760, 300, 90);
  sun.addColorStop(0, "rgba(255,244,210,0.95)");
  sun.addColorStop(0.35, "rgba(255,196,120,0.55)");
  sun.addColorStop(1, "rgba(255,180,90,0)");
  g.fillStyle = sun;
  g.fillRect(0, 0, 1024, 512);
  g.fillStyle = "rgba(255,255,255,0.22)";
  const clouds = [
    [140, 90, 90],
    [220, 120, 70],
    [480, 70, 110],
    [860, 100, 80],
    [640, 150, 60],
  ];
  for (const [x, y, r] of clouds) {
    g.beginPath();
    g.ellipse(x, y, r, r * 0.38, 0, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.ellipse(x + r * 0.45, y + 6, r * 0.7, r * 0.3, 0, 0, Math.PI * 2);
    g.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(90, 32, 20),
    new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, depthWrite: false }),
  );
  mesh.name = "sky";
  mesh.frustumCulled = false;
  return mesh;
}

export function makeEntry() {
  const g = new THREE.Group();
  g.add(
    fuse([
      stamp(UNIT.cyl, WOOD, -0.85, 0.7, 0, 0, 0, 0, 0.08, 1.3, 0.08),
      stamp(UNIT.cyl, WOOD, 0.85, 0.7, 0, 0, 0, 0, 0.08, 1.3, 0.08),
      stamp(UNIT.box, WOOD, 0, 1.35, 0, 0, 0, 0, 1.9, 0.1, 0.1),
    ]),
  );
  const flag = makePennant(TUNIC);
  flag.position.set(0.05, 1.15, 0.06);
  g.add(flag);
  return g;
}

export function makeScenery(path: Path) {
  const root = new THREE.Group();
  const rng = mulberry32(11);
  const fort = layout.fort;
  const cone = new THREE.ConeGeometry(1, 1, 10);
  const cyl = new THREE.CylinderGeometry(1, 1, 1, 8);
  const blob = new THREE.SphereGeometry(1, 8, 6);
  const cypress = fuse([
    stamp(cyl, "#6a4a30", 0, 0.28, 0, 0, 0, 0, 0.07, 0.55, 0.07),
    stamp(cone, OLIVE2, 0, 0.85, 0, 0, 0, 0, 0.42, 1.05, 0.42),
    stamp(cone, OLIVE, 0, 1.35, 0, 0, 0.2, 0, 0.3, 0.9, 0.3),
    stamp(cone, "#8eaa5c", 0, 1.8, 0, 0, 0, 0, 0.18, 0.65, 0.18),
  ]);
  const olive = fuse([
    stamp(cyl, "#6a4a30", 0, 0.32, 0, 0, 0.3, 0, 0.08, 0.65, 0.1),
    stamp(blob, OLIVE, 0, 1.05, 0, 0, 0, 0, 0.48, 0.34, 0.48),
    stamp(blob, OLIVE2, 0.28, 0.95, 0.12, 0, 0.4, 0, 0.3, 0.24, 0.3),
    stamp(blob, "#8eaa5c", -0.22, 0.98, -0.08, 0, 0.8, 0, 0.26, 0.22, 0.26),
  ]);
  const rock = fuse([
    stamp(UNIT.dod, STONE2, 0, 0.16, 0, 0.2, 0.4, 0, 0.32, 0.2, 0.26),
    stamp(UNIT.dod, STONE, 0.16, 0.12, 0.08, 0.5, 0.2, 0.3, 0.18, 0.14, 0.16),
  ]);
  const flower = fuse([
    stamp(cyl, "#6e8a42", 0, 0.1, 0, 0, 0, 0, 0.015, 0.2, 0.015),
    stamp(blob, "#f0e2a0", 0, 0.24, 0, 0, 0, 0, 0.045, 0.045, 0.045),
    stamp(blob, "#e7c49a", 0.05, 0.23, 0, 0, 0, 0, 0.03, 0.03, 0.03),
    stamp(blob, "#f4efe6", -0.04, 0.23, 0.02, 0, 0, 0, 0.028, 0.028, 0.028),
  ]);
  const grass = fuse([
    stamp(cone, OLIVE, 0, 0.16, 0, 0, 0, 0.2, 0.05, 0.32, 0.05),
    stamp(cone, OLIVE2, 0.05, 0.14, 0.02, 0, 0, -0.3, 0.04, 0.26, 0.04),
    stamp(cone, "#8eaa5c", -0.04, 0.13, -0.02, 0.1, 0, 0.4, 0.035, 0.24, 0.035),
  ]);

  const place = (
    proto: THREE.Mesh,
    material: THREE.Material,
    count: number,
    minDist: number,
    scale: [number, number],
  ) => {
    const inst = new THREE.InstancedMesh(proto.geometry, material, count);
    inst.castShadow = true;
    inst.receiveShadow = false;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    let n = 0;
    let tries = 0;
    while (n < count && tries < count * 40) {
      tries++;
      const far = rng() < 0.28;
      const x = far ? -16 + rng() * 3.2 : (rng() * 2 - 1) * 16;
      const z = (rng() * 2 - 1) * 14;
      if (!far && distToPath(path, x, z) < minDist) continue;
      if (Math.hypot(x - fort.x, z - fort.z) < 4.2) continue;
      if (layout.pads.some((p) => Math.hypot(p.x - x, p.z - z) < 1.7)) continue;
      const s = scale[0] + rng() * (scale[1] - scale[0]);
      q.setFromAxisAngle(_p.set(0, 1, 0), rng() * Math.PI * 2);
      m.compose(_p.set(x, 0, z), q, _s.set(s, s * (0.85 + rng() * 0.4), s));
      inst.setMatrixAt(n, m);
      n++;
    }
    inst.count = n;
    inst.instanceMatrix.needsUpdate = true;
    if (n > 0) root.add(inst);
    else inst.geometry.dispose();
  };

  place(cypress, FOLIAGE, 26, 2.8, [0.9, 1.55]);
  place(olive, FOLIAGE, 18, 2.9, [0.85, 1.45]);
  place(rock, SCENERY, 22, 1.7, [0.55, 1.6]);
  place(flower, FOLIAGE, 40, 1.35, [0.7, 1.25]);
  place(grass, FOLIAGE, 70, 1.15, [0.7, 1.4]);

  const hills: THREE.BufferGeometry[] = [];
  const ring = [
    [-18, -12, 2.2, "#7d8f58"],
    [-8, -14, 2.8, "#6d8450"],
    [4, -15, 3.1, "#8aa05e"],
    [16, -12, 2.4, "#748a52"],
    [20, -2, 2.6, "#6a804c"],
    [18, 12, 2.9, "#7f9458"],
    [6, 16, 2.3, "#688048"],
    [-8, 16, 3.2, "#7a9054"],
    [-18, 8, 2.5, "#70884e"],
  ] as const;
  for (const [x, z, s, hex] of ring) {
    hills.push(stamp(cone, hex, x, s * 0.35, z, 0, 0, 0, s * 1.8, s, s * 1.5));
  }
  const hillMesh = fuse(hills, "hills", SCENERY);
  hillMesh.receiveShadow = true;
  root.add(hillMesh);
  return root;
}

export function makeRing() {
  const mesh = new THREE.Mesh(
    new THREE.RingGeometry(0.94, 1, 48),
    new THREE.MeshBasicMaterial({
      color: "#d4b36a",
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.12;
  mesh.visible = false;
  mesh.renderOrder = 2;
  return mesh;
}

export function makeSoftPoints() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const g = canvas.getContext("2d");
  const tex = new THREE.CanvasTexture(canvas);
  if (g) {
    const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, "rgba(255,255,255,1)");
    grd.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, 64, 64);
    tex.needsUpdate = true;
  }
  tex.colorSpace = THREE.SRGBColorSpace;
  const max = 420;
  const positions = new Float32Array(max * 3);
  const colors = new Float32Array(max * 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.setDrawRange(0, 0);
  const mat = new THREE.PointsMaterial({
    size: 0.34,
    map: tex,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
    opacity: 0.9,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  const items: { x: number; y: number; z: number; vx: number; vy: number; vz: number; life: number; max: number; r: number; g: number; b: number; grav: number }[] = [];
  return {
    points,
    burst(x: number, y: number, z: number, color: string, n: number, speed = 2.2, life = 0.45, grav = 3) {
      _c.set(color);
      for (let i = 0; i < n && items.length < max; i++) {
        const a = Math.random() * Math.PI * 2;
        const u = Math.random();
        items.push({
          x,
          y,
          z,
          vx: Math.cos(a) * speed * u,
          vy: 0.6 + Math.random() * speed,
          vz: Math.sin(a) * speed * u,
          life,
          max: life,
          r: _c.r,
          g: _c.g,
          b: _c.b,
          grav,
        });
      }
    },
    update(dt: number) {
      let w = 0;
      for (const p of items) {
        p.life -= dt;
        if (p.life <= 0) continue;
        p.vy -= p.grav * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.z += p.vz * dt;
        const a = p.life / p.max;
        positions[w * 3] = p.x;
        positions[w * 3 + 1] = p.y;
        positions[w * 3 + 2] = p.z;
        colors[w * 3] = p.r * a;
        colors[w * 3 + 1] = p.g * a;
        colors[w * 3 + 2] = p.b * a;
        items[w] = p;
        w++;
      }
      items.length = w;
      geo.setDrawRange(0, w);
      geo.attributes.position!.needsUpdate = true;
      geo.attributes.color!.needsUpdate = true;
    },
  };
}
