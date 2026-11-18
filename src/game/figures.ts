import * as THREE from "three";
import type { EnemyKind } from "./balance";

const clothTime = { value: 0 };

const cache = new Map<string, THREE.MeshStandardMaterial>();

export function paint(
  hex: string,
  rough = 0.74,
  metalness = 0.04,
  flat = false,
  side: THREE.Side = THREE.FrontSide,
) {
  const key = `${hex}:${rough}:${metalness}:${flat}:${side}`;
  let material = cache.get(key);
  if (!material) {
    material = new THREE.MeshStandardMaterial({
      color: hex,
      roughness: rough,
      metalness,
      flatShading: flat,
      side,
    });
    cache.set(key, material);
  }
  return material;
}

function cloth(hex: string, horizontal: boolean) {
  const key = `cloth:${hex}:${horizontal}`;
  let material = cache.get(key);
  if (material) return material;
  material = new THREE.MeshStandardMaterial({
    color: hex,
    roughness: 0.86,
    metalness: 0.02,
    side: THREE.DoubleSide,
  });
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = clothTime;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nuniform float uTime;")
      .replace(
        "#include <begin_vertex>",
        horizontal
          ? `#include <begin_vertex>
             float fly = clamp(position.x / 0.62, 0.0, 1.0);
             transformed.z += sin(uTime * 3.1 + position.x * 9.0) * 0.09 * fly;
             transformed.y += sin(uTime * 2.1 + position.x * 5.0) * 0.035 * fly;`
          : `#include <begin_vertex>
             float hem = smoothstep(0.2, -0.5, position.y);
             transformed.z += sin(uTime * 2.5 + position.x * 7.0) * 0.08 * hem;
             transformed.x += cos(uTime * 1.7 + position.y * 4.0) * 0.035 * hem;`,
      );
  };
  cache.set(key, material);
  return material;
}

export function tickFigures(time: number) {
  clothTime.value = time;
}

const GEO = {
  thigh: new THREE.CapsuleGeometry(0.07, 0.26, 3, 8),
  shin: new THREE.CapsuleGeometry(0.055, 0.22, 3, 7),
  boot: new THREE.CapsuleGeometry(0.06, 0.08, 2, 6),
  torso: new THREE.CapsuleGeometry(0.15, 0.2, 3, 10),
  head: new THREE.SphereGeometry(0.125, 12, 10),
  helm: new THREE.SphereGeometry(0.142, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.56),
  hair: new THREE.SphereGeometry(0.132, 10, 8),
  eye: new THREE.SphereGeometry(0.016, 6, 5),
  nose: new THREE.SphereGeometry(0.022, 6, 5),
  beard: new THREE.SphereGeometry(0.07, 8, 6),
  arm: new THREE.CapsuleGeometry(0.042, 0.24, 2, 7),
  hand: new THREE.SphereGeometry(0.046, 7, 6),
  belt: new THREE.TorusGeometry(0.155, 0.028, 6, 12),
  skirt: new THREE.CylinderGeometry(0.15, 0.2, 0.16, 9),
  crest: new THREE.BoxGeometry(0.035, 0.16, 0.3),
  cheek: new THREE.BoxGeometry(0.018, 0.09, 0.05),
  cloak: new THREE.PlaneGeometry(0.44, 0.72, 5, 8),
  pennant: new THREE.PlaneGeometry(0.62, 0.28, 10, 3),
  scutum: new THREE.CylinderGeometry(0.2, 0.22, 0.5, 12, 1, true, -0.8, 1.6),
  boss: new THREE.SphereGeometry(0.055, 8, 6),
  stripe: new THREE.BoxGeometry(0.04, 0.46, 0.02),
  sword: new THREE.BoxGeometry(0.045, 0.42, 0.045),
  guard: new THREE.BoxGeometry(0.14, 0.028, 0.028),
  grip: new THREE.CylinderGeometry(0.018, 0.018, 0.12, 6),
  spear: new THREE.CylinderGeometry(0.032, 0.036, 0.92, 6),
  tip: new THREE.ConeGeometry(0.055, 0.16, 7),
  haft: new THREE.CylinderGeometry(0.028, 0.03, 0.58, 6),
  axe: new THREE.BoxGeometry(0.18, 0.12, 0.06),
  falx: new THREE.TorusGeometry(0.2, 0.02, 5, 12, Math.PI * 0.95),
  bow: new THREE.TorusGeometry(0.2, 0.012, 5, 16, Math.PI * 1.08),
  string: new THREE.CylinderGeometry(0.004, 0.004, 0.36, 4),
  horn: new THREE.ConeGeometry(0.045, 0.2, 6),
  wing: new THREE.SphereGeometry(0.1, 8, 6),
  pelvis: new THREE.SphereGeometry(0.12, 8, 6),
  body: new THREE.SphereGeometry(0.5, 14, 10),
  ear: new THREE.ConeGeometry(0.08, 0.18, 6),
};

GEO.pennant.translate(0.31, 0, 0);
GEO.thigh.translate(0, -0.2, 0);
GEO.shin.translate(0, -0.16, 0);
GEO.boot.translate(0, -0.08, 0.02);
GEO.torso.translate(0, 0.24, 0);
GEO.arm.translate(0, -0.17, 0);

const FLAME_GEO = new THREE.LatheGeometry(
  [
    new THREE.Vector2(0.02, 0),
    new THREE.Vector2(0.2, 0.14),
    new THREE.Vector2(0.28, 0.4),
    new THREE.Vector2(0.15, 0.72),
    new THREE.Vector2(0.05, 0.96),
    new THREE.Vector2(0.0, 1.08),
  ],
  8,
);

const FLAME = new THREE.MeshStandardMaterial({
  color: "#ffb15a",
  emissive: "#ff6a1a",
  emissiveIntensity: 1.65,
  roughness: 0.42,
});
const FLAME_CORE = new THREE.MeshStandardMaterial({
  color: "#fff1c4",
  emissive: "#ffd27a",
  emissiveIntensity: 2.1,
  roughness: 0.3,
});

export const GOLD = paint("#e6c36a", 0.36, 0.72);

function piece(
  geo: THREE.BufferGeometry,
  material: THREE.Material,
  x = 0,
  y = 0,
  z = 0,
  rx = 0,
  ry = 0,
  rz = 0,
  sx = 1,
  sy = 1,
  sz = 1,
  shadow = true,
) {
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.set(x, y, z);
  mesh.rotation.set(rx, ry, rz);
  mesh.scale.set(sx, sy, sz);
  mesh.castShadow = shadow;
  mesh.receiveShadow = false;
  return mesh;
}

function joint(name: string, x: number, y: number, z: number) {
  const group = new THREE.Group();
  group.name = name;
  group.position.set(x, y, z);
  return group;
}

export function makeFlame(sx = 0.16, sy = 0.32, sz = 0.16) {
  const flame = new THREE.Mesh(FLAME_GEO, FLAME);
  flame.name = "flame";
  flame.castShadow = false;
  flame.scale.set(sx, sy, sz);
  flame.userData.base = [sx, sy, sz];
  const core = new THREE.Mesh(FLAME_GEO, FLAME_CORE);
  core.scale.set(0.5, 0.7, 0.5);
  core.position.y = 0.06;
  core.castShadow = false;
  flame.add(core);
  return flame;
}

export function makePennant(hex: string) {
  const flag = piece(GEO.pennant, cloth(hex, true), 0, 0, 0, 0, 0, 0, 1, 1, 1, false);
  flag.name = "pennant";
  return flag;
}

export function makeEagle() {
  const group = new THREE.Group();
  group.name = "eagle";
  group.add(piece(GEO.head, GOLD, 0, 0, 0, 0, 0, 0, 1.1, 0.72, 1.35));
  group.add(piece(GEO.wing, GOLD, -0.14, 0.02, -0.02, 0.2, 0.2, 0.9, 0.35, 0.7, 1.5));
  group.add(piece(GEO.wing, GOLD, 0.14, 0.02, -0.02, 0.2, -0.2, -0.9, 0.35, 0.7, 1.5));
  group.add(piece(GEO.head, GOLD, 0, 0.06, 0.12, 0, 0, 0, 0.45, 0.4, 0.55));
  group.add(piece(GEO.tip, GOLD, 0, 0.05, 0.2, Math.PI / 2, 0, 0, 0.28, 0.42, 0.28));
  return group;
}

export function makeShield(hex: string, bossHex = "#a8844a") {
  const group = new THREE.Group();
  const face = paint(hex, 0.68, 0.08, false, THREE.DoubleSide);
  const board = piece(GEO.scutum, face);
  board.rotation.y = Math.PI / 2;
  group.add(board);
  group.add(piece(GEO.boss, paint(bossHex, 0.4, 0.66), 0, 0.02, 0.16, 0, 0, 0, 1, 1, 1, false));
  group.add(piece(GEO.stripe, paint("#e6c36a", 0.4, 0.55), 0, 0, 0.12, 0, 0, 0, 1, 1, 1, false));
  return group;
}

export interface PersonOpts {
  skin?: string;
  cloth: string;
  hair: string;
  metal?: string;
  skirt?: string;
  weapon: "axe" | "sword" | "falx" | "spear" | "bow" | "none";
  shield?: string;
  helm?: boolean;
  crest?: string;
  cloak?: string;
  k?: number;
  sit?: boolean;
  beard?: boolean;
  horns?: boolean;
  banner?: string;
  name?: string;
}

function addWeapon(arm: THREE.Object3D, opts: PersonOpts, metal: THREE.Material, wood: THREE.Material) {
  if (opts.weapon === "sword") {
    arm.add(piece(GEO.grip, wood, 0, -0.34, 0.04, 0.2, 0, 0));
    arm.add(piece(GEO.guard, metal, 0, -0.42, 0.06));
    arm.add(piece(GEO.sword, metal, 0, -0.66, 0.08, 0.15, 0, 0));
  } else if (opts.weapon === "spear") {
    arm.add(piece(GEO.spear, wood, 0, -0.05, 0.12, 0.35, 0, 0));
    arm.add(piece(GEO.tip, metal, 0, 0.42, 0.28, 0.35, 0, 0));
  } else if (opts.weapon === "axe") {
    arm.add(piece(GEO.haft, wood, 0, -0.16, 0.08, 0.45, 0, 0));
    arm.add(piece(GEO.axe, metal, 0.1, 0.02, 0.16, 0.45, 0, 0.35));
  } else if (opts.weapon === "falx") {
    arm.add(piece(GEO.grip, wood, 0, -0.36, 0.05));
    arm.add(piece(GEO.falx, metal, 0.02, -0.12, 0.12, 0.4, 0.8, Math.PI));
  } else if (opts.weapon === "bow") {
    const bow = piece(GEO.bow, wood, 0, -0.24, 0.12);
    bow.rotation.set(Math.PI / 2, 0, Math.PI / 2);
    arm.add(bow);
    arm.add(piece(GEO.string, paint("#e7d7b0", 0.6, 0.02), 0, -0.24, 0.12, 0, 0, 0, 1, 1, 1, false));
  }
}

function addLeg(
  parent: THREE.Object3D,
  name: string,
  x: number,
  z: number,
  clothMat: THREE.Material,
  bootMat: THREE.Material,
) {
  const hip = joint(name, x, 0, z);
  hip.add(piece(GEO.thigh, clothMat));
  const knee = joint("knee", 0, -0.4, 0);
  knee.add(piece(GEO.shin, clothMat));
  knee.add(piece(GEO.boot, bootMat, 0, -0.34, 0));
  hip.add(knee);
  parent.add(hip);
  return hip;
}

export function makePerson(opts: PersonOpts) {
  const k = opts.k ?? 1;
  const skin = paint(opts.skin ?? "#e2b394", 0.58, 0.02);
  const clothMat = paint(opts.cloth, 0.78, 0.03);
  const skirtMat = paint(opts.skirt ?? opts.cloth, 0.8, 0.04);
  const hair = paint(opts.hair, 0.72, 0.02);
  const metal = paint(opts.metal ?? "#c5ccd2", 0.32, 0.74);
  const wood = paint("#7a4e2e", 0.84, 0.04);
  const bootMat = paint("#2c241c", 0.82, 0.08);
  const leather = paint("#4a3424", 0.8, 0.06);

  const root = new THREE.Group();
  root.name = opts.name ?? "soldier";
  root.scale.setScalar(k);
  root.userData.gait = "biped";
  root.userData.pose = opts.sit ? "sit" : "stand";

  const hip = new THREE.Group();
  hip.position.y = 0.78;
  addLeg(hip, "legL", -0.09, 0.02, clothMat, bootMat);
  addLeg(hip, "legR", 0.09, -0.02, clothMat, bootMat);
  root.add(hip);

  const torso = joint("torso", 0, 0.78, 0);
  torso.add(piece(GEO.torso, clothMat));
  torso.add(piece(GEO.pelvis, skirtMat, 0, 0.02, 0, 0, 0, 0, 1.35, 0.55, 1.05));
  torso.add(piece(GEO.belt, paint("#a8844a", 0.4, 0.62), 0, 0.06, 0, Math.PI / 2, 0, 0));
  torso.add(piece(GEO.skirt, skirtMat, 0, -0.06, 0));

  const head = joint("head", 0, 0.5, 0.02);
  head.add(piece(GEO.head, skin, 0, 0.12, 0));
  head.add(piece(GEO.nose, skin, 0, 0.1, 0.11, 0, 0, 0, 1, 1.15, 1, false));
  head.add(piece(GEO.eye, paint("#1a120e", 0.35, 0.1), -0.042, 0.14, 0.1, 0, 0, 0, 1, 1, 1, false));
  head.add(piece(GEO.eye, paint("#1a120e", 0.35, 0.1), 0.042, 0.14, 0.1, 0, 0, 0, 1, 1, 1, false));
  if (opts.beard) head.add(piece(GEO.beard, hair, 0, 0.02, 0.06, 0, 0, 0, 1, 0.85, 0.85));
  if (opts.helm) {
    head.add(piece(GEO.helm, metal, 0, 0.15, 0));
    head.add(piece(GEO.cheek, metal, -0.1, 0.08, 0.03, 0, 0, 0, 1, 1, 1, false));
    head.add(piece(GEO.cheek, metal, 0.1, 0.08, 0.03, 0, 0, 0, 1, 1, 1, false));
    if (opts.crest) head.add(piece(GEO.crest, paint(opts.crest, 0.7, 0.04), 0, 0.3, -0.02));
  } else {
    head.add(piece(GEO.hair, hair, 0, 0.18, -0.02, 0, 0, 0, 1.05, 0.72, 1.05));
  }
  if (opts.horns) {
    head.add(piece(GEO.horn, paint("#e7d7b0", 0.5, 0.12), -0.1, 0.24, 0, 0, 0, 0.55));
    head.add(piece(GEO.horn, paint("#e7d7b0", 0.5, 0.12), 0.1, 0.24, 0, 0, 0, -0.55));
  }
  torso.add(head);

  const armL = joint("armL", -0.22, 0.4, 0);
  armL.add(piece(GEO.arm, opts.helm ? metal : skin));
  armL.add(piece(GEO.hand, skin, 0, -0.36, 0.02, 0, 0, 0, 1, 1, 1, false));
  if (opts.shield) {
    const shield = makeShield(opts.shield);
    shield.position.set(-0.02, -0.16, 0.08);
    shield.rotation.y = -0.35;
    shield.scale.setScalar(0.92);
    armL.add(shield);
  }
  torso.add(armL);

  const armR = joint("armR", 0.22, 0.4, 0);
  armR.add(piece(GEO.arm, skin));
  armR.add(piece(GEO.hand, skin, 0, -0.36, 0.02, 0, 0, 0, 1, 1, 1, false));
  addWeapon(armR, opts, metal, wood);
  torso.add(armR);

  if (opts.cloak) {
    const cape = piece(GEO.cloak, cloth(opts.cloak, false), 0, 0.18, -0.16, 0.12, 0, 0, 1, 1, 1, false);
    cape.name = "cloak";
    torso.add(cape);
  }
  if (opts.banner) {
    torso.add(piece(GEO.spear, wood, 0, 0.28, -0.14));
    const flag = makePennant(opts.banner);
    flag.position.set(0, 0.78, -0.14);
    torso.add(flag);
  }

  root.add(torso);
  return root;
}

function mountLegs(body: THREE.Object3D, material: THREE.Material, boot: THREE.Material, thick = 1) {
  const spots: [string, number, number][] = [
    ["legFL", -0.16, 0.38],
    ["legFR", 0.16, 0.34],
    ["legBL", -0.16, -0.4],
    ["legBR", 0.16, -0.36],
  ];
  for (const [name, x, z] of spots) {
    const hip = joint(name, x, -0.02, z);
    hip.add(piece(GEO.thigh, material, 0, -0.02, 0, 0, 0, 0, thick, 1, thick));
    const knee = joint("knee", 0, -0.42, 0);
    knee.add(piece(GEO.shin, material, 0, 0, 0, 0, 0, 0, thick, 1.05, thick));
    knee.add(piece(GEO.boot, boot, 0, -0.36, 0.03, 0, 0, 0, 1.1 * thick, 0.7, 1.25));
    hip.add(knee);
    body.add(hip);
  }
}

function makeHorse(rider: PersonOpts, barding: string) {
  const hide = paint(barding, 0.58, 0.28);
  const dark = paint("#3a3128", 0.8, 0.08);
  const root = new THREE.Group();
  root.userData.gait = "mount";
  const body = joint("body", 0, 0.86, 0);
  body.add(piece(GEO.body, hide, 0, 0.02, 0, 0, 0, 0, 0.78, 0.58, 1.45));
  body.add(piece(GEO.skirt, hide, 0, -0.12, 0, 0, 0, 0, 1.15, 0.45, 1.7));
  mountLegs(body, hide, dark, 1.05);

  const neck = joint("neck", 0, 0.22, 0.42);
  neck.add(piece(GEO.torso, hide, 0, 0.05, 0.08, 0.9, 0, 0, 0.48, 0.7, 0.42));
  neck.add(piece(GEO.body, hide, 0, 0.28, 0.22, 0, 0, 0, 0.28, 0.24, 0.4));
  neck.add(piece(GEO.ear, hide, -0.08, 0.38, 0.18, -0.4, 0, 0.5, 0.7, 1, 0.45, false));
  neck.add(piece(GEO.ear, hide, 0.08, 0.38, 0.18, -0.4, 0, -0.5, 0.7, 1, 0.45, false));
  neck.add(piece(GEO.tip, dark, 0, 0.22, 0.4, Math.PI / 2, 0, 0, 0.35, 0.55, 0.35, false));
  body.add(neck);

  const tail = joint("tail", 0, 0.18, -0.72);
  tail.add(piece(GEO.tip, dark, 0, -0.08, -0.16, 1.15, 0, 0, 0.85, 1.5, 0.85));
  body.add(tail);

  const man = makePerson({ ...rider, sit: true, name: "rider" });
  man.position.set(0, 0.32, -0.05);
  body.add(man);
  root.add(body);
  return root;
}

function makeElephant() {
  const hide = paint("#9a968e", 0.88, 0.02);
  const hideDark = paint("#7d796f", 0.9, 0.02);
  const tusk = paint("#efe8dc", 0.45, 0.08);
  const wood = paint("#7a4e2e", 0.84, 0.04);
  const root = new THREE.Group();
  root.userData.gait = "elephant";
  const body = joint("body", 0, 0.98, 0);
  body.add(piece(GEO.body, hide, 0, 0.08, 0, 0, 0, 0, 1.35, 1.05, 1.85));
  mountLegs(body, hideDark, hideDark, 1.7);

  const skull = joint("skull", 0, 0.22, 1.05);
  skull.add(piece(GEO.body, hide, 0, 0.05, 0.05, 0, 0, 0, 0.82, 0.7, 0.9));
  const earL = joint("earL", -0.34, 0.16, 0);
  earL.add(piece(GEO.wing, hideDark, -0.28, -0.12, 0.04, 1.05, 0.2, 0.35, 4.4, 5.4, 1.1));
  const earR = joint("earR", 0.34, 0.16, 0);
  earR.add(piece(GEO.wing, hideDark, 0.28, -0.12, 0.04, 1.05, -0.2, -0.35, 4.4, 5.4, 1.1));
  skull.add(earL, earR);
  skull.add(piece(GEO.tip, tusk, -0.16, -0.02, 0.42, Math.PI / 2, 0, 0.35, 0.7, 1.6, 0.7, false));
  skull.add(piece(GEO.tip, tusk, 0.16, -0.02, 0.42, Math.PI / 2, 0, -0.35, 0.7, 1.6, 0.7, false));
  const trunk = joint("trunk", 0, -0.12, 0.38);
  trunk.add(piece(GEO.arm, hide, 0, -0.16, 0.04, 0, 0, 0, 1.8, 1.35, 1.8));
  const mid = joint("trunkMid", 0, -0.38, 0.02);
  mid.add(piece(GEO.arm, hideDark, 0, -0.16, 0.02, 0, 0, 0, 1.45, 1.2, 1.45));
  trunk.add(mid);
  skull.add(trunk);
  body.add(skull);
  const tail = joint("tail", 0, 0.12, -0.95);
  tail.add(piece(GEO.tip, hideDark, 0, -0.16, -0.08, 0.8, 0, 0, 0.9, 1.4, 0.9));
  body.add(tail);

  const howdah = new THREE.Group();
  howdah.position.set(0, 0.48, -0.05);
  howdah.add(piece(new THREE.BoxGeometry(0.62, 0.16, 0.5), wood, 0, 0, 0));
  howdah.add(piece(new THREE.BoxGeometry(0.08, 0.28, 0.08), wood, -0.26, 0.18, 0.18));
  howdah.add(piece(new THREE.BoxGeometry(0.08, 0.28, 0.08), wood, 0.26, 0.18, 0.18));
  howdah.add(piece(new THREE.BoxGeometry(0.08, 0.28, 0.08), wood, -0.26, 0.18, -0.18));
  howdah.add(piece(new THREE.BoxGeometry(0.08, 0.28, 0.08), wood, 0.26, 0.18, -0.18));
  const rider = makePerson({
    cloth: "#9e2d2a",
    hair: "#2a211c",
    weapon: "spear",
    helm: true,
    crest: "#e3c16e",
    metal: "#c5ccd2",
    k: 0.48,
    sit: true,
    name: "rider",
  });
  rider.position.set(0, 0.16, 0);
  howdah.add(rider);
  body.add(howdah);
  root.add(body);
  return root;
}

function makeRam() {
  const wood = paint("#6a4a32", 0.86, 0.04);
  const hide = paint("#5c4636", 0.9, 0.03);
  const dark = paint("#3e342c", 0.9, 0.04);
  const bronze = paint("#a8844a", 0.4, 0.66);
  const root = new THREE.Group();
  root.userData.gait = "ram";
  const body = joint("body", 0, 0.62, 0);
  body.add(piece(GEO.body, hide, 0, 0.1, 0, 0, 0, 0, 1.15, 0.85, 1.7));
  body.add(piece(new THREE.BoxGeometry(0.9, 0.08, 1.35), dark, 0, 0.36, 0));
  body.add(piece(GEO.tip, bronze, 0, 0.02, 1.05, Math.PI / 2, 0, 0, 2.4, 3.2, 2.4));
  body.add(piece(new THREE.CylinderGeometry(0.06, 0.06, 0.9, 6), wood, 0, 0.22, 0.1, 0, 0, Math.PI / 2));
  root.add(body);

  const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.1, 12);
  const spoke = new THREE.BoxGeometry(0.05, 0.5, 0.05);
  const axleAt = (z: number) => {
    const axle = new THREE.Group();
    axle.name = "axle";
    axle.position.set(0, 0.32, z);
    for (const x of [-0.78, 0.78]) {
      const wheel = piece(wheelGeo, wood, x, 0, 0, 0, 0, Math.PI / 2);
      wheel.add(piece(spoke, dark));
      wheel.add(piece(spoke, dark, 0, 0, 0, 0, 0, Math.PI / 2));
      axle.add(wheel);
    }
    return axle;
  };
  root.add(axleAt(0.42), axleAt(-0.38));
  return root;
}

export function makeEnemy(kind: EnemyKind) {
  let group: THREE.Group;
  if (kind === "raider") {
    group = makePerson({
      cloth: "#6a4b34",
      skirt: "#4a3424",
      hair: "#d9b56a",
      weapon: "axe",
      cloak: "#6a4b34",
      name: kind,
    });
  } else if (kind === "gaul") {
    group = makePerson({
      cloth: "#2f5f86",
      hair: "#efe0a0",
      weapon: "sword",
      shield: "#c4a574",
      beard: true,
      name: kind,
    });
  } else if (kind === "dacian") {
    group = makePerson({
      cloth: "#8d8f96",
      skirt: "#8aa0aa",
      hair: "#3a2a24",
      metal: "#a8844a",
      weapon: "falx",
      helm: true,
      name: kind,
    });
  } else if (kind === "berserker") {
    group = makePerson({
      skin: "#c98462",
      cloth: "#c98462",
      skirt: "#4a3424",
      hair: "#1c140f",
      weapon: "axe",
      cloak: "#4a3424",
      beard: true,
      k: 1.16,
      name: kind,
    });
  } else if (kind === "warlord") {
    group = makePerson({
      skin: "#c98462",
      cloth: "#4a2030",
      hair: "#1a120e",
      metal: "#8d8f96",
      weapon: "axe",
      cloak: "#2a1c22",
      helm: true,
      crest: "#e3c16e",
      horns: true,
      banner: "#9e2d2a",
      beard: true,
      k: 1.22,
      name: kind,
    });
  } else if (kind === "cataphract") {
    group = makeHorse(
      {
        cloth: "#9e2d2a",
        hair: "#2a211c",
        metal: "#c5ccd2",
        weapon: "spear",
        helm: true,
        crest: "#e3c16e",
        k: 0.62,
      },
      "#a8844a",
    );
    group.name = kind;
  } else if (kind === "archer") {
    group = makePerson({
      cloth: "#6e3b4a",
      skirt: "#3a2428",
      hair: "#1a120e",
      weapon: "bow",
      cloak: "#6e3b4a",
      name: kind,
    });
  } else if (kind === "slinger") {
    group = makePerson({
      cloth: "#c4a574",
      skirt: "#8a6232",
      hair: "#efe0a0",
      weapon: "none",
      name: kind,
      k: 0.92,
    });
  } else if (kind === "druid") {
    group = makePerson({
      cloth: "#3d5a3a",
      skirt: "#2a3a28",
      hair: "#d9d0c4",
      weapon: "spear",
      cloak: "#243024",
      beard: true,
      k: 1.08,
      name: kind,
    });
  } else if (kind === "queen") {
    group = makePerson({
      skin: "#c98462",
      cloth: "#6a2a4a",
      hair: "#1a120e",
      metal: "#e3c16e",
      weapon: "sword",
      cloak: "#2a1420",
      helm: true,
      crest: "#f3e6d0",
      banner: "#6a2a4a",
      k: 1.18,
      name: kind,
    });
  } else if (kind === "elephant") {
    group = makeElephant();
    group.name = kind;
  } else {
    group = makeRam();
    group.name = kind;
  }
  group.traverse((obj) => {
    if (obj instanceof THREE.Mesh && obj.castShadow) obj.castShadow = true;
  });
  return group;
}

interface Limb {
  pivot: THREE.Object3D;
  knee?: THREE.Object3D;
  name: string;
}

interface Rig {
  gait: string;
  pose: string;
  legs: Limb[];
  armL?: THREE.Object3D;
  armR?: THREE.Object3D;
  torso?: THREE.Object3D;
  head?: THREE.Object3D;
  cloak?: THREE.Object3D;
  body?: THREE.Object3D;
  neck?: THREE.Object3D;
  tail?: THREE.Object3D;
  trunk?: THREE.Object3D;
  trunkMid?: THREE.Object3D;
  earL?: THREE.Object3D;
  earR?: THREE.Object3D;
}

function limbOf(root: THREE.Object3D, name: string): Limb | null {
  const pivot = root.getObjectByName(name);
  if (!pivot) return null;
  return { pivot, knee: pivot.children.find((child) => child.name === "knee"), name };
}

function rigOf(root: THREE.Object3D): Rig {
  const cached = root.userData.rig as Rig | undefined;
  if (cached) return cached;
  const gait = String(root.userData.gait ?? "biped");
  const names =
    gait === "biped" ? ["legL", "legR"] : ["legFL", "legFR", "legBL", "legBR"];
  const rig: Rig = {
    gait,
    pose: String(root.userData.pose ?? "stand"),
    legs: names.map((name) => limbOf(root, name)).filter((item): item is Limb => item != null),
    armL: root.getObjectByName("armL") ?? undefined,
    armR: root.getObjectByName("armR") ?? undefined,
    torso: root.getObjectByName("torso") ?? undefined,
    head: root.getObjectByName("head") ?? undefined,
    cloak: root.getObjectByName("cloak") ?? undefined,
    body: root.getObjectByName("body") ?? undefined,
    neck: root.getObjectByName("neck") ?? undefined,
    tail: root.getObjectByName("tail") ?? undefined,
    trunk: root.getObjectByName("trunk") ?? undefined,
    trunkMid: root.getObjectByName("trunkMid") ?? undefined,
    earL: root.getObjectByName("earL") ?? undefined,
    earR: root.getObjectByName("earR") ?? undefined,
  };
  root.userData.rig = rig;
  return rig;
}

function baseY(obj: THREE.Object3D) {
  const data = obj.userData as { baseY?: number };
  if (data.baseY == null) data.baseY = obj.position.y;
  return data.baseY;
}

export function poseRig(root: THREE.Object3D, phase: number, weight: number, time: number, kick = 0) {
  const rig = rigOf(root);
  const thrust = Math.sin(Math.min(1, Math.max(0, kick)) * Math.PI);
  const rider = root.getObjectByName("rider");

  if (rig.gait === "ram") {
    if (rig.body) {
      rig.body.position.y = baseY(rig.body) + Math.sin(phase * 2) * 0.02 * weight;
      rig.body.rotation.z = Math.sin(phase) * 0.03 * weight;
    }
    return;
  }

  if (rig.gait === "mount" || rig.gait === "elephant") {
    const gallop = rig.gait === "mount";
    const amp = (gallop ? 0.72 : 0.32) * weight;
    const offset: Record<string, number> = gallop
      ? { legFL: 0, legBR: 0.35, legFR: Math.PI, legBL: Math.PI + 0.35 }
      : { legFL: 0, legBR: 0.2, legFR: Math.PI, legBL: Math.PI + 0.2 };
    for (const leg of rig.legs) {
      const s = Math.sin(phase + (offset[leg.name] ?? 0));
      leg.pivot.rotation.x = s * amp;
      if (leg.knee) leg.knee.rotation.x = Math.max(0, -s) * amp * 0.85;
    }
    if (rig.body) {
      rig.body.position.y = baseY(rig.body) + Math.abs(Math.sin(phase * 2)) * (gallop ? 0.045 : 0.03) * weight;
    }
    if (rig.neck) rig.neck.rotation.x = 0.72 + Math.sin(phase) * 0.1 * weight;
    if (rig.tail) rig.tail.rotation.y = Math.sin(time * 2.4 + phase) * 0.35;
    if (rig.trunk) rig.trunk.rotation.x = -0.65 + Math.sin(time * 1.4 + phase) * 0.22;
    if (rig.trunkMid) rig.trunkMid.rotation.x = -0.55 + Math.sin(time * 1.7) * 0.18;
    if (rig.earL) rig.earL.rotation.z = Math.sin(time * 2.2) * 0.12;
    if (rig.earR) rig.earR.rotation.z = -Math.sin(time * 2.2) * 0.12;
    if (rider && rider !== root) poseRig(rider, phase + 0.6, Math.max(0.2, weight * 0.35), time, kick);
    return;
  }

  if (rig.pose === "sit") {
    for (const leg of rig.legs) {
      leg.pivot.rotation.x = 1.15;
      if (leg.knee) leg.knee.rotation.x = 1.3;
    }
    if (rig.torso) {
      rig.torso.position.y = baseY(rig.torso) + Math.sin(phase * 2) * 0.02;
      rig.torso.rotation.x = 0.12;
    }
    if (rig.armL) rig.armL.rotation.set(-0.95, 0, 0.25);
    if (rig.armR) rig.armR.rotation.set(-1.05 - thrust * 0.45, 0, -0.2);
    return;
  }

  const swing = Math.sin(phase) * weight;
  for (const leg of rig.legs) {
    const sign = leg.name === "legL" ? 1 : -1;
    const s = Math.sin(phase) * sign;
    leg.pivot.rotation.x = s * 0.78 * weight;
    if (leg.knee) leg.knee.rotation.x = Math.max(0, -s) * 1.05 * weight;
  }
  if (rig.armL) rig.armL.rotation.set(-0.28 - swing * 0.55, 0, 0.18);
  if (rig.armR) rig.armR.rotation.set(-0.4 + swing * 0.55 - thrust * 1.05, 0, -0.16);
  if (rig.torso) {
    rig.torso.rotation.y = swing * 0.08;
    rig.torso.rotation.z = Math.cos(phase) * 0.035 * weight;
    rig.torso.position.y = baseY(rig.torso) + Math.abs(Math.sin(phase * 2)) * 0.035 * weight;
  }
  if (rig.head) {
    rig.head.rotation.y = -swing * 0.12;
    rig.head.rotation.x = Math.sin(time * 1.6 + phase) * 0.04;
  }
  if (rig.cloak) rig.cloak.rotation.x = 0.16 + weight * 0.14 + Math.sin(time * 2.5 + phase) * 0.06;
}
