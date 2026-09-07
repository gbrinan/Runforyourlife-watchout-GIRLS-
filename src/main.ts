// M1 + M1.5 진입점: 던전 오프닝 -> 초원(소음/추격/스태미너/HP) (GDD B3-B7, B12, B17, B18)
// M0 지형·보법·발굽 로직은 그대로 재사용하고, 던전 -> 초원 전환과 처녀 AI를 새로 연결한다.

import * as THREE from "three";
import { seedFromUrl } from "./core/rng";
import { generateHeightmap, sampleHeight } from "./gen/heightmap";
import { createMaterialContext, getMaterial, MATERIAL_NOISE_MULTIPLIER, isImpassable } from "./gen/material";
import { createTerrainMesh, createPastelLighting } from "./render/terrain";
import { generateDungeon, distanceToDoor } from "./gen/dungeon";
import { createDungeonScene, breakDoor } from "./render/dungeon";
import {
  createInitialUnicornState,
  upshiftGait,
  downshiftGait,
  updateUnicornState,
  Gait,
} from "./entities/unicorn";
import { getHoofbeatsInInterval, computeBobOffsetMeters } from "./audio/hooves";
import { playHoofbeat, playBoyVoice, playCrisisVoice, playEchoTowardDoor } from "./audio/synth";
import { startHeelLoop } from "./audio/heels";
import { playMaidenLaugh } from "./audio/laugh";
import {
  createInitialStaminaState,
  updateStamina,
  clampGaitByStamina,
  getCameraShakeMultiplier,
} from "./entities/stamina";
import {
  createInitialHpState,
  applyDamage,
  isGameOver,
  BodyPart,
} from "./entities/hp";
import {
  createInitialMaidenState,
  updateMaiden,
  capSimultaneousChasers,
  MaidenState,
  ATTACK_RANGE_M,
} from "./entities/maiden";
import { createMaidenMesh, updateMaidenMeshPosition, type MaidenMesh } from "./render/maiden";
import { createNoiseBus, computeHoofbeatNoiseRadius } from "./systems/noise";
import {
  createInitialHornLightState,
  activateHornLight,
  updateHornLight,
  isHornLightOn,
  HORN_LIGHT_VISIBILITY_RADIUS_M,
} from "./entities/hornlight";

const seed = seedFromUrl();

// --- 공용 DOM/오디오 ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(100, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById("app")?.appendChild(renderer.domElement);

const hint = document.getElementById("hint");
const vignette = document.getElementById("vignette");
const gameOverEl = document.getElementById("gameover");

let audioCtx: AudioContext | undefined;
function ensureAudio() {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === "suspended") audioCtx.resume();
}

// --- 포인터 락 1인칭 조작 ---
const canvas = renderer.domElement;
let dragging = false;
let yaw = Math.PI / 4;
canvas.addEventListener("click", () => {
  ensureAudio();
  Promise.resolve().then(() => canvas.requestPointerLock() as unknown).catch(() => {});
});
canvas.addEventListener("mousedown", () => { dragging = true; });
window.addEventListener("mouseup", () => { dragging = false; });
canvas.addEventListener("mousemove", (e: MouseEvent) => {
  if (document.pointerLockElement !== canvas && dragging) yaw -= e.movementX * 0.003;
});
document.addEventListener("mousemove", (e: MouseEvent) => {
  if (document.pointerLockElement !== canvas) return;
  yaw -= e.movementX * 0.002;
});

const keys = new Set<string>();
window.addEventListener("keydown", (e) => {
  if (e.repeat) return;
  keys.add(e.key.toLowerCase());
  handleKeyDown(e);
});
window.addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function gaitLabel(g: Gait): string {
  switch (g) {
    case Gait.Walk: return "서행 (walk)";
    case Gait.Trot: return "속보 (trot)";
    case Gait.Canter: return "구보 (canter)";
    case Gait.Gallop: return "질주 (gallop)";
  }
}

// --- 게임 전역 상태 ---
type Phase = "dungeon" | "meadow" | "gameover";
let phase: Phase = "dungeon";

let posX = 0, posZ = 0, posY = 0;
let unicornState = createInitialUnicornState();
let staminaState = createInitialStaminaState();
let hpState = createInitialHpState();
let hornLightState = createInitialHornLightState();
let elapsedForGait = 0;
let lastHoofElapsed = 0;
let cameraJoltRemaining = 0;

const noiseBus = createNoiseBus();
const hornLight = new THREE.PointLight(0xfff6d8, 0, 20);
camera.add(hornLight);
scene.add(camera);

function emitNoise(x: number, z: number, radius: number, kind?: string) {
  if (radius <= 0) return;
  noiseBus.emit({ x, z, radius, time: performance.now() / 1000, kind });
}

function triggerDamage(amount: number) {
  hpState = applyDamage(hpState, amount);
  cameraJoltRemaining = 0.3;
  if (vignette) vignette.style.opacity = "1";
  playCrisisVoiceAndNoise();
  if (isGameOver(hpState)) {
    endGame();
  }
}

function playCrisisVoiceAndNoise() {
  if (!audioCtx) return;
  playCrisisVoice(audioCtx, audioCtx.destination);
  emitNoise(posX, posZ, 20, "crisis-voice"); // 아저씨 목소리는 20m 소음 (GDD B17)
}

function endGame() {
  phase = "gameover";
  if (audioCtx) playMaidenLaugh(audioCtx, audioCtx.destination);
  if (gameOverEl) gameOverEl.style.display = "flex";
}

window.addEventListener("keydown", () => {
  if (phase === "gameover") {
    location.href = location.pathname + "?seed=" + Date.now();
  }
});

function handleKeyDown(e: KeyboardEvent) {
  if (phase === "gameover") return;
  if (e.key === "Shift") {
    unicornState = upshiftGait(unicornState);
    elapsedForGait = 0;
  } else if (e.key === "Control") {
    unicornState = downshiftGait(unicornState);
    elapsedForGait = 0;
  } else if (e.key.toLowerCase() === "e") {
    doWhinny();
  } else if (e.key.toLowerCase() === "f") {
    doHeadbutt();
  } else if (e.key.toLowerCase() === "q") {
    hornLightState = activateHornLight(hornLightState);
  }
}

// --- 던전 오프닝 (M1.5, GDD B18) ---
const dungeonLayout = generateDungeon(seed);
const dungeonScene = createDungeonScene(dungeonLayout);
scene.add(dungeonScene.group);
scene.background = new THREE.Color(0x050403);

posX = dungeonLayout.startX;
posZ = dungeonLayout.startZ;
posY = 0;
yaw = 0;

const dungeonMaidenMesh = createMaidenMesh();
dungeonScene.group.add(dungeonMaidenMesh.group);
let dungeonMaiden = createInitialMaidenState(
  dungeonLayout.rooms[Math.max(1, dungeonLayout.rooms.length - 2)]?.x ?? dungeonLayout.startX,
  dungeonLayout.rooms[Math.max(1, dungeonLayout.rooms.length - 2)]?.z ?? dungeonLayout.startZ
);
let stopDungeonHeelLoop: (() => void) | undefined;

let doorHitCount = 0;
const DOOR_HITS_REQUIRED = 3;

function doorDirectionFromPlayer(): { x: number; y: number; z: number } {
  const dx = dungeonLayout.door.x - posX;
  const dz = dungeonLayout.door.z - posZ;
  const len = Math.hypot(dx, dz) || 1;
  return { x: dx / len, y: 0, z: dz / len };
}

function doWhinny() {
  if (!audioCtx) return;
  const radius = 60; // GDD B4: 히힝 60m 미끼
  if (phase === "dungeon") {
    const dist = distanceToDoor(posX, posZ, dungeonLayout.door);
    playEchoTowardDoor(audioCtx, audioCtx.destination, doorDirectionFromPlayer(), dist, (dest) =>
      playBoyVoice(audioCtx!, dest)
    );
  } else {
    playBoyVoice(audioCtx, audioCtx.destination);
  }
  emitNoise(posX, posZ, radius, "whinny");
}

function frontOffset(distance: number): { x: number; z: number } {
  return { x: posX + Math.sin(yaw) * distance, z: posZ + Math.cos(yaw) * distance };
}

function doHeadbutt() {
  const front = frontOffset(2);
  emitNoise(posX, posZ, 25, "headbutt"); // GDD B18: 들이받기 25m 소음

  if (phase === "dungeon") {
    const dm = Math.hypot(dungeonMaiden.x - front.x, dungeonMaiden.z - front.z);
    if (dm < 2) {
      const angle = Math.atan2(dungeonMaiden.x - posX, dungeonMaiden.z - posZ);
      dungeonMaiden = {
        ...dungeonMaiden,
        x: dungeonMaiden.x + Math.sin(angle) * 3,
        z: dungeonMaiden.z + Math.cos(angle) * 3,
        state: MaidenState.Lost,
        lostTimer: 2,
      };
    }
    const doorDist = Math.hypot(dungeonLayout.door.x - front.x, dungeonLayout.door.z - front.z);
    if (doorDist < 2) {
      doorHitCount++;
      if (doorHitCount >= DOOR_HITS_REQUIRED) {
        breakDoor(dungeonScene);
        transitionToMeadow();
      }
    }
  } else {
    for (const m of meadowMaidens) {
      const dm = Math.hypot(m.state.x - front.x, m.state.z - front.z);
      if (dm < 2 && m.hitCount < 3) {
        m.hitCount++;
        const angle = Math.atan2(m.state.x - posX, m.state.z - posZ);
        m.state = {
          ...m.state,
          x: m.state.x + Math.sin(angle) * 3,
          z: m.state.z + Math.cos(angle) * 3,
          state: MaidenState.Lost,
          lostTimer: 2,
        };
      }
    }
  }
}

// --- 초원(M1) 준비물: 전환 시점에 생성 ---
const heightmap = generateHeightmap(seed);
const materialCtx = createMaterialContext(heightmap, seed);
interface MeadowMaiden { state: ReturnType<typeof createInitialMaidenState>; mesh: MaidenMesh; hitCount: number; stopHeel?: () => void; }
let meadowMaidens: MeadowMaiden[] = [];
let terrainMesh: THREE.Mesh | undefined;

function transitionToMeadow() {
  if (stopDungeonHeelLoop) stopDungeonHeelLoop();
  scene.remove(dungeonScene.group);
  scene.background = new THREE.Color(0xbfe8ff);

  terrainMesh = createTerrainMesh(heightmap, { seed, step: 2 });
  scene.add(terrainMesh);
  for (const light of createPastelLighting()) scene.add(light);

  posX = heightmap.size * 0.1;
  posZ = heightmap.size * 0.1;
  yaw = Math.PI / 4;
  phase = "meadow";

  // 처녀 8명, 보장 경로(남서->북동 대각선)에서 20~60m 떨어진 지점에 배치 (GDD B13 근사)
  const size = heightmap.size;
  for (let i = 0; i < 8; i++) {
    const t = (i + 1) / 9;
    const px = size * t;
    const pz = size * t;
    const side = i % 2 === 0 ? 1 : -1;
    const offset = 20 + (i % 4) * 10;
    const mx = px + side * offset;
    const mz = pz - side * offset;
    const state = createInitialMaidenState(mx, mz);
    const mesh = createMaidenMesh();
    scene.add(mesh.group);
    const stopHeel = audioCtx
      ? startHeelLoop(
          audioCtx,
          audioCtx.destination,
          { interval: 0.6 },
          () => ({ x: mesh.group.position.x, y: mesh.group.position.y, z: mesh.group.position.z })
        )
      : undefined;
    meadowMaidens.push({ state, mesh, hitCount: 0, stopHeel });
  }
}

// --- 메인 루프 ---
let lastTime = performance.now();

function animate() {
  requestAnimationFrame(animate);
  const now = performance.now();
  const dt = Math.min(0.1, (now - lastTime) / 1000);
  lastTime = now;

  if (phase === "gameover") {
    renderer.render(scene, camera);
    return;
  }

  hornLightState = updateHornLight(hornLightState, dt);
  hornLight.intensity = isHornLightOn(hornLightState) ? 60 : 0; // 물리 조명 단위(cd): 1.5는 사실상 암흑
  if (isHornLightOn(hornLightState)) {
    // 15m 내 처녀에게 시야 확보로 간주 (GDD B4): 근접 처녀를 강제로 인지시킨다.
    const list = phase === "meadow" ? meadowMaidens.map((m) => m.state) : [dungeonMaiden];
    for (const m of list) {
      const d = Math.hypot(m.x - posX, m.z - posZ);
      if (d <= HORN_LIGHT_VISIBILITY_RADIUS_M) emitNoise(posX, posZ, HORN_LIGHT_VISIBILITY_RADIUS_M, "horn-light");
    }
  }

  staminaState = updateStamina(staminaState, unicornState.gait, dt);

  const forward = keys.has("w");
  if (forward) {
    // 던전에서는 보법이 속보로 제한된다 (GDD B18: 천장 2.2m, 구보 이상 불가)
    if (phase === "dungeon" && (unicornState.gait === Gait.Canter || unicornState.gait === Gait.Gallop)) {
      unicornState = { ...unicornState, gait: Gait.Trot };
      emitNoise(posX, posZ, 20, "ceiling-bump");
      cameraJoltRemaining = 0.2;
    }
    const clampedGait = clampGaitByStamina(unicornState.gait, staminaState);
    if (clampedGait !== unicornState.gait) unicornState = { ...unicornState, gait: clampedGait };

    const { state, distanceMoved } = updateUnicornState(unicornState, dt);
    unicornState = state;
    const nextX = posX + Math.sin(yaw) * distanceMoved;
    const nextZ = posZ + Math.cos(yaw) * distanceMoved;

    if (phase === "meadow") {
      const mat = getMaterial(materialCtx, nextX, nextZ);
      if (!isImpassable(mat)) {
        posX = nextX;
        posZ = nextZ;
      }
    } else {
      posX = nextX;
      posZ = nextZ;
    }
    elapsedForGait += dt;

    const beats = getHoofbeatsInInterval(unicornState.gait, lastHoofElapsed, elapsedForGait);
    if (beats.length > 0) {
      const mat = phase === "meadow" ? getMaterial(materialCtx, posX, posZ) : "dirt";
      const multiplier = phase === "meadow" ? MATERIAL_NOISE_MULTIPLIER[mat as keyof typeof MATERIAL_NOISE_MULTIPLIER] : 1;
      const radius = computeHoofbeatNoiseRadius(unicornState.gait, multiplier);
      emitNoise(posX, posZ, radius, "hoofbeat");
      if (audioCtx) {
        for (const _ of beats) playHoofbeat(audioCtx, audioCtx.destination, mat as string);
      }
    }
    lastHoofElapsed = elapsedForGait;
  } else {
    lastHoofElapsed = 0;
    elapsedForGait = 0;
  }

  // --- 처녀 AI 갱신 ---
  if (phase === "dungeon") {
    dungeonMaiden = updateMaiden(dungeonMaiden, { dt, player: { x: posX, z: posZ } });
    updateMaidenMeshPosition(dungeonMaidenMesh, dungeonMaiden.x, 0, dungeonMaiden.z, 0);
    if (dungeonMaiden.state === MaidenState.Attack) triggerDamage(1);
  } else if (phase === "meadow") {
    let activeChasers = meadowMaidens.filter((m) => m.state.state === MaidenState.Chase).length;
    for (const m of meadowMaidens) {
      m.state = updateMaiden(m.state, {
        dt,
        player: { x: posX, z: posZ },
        activeChaserCount: activeChasers,
      });
      const groundY = sampleHeight(heightmap, m.state.x, m.state.z);
      updateMaidenMeshPosition(m.mesh, m.state.x, groundY, m.state.z, 0);
      if (m.state.state === MaidenState.Attack) {
        triggerDamage(1);
      }
    }
    const capped = capSimultaneousChasers(meadowMaidens.map((m) => m.state));
    meadowMaidens.forEach((m, i) => { m.state = capped[i]; });
  }

  // --- 카메라 ---
  const shakeMul = getCameraShakeMultiplier(staminaState);
  const bob = computeBobOffsetMeters(unicornState.gait, elapsedForGait) * shakeMul;
  let jolt = 0;
  if (cameraJoltRemaining > 0) {
    cameraJoltRemaining = Math.max(0, cameraJoltRemaining - dt);
    jolt = Math.sin(cameraJoltRemaining * 60) * 0.05;
  }

  const groundY = phase === "meadow" ? sampleHeight(heightmap, posX, posZ) : 0;
  camera.position.set(posX, groundY + 1.6 + bob + jolt, posZ);
  camera.rotation.set(0, yaw, 0);

  if (vignette && cameraJoltRemaining <= 0) {
    vignette.style.opacity = "0";
  }

  // --- HUD ---
  if (hint) {
    const partsLost = [...hpState.lostParts].join(", ") || "없음";
    const phaseLabel = phase === "dungeon" ? "던전" : "초원";
    hint.textContent =
      `[${phaseLabel}] 보법: ${gaitLabel(unicornState.gait)} | 속도: ${unicornState.currentSpeed.toFixed(1)} m/s\n` +
      `스태미너: ${staminaState.value.toFixed(0)} | HP: ${hpState.hp}/3 (잃은 부위: ${partsLost})\n` +
      `뿔의 빛: ${isHornLightOn(hornLightState) ? "점등" : hornLightState.cooldownRemaining > 0 ? "재충전 중" : "사용 가능"} | 시드: ${seed}\n` +
      (phase === "dungeon" ? `문 타격: ${doorHitCount}/${DOOR_HITS_REQUIRED} | E: 히힝(메아리) F: 들이받기 Q: 뿔의 빛` : `E: 히힝 F: 들이받기 Q: 뿔의 빛`);
  }

  renderer.render(scene, camera);
}

animate();
