"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/systems/puzzle.ts
var puzzle_exports = {};
__export(puzzle_exports, {
  BELL_NAMES: () => BELL_NAMES,
  clueText: () => clueText,
  createPuzzle: () => createPuzzle,
  exitSealed: () => exitSealed,
  puzzleTarget: () => puzzleTarget,
  ringBell: () => ringBell
});
module.exports = __toCommonJS(puzzle_exports);

// src/core/rng.ts
function hashSeed(seed) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(seed) {
  let a = seed >>> 0;
  return function() {
    a |= 0;
    a = a + 1831565813 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function createRng(seed) {
  const numericSeed = typeof seed === "string" ? hashSeed(seed) : seed >>> 0;
  return mulberry32(numericSeed);
}

// src/gen/dungeon.ts
function isDungeonBlocked(layout, point) {
  if (layout.fixtures?.some((p) => Math.abs(p.x - point.x) < 0.8 && Math.abs(p.z - point.z) < 0.8)) return true;
  for (const dx of [-0.3, 0.3]) {
    for (const dz of [-0.3, 0.3]) {
      const x = Math.floor(point.x + dx);
      const z = Math.floor(point.z + dz);
      if (x < 0 || z < 0 || x >= layout.size || z >= layout.size || layout.cells[z * layout.size + x] !== 1) return true;
    }
  }
  return false;
}
function hasDungeonRoute(layout, from, to) {
  if (isDungeonBlocked(layout, from) || isDungeonBlocked(layout, to)) return false;
  const origin = Math.floor(from.z) * layout.size + Math.floor(from.x);
  const goal = Math.floor(to.z) * layout.size + Math.floor(to.x);
  const visited = new Uint8Array(layout.cells.length), queue = [origin];
  visited[origin] = 1;
  for (let head = 0; head < queue.length; head++) {
    const current = queue[head];
    if (current === goal) return true;
    const x = current % layout.size, z = Math.floor(current / layout.size);
    for (const [dx, dz] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
      const nx = x + dx, nz = z + dz, next = nz * layout.size + nx;
      if (nx < 0 || nz < 0 || nx >= layout.size || nz >= layout.size || visited[next] || isDungeonBlocked(layout, { x: nx + 0.5, z: nz + 0.5 })) continue;
      visited[next] = 1;
      queue.push(next);
    }
  }
  return false;
}

// src/systems/puzzle.ts
var BELL_NAMES = ["\uB2EC", "\uB208", "\uAC00\uC2DC"];
function createPuzzle(layout, seed) {
  const room = layout.rooms[0], points = [];
  for (let z = room.z + 1.5; z < room.z + room.depth - 1; z += 2) for (let x = room.x + 1.5; x < room.x + room.width - 1; x += 2) {
    const point = { x, z };
    if (Math.hypot(x - layout.start.x, z - layout.start.z) > 1.4 && hasDungeonRoute(layout, layout.start, point)) points.push(point);
  }
  if (points.length < 4) throw new RangeError("No reachable puzzle placement");
  const rng = createRng(seed + ":bells"), order = [0, 1, 2];
  for (let i = 2; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return { bells: points.slice(0, 3).map((point, id) => ({ id, point })), clue: points[3], order, progress: 0, solved: false, read: false, alarm: 0 };
}
function ringBell(puzzle, id) {
  if (puzzle.solved) return "solved";
  if (id !== puzzle.order[puzzle.progress]) {
    puzzle.progress = 0;
    puzzle.alarm = 2;
    return "wrong";
  }
  puzzle.progress++;
  if (puzzle.progress === 3) {
    puzzle.solved = true;
    return "solved";
  }
  return "correct";
}
function puzzleTarget(puzzle, player) {
  const points = [...puzzle.bells.map((b) => ({ id: b.id, point: b.point })), { id: "clue", point: puzzle.clue }];
  return points.filter((p) => Math.hypot(p.point.x - player.x, p.point.z - player.z) < 1.45).sort((a, b) => Math.hypot(a.point.x - player.x, a.point.z - player.z) - Math.hypot(b.point.x - player.x, b.point.z - player.z))[0]?.id;
}
function clueText(puzzle) {
  return `\uBA3C\uC800 ${BELL_NAMES[puzzle.order[0]]}\uC758 \uC885, \uB9C8\uC9C0\uB9C9 ${BELL_NAMES[puzzle.order[2]]}\uC758 \uC885.
\uB0A8\uC740 \uC885\uC740 \uB450 \uC885 \uC0AC\uC774\uC5D0 \uC6B8\uB824\uB77C.`;
}
function exitSealed(exit, point, solved) {
  const distance = (point.x - exit.point.x) * exit.normal.x + (point.z - exit.point.z) * exit.normal.z;
  const side = Math.abs((point.x - exit.point.x) * exit.normal.z - (point.z - exit.point.z) * exit.normal.x);
  return !solved && distance > -0.35 && distance < 3.8 && side < 1.8;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BELL_NAMES,
  clueText,
  createPuzzle,
  exitSealed,
  puzzleTarget,
  ringBell
});
