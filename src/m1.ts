// M-1 전제 검증 실험: 파스텔 초원 1장면 + 힐 소리 접근 + 처녀 웃음.
// GDD D: 5명에게 30초 무설명 노출, "귀여운가"/"무서운가" 각 3/5 이상.
// 페이지에는 설명 텍스트를 넣지 않는다(무설명 노출 조건).

import * as THREE from "three";
import { generateHeightmap, sampleHeight } from "./gen/heightmap";
import { createTerrainMesh, createPastelLighting } from "./render/terrain";
import { startHeelLoop, createApproachPositionProvider } from "./audio/heels";
import { playMaidenLaugh } from "./audio/laugh";

const seed = "m1-experiment";
const heightmap = generateHeightmap(seed);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xbfe8ff);

const camera = new THREE.PerspectiveCamera(
  70,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const cx = heightmap.size / 2, cz = heightmap.size / 2;
const targetY = sampleHeight(heightmap, cx, cz);
camera.position.set(cx, sampleHeight(heightmap, cx, cz + 80) + 6, cz + 80);
camera.lookAt(cx, targetY, cz);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById("app")?.appendChild(renderer.domElement);

const terrain = createTerrainMesh(heightmap, { seed, step: 4 });
scene.add(terrain);
for (const light of createPastelLighting()) scene.add(light);

let audioCtx: AudioContext | undefined;
function getAudio(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

let stopHeelLoop: (() => void) | undefined;

document.getElementById("btn-heels")?.addEventListener("click", () => {
  const ctx = getAudio();
  stopHeelLoop?.();
  const positionProvider = createApproachPositionProvider(30, 3, 15);
  stopHeelLoop = startHeelLoop(
    ctx,
    ctx.destination,
    { interval: 0.45 },
    positionProvider
  );
  setTimeout(() => {
    stopHeelLoop?.();
    stopHeelLoop = undefined;
  }, 15500);
});

document.getElementById("btn-laugh")?.addEventListener("click", () => {
  const ctx = getAudio();
  playMaidenLaugh(ctx, ctx.destination);
});

let angle = 0;
function animate() {
  requestAnimationFrame(animate);
  angle += 0.0015; // 느린 카메라 드리프트
  const radius = 90;
  camera.position.x = heightmap.size / 2 + Math.sin(angle) * radius;
  camera.position.z = heightmap.size / 2 + Math.cos(angle) * radius;
  camera.position.y = sampleHeight(heightmap, camera.position.x, camera.position.z) + 6;
  camera.lookAt(cx, targetY, cz);
  renderer.render(scene, camera);
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
