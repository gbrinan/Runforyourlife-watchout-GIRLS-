// M0 프로토타입 진입점: 노이즈 지형 + 재질 판정 + 1인칭 4단 보법 + 발굽 합성음.
// GDD D: M0 완료 기준 "개발자 외 2명이 조작 후 말 같다"

import * as THREE from "three";
import { seedFromUrl } from "./core/rng";
import { generateHeightmap } from "./gen/heightmap";
import { createMaterialContext, getMaterial } from "./gen/material";
import { createTerrainMesh, createPastelLighting } from "./render/terrain";
import {
  createInitialUnicornState,
  upshiftGait,
  downshiftGait,
  updateUnicornState,
  getMaxTurnDegrees,
  CAMERA_HEAD_HEIGHT_M,
  CAMERA_FOV_DEG,
  Gait,
} from "./entities/unicorn";
import { getHoofbeatsInInterval, computeBobOffsetMeters } from "./audio/hooves";
import { playHoofbeat } from "./audio/synth";

const seed = seedFromUrl();
const heightmap = generateHeightmap(seed);
const materialCtx = createMaterialContext(heightmap, seed);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xbfe8ff); // 파스텔 하늘

const camera = new THREE.PerspectiveCamera(
  CAMERA_FOV_DEG,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById("app")?.appendChild(renderer.domElement);

const terrain = createTerrainMesh(heightmap, { seed, step: 2 });
scene.add(terrain);
for (const light of createPastelLighting()) scene.add(light);

// 시작점: 남서 모서리 근처(GDD B9)
let posX = heightmap.size * 0.1;
let posZ = heightmap.size * 0.1;
let yaw = Math.PI / 4; // 북동쪽을 바라봄

let unicornState = createInitialUnicornState();
let elapsedForGait = 0;

// --- 오디오 (첫 클릭에서 시작) ---
let audioCtx: AudioContext | undefined;
const hint = document.getElementById("hint");

function ensureAudio() {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
}

// --- 포인터 락 1인칭 조작 ---
const canvas = renderer.domElement;
canvas.addEventListener("click", () => {
  canvas.requestPointerLock();
  ensureAudio();
});

document.addEventListener("mousemove", (e) => {
  if (document.pointerLockElement !== canvas) return;
  yaw -= e.movementX * 0.002;
});

const keys = new Set<string>();
window.addEventListener("keydown", (e) => {
  if (e.repeat) return;
  if (e.key === "Shift") {
    unicornState = upshiftGait(unicornState);
    elapsedForGait = 0;
  } else if (e.key === "Control") {
    unicornState = downshiftGait(unicornState);
    elapsedForGait = 0;
  }
  keys.add(e.key.toLowerCase());
});
window.addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));

function gaitLabel(g: Gait): string {
  switch (g) {
    case Gait.Walk:
      return "서행 (walk)";
    case Gait.Trot:
      return "속보 (trot)";
    case Gait.Canter:
      return "구보 (canter)";
    case Gait.Gallop:
      return "질주 (gallop)";
  }
}

let lastTime = performance.now();
let lastHoofElapsed = 0;

function animate() {
  requestAnimationFrame(animate);
  const now = performance.now();
  const dt = Math.min(0.1, (now - lastTime) / 1000);
  lastTime = now;

  const forward = keys.has("w");
  if (forward) {
    const { state, distanceMoved } = updateUnicornState(unicornState, dt);
    unicornState = state;
    posX += Math.sin(yaw) * distanceMoved;
    posZ += Math.cos(yaw) * distanceMoved;
    elapsedForGait += dt;

    // 발굽 소리: 이번 프레임 구간에 발생한 박자마다 재생
    const beats = getHoofbeatsInInterval(
      unicornState.gait,
      lastHoofElapsed,
      elapsedForGait
    );
    if (beats.length > 0 && audioCtx) {
      const mat = getMaterial(materialCtx, posX, posZ);
      for (const _ of beats) {
        playHoofbeat(audioCtx, audioCtx.destination, mat);
      }
    }
    lastHoofElapsed = elapsedForGait;
  } else {
    lastHoofElapsed = 0;
    elapsedForGait = 0;
  }

  const groundY = terrain.position.y; // 근사치, 정확한 높이 샘플은 생략(성능 우선)
  const bob = computeBobOffsetMeters(unicornState.gait, elapsedForGait);
  camera.position.set(
    posX,
    CAMERA_HEAD_HEIGHT_M + bob,
    posZ
  );
  camera.rotation.set(0, yaw, 0);

  if (hint) {
    hint.textContent = `보법: ${gaitLabel(unicornState.gait)} | 속도: ${unicornState.currentSpeed.toFixed(1)} m/s | 시드: ${seed}`;
  }

  renderer.render(scene, camera);
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
