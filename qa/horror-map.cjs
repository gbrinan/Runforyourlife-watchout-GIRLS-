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

// src/gen/dungeon.ts
var dungeon_exports = {};
__export(dungeon_exports, {
  createDungeonLayout: () => createDungeonLayout,
  dungeonWaypoint: () => dungeonWaypoint,
  hasDungeonRoute: () => hasDungeonRoute,
  hasDungeonSight: () => hasDungeonSight,
  isDungeonBlocked: () => isDungeonBlocked
});
module.exports = __toCommonJS(dungeon_exports);

// src/gen/furnishings.ts
function furnishDungeon(layout, rng) {
  const walls = [];
  const open = (x, z) => x >= 1 && z >= 1 && x < layout.size - 1 && z < layout.size - 1 && layout.cells[Math.floor(z) * layout.size + Math.floor(x)] === 0;
  layout.rooms.forEach((r, room) => {
    for (let offset = 2; offset < r.width - 2; offset++) for (const [z, nz] of [[r.z, -1], [r.z + r.depth, 1]]) walls.push({ room, point: { x: r.x + offset + 0.5, z }, normal: { x: 0, z: nz } });
    for (let offset = 2; offset < r.depth - 2; offset++) for (const [x, nx] of [[r.x, -1], [r.x + r.width, 1]]) walls.push({ room, point: { x, z: r.z + offset + 0.5 }, normal: { x: nx, z: 0 } });
  });
  const solid = walls.filter((w) => {
    const r = layout.rooms[w.room];
    if (w.normal.x === -1 && Math.abs(w.point.z - r.z - r.depth / 2) < 1.5) return false;
    if (w.normal.x === 1 && Math.abs(w.point.z - r.z - 2.7) < 1.7) return false;
    if (w.room === 0 && w.normal.z === -1 && Math.abs(w.point.x - r.x - r.width / 2) < 1.4) return false;
    return open(w.point.x + w.normal.x * 0.5, w.point.z + w.normal.z * 0.5);
  });
  const exits = solid.filter((w) => [0.5, 1.5, 2.5, 3.5].every((d) => [-1, 0, 1].every((s) => open(w.point.x + w.normal.x * d + w.normal.z * s, w.point.z + w.normal.z * d - w.normal.x * s))));
  exits.sort((a, b) => Math.hypot(b.point.x - layout.start.x, b.point.z - layout.start.z) - Math.hypot(a.point.x - layout.start.x, a.point.z - layout.start.z));
  const wall = exits[Math.floor(rng() * Math.min(5, exits.length))];
  if (!wall) throw new RangeError("No exterior wall for EXIT");
  const exit = { point: wall.point, normal: wall.normal, inside: { x: wall.point.x - wall.normal.x * 2, z: wall.point.z - wall.normal.z * 2 }, outside: { x: wall.point.x + wall.normal.x * 2.5, z: wall.point.z + wall.normal.z * 2.5 } };
  for (const d of [0.5, 1.5, 2.5, 3.5]) for (const s of [-1, 0, 1]) layout.cells[Math.floor(wall.point.z + wall.normal.z * d - wall.normal.x * s) * layout.size + Math.floor(wall.point.x + wall.normal.x * d + wall.normal.z * s)] = 1;
  const sockets = [];
  layout.rooms.forEach((_, room) => {
    const candidates = solid.filter((w) => w.room === room && Math.hypot(w.point.x - exit.point.x, w.point.z - exit.point.z) > 4);
    for (const kind of ["gacha", "switch"]) {
      if (kind === "gacha" && room !== 0 && rng() < 0.55 || kind === "switch" && room !== 1 && rng() < 0.3) continue;
      const available = candidates.filter((w2) => sockets.every((s) => Math.hypot(s.point.x - w2.point.x, s.point.z - w2.point.z) > 2.5));
      const w = available[Math.floor(rng() * available.length)];
      if (!w) continue;
      sockets.push({ kind, room, point: { x: w.point.x - w.normal.x * 0.3, z: w.point.z - w.normal.z * 0.3 }, yaw: Math.atan2(-w.normal.x, -w.normal.z), lit: room === 0 || rng() > 0.45 });
    }
  });
  return { sockets, exit };
}

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
function createDungeonLayout(seed) {
  const rng = createRng(seed + ":basement");
  const size = 64, cells = new Uint8Array(size * size);
  const slots = Array.from({ length: 9 }, (_, i) => i);
  for (let i = slots.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [slots[i], slots[j]] = [slots[j], slots[i]];
  }
  const rooms = slots.slice(0, 5 + Math.floor(rng() * 4)).map((slot) => ({ x: 3 + slot % 3 * 20 + Math.floor(rng() * 4), z: 3 + Math.floor(slot / 3) * 20 + Math.floor(rng() * 3), width: 8 + Math.floor(rng() * 7), depth: 8 + Math.floor(rng() * 7) }));
  const centers = rooms.map((room) => ({ x: room.x + room.width / 2, z: room.z + room.depth / 2 }));
  for (const room of rooms) for (let z = room.z; z < room.z + room.depth; z++) for (let x = room.x; x < room.x + room.width; x++) cells[z * size + x] = 1;
  function corridor(from, to) {
    const corner = rng() < 0.5 ? { x: to.x, z: from.z } : { x: from.x, z: to.z };
    for (const [start, end] of [[from, corner], [corner, to]]) {
      for (let x = Math.floor(Math.min(start.x, end.x)); x <= Math.floor(Math.max(start.x, end.x)); x++)
        for (let z = Math.floor(Math.min(start.z, end.z)); z <= Math.floor(Math.max(start.z, end.z)); z++)
          for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) cells[(z + dz) * size + x + dx] = 1;
    }
  }
  for (let i = 1; i < centers.length; i++) corridor(centers[i - 1], centers[i]);
  for (let i = 0; i < 1 + Math.floor(rng() * 3); i++) corridor(centers[i], centers[centers.length - 1 - i]);
  const base = { size, cells, rooms, start: centers[0], spawns: centers.slice(1) };
  const { sockets, exit } = furnishDungeon(base, rng);
  const fixtures = sockets.filter((s) => s.kind === "gacha").map((s) => s.point);
  const layout = { ...base, fixtures, sockets, exit };
  if (!hasDungeonRoute(layout, layout.start, layout.exit.outside)) throw new RangeError("Generated EXIT is unreachable");
  return layout;
}
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
function hasDungeonSight(layout, from, to) {
  const crossings = [0, 1];
  for (const axis of ["x", "z"]) {
    const delta = to[axis] - from[axis];
    if (delta === 0) continue;
    for (const offset of [-0.3, 0.3]) {
      const low = Math.min(from[axis], to[axis]) + offset;
      const high = Math.max(from[axis], to[axis]) + offset;
      for (let boundary = Math.ceil(low); boundary <= high; boundary++) {
        const ratio = (boundary - offset - from[axis]) / delta;
        if (ratio > 0 && ratio < 1) crossings.push(ratio);
      }
    }
  }
  crossings.sort((a, b) => a - b);
  for (let index = 0; index < crossings.length; index++) {
    for (const ratio of [crossings[index], (crossings[index] + (crossings[index + 1] ?? crossings[index])) / 2]) {
      if (isDungeonBlocked(layout, { x: from.x + (to.x - from.x) * ratio, z: from.z + (to.z - from.z) * ratio })) return false;
    }
  }
  return true;
}
function dungeonWaypoint(layout, from, to) {
  if (isDungeonBlocked(layout, from) || isDungeonBlocked(layout, to)) return from;
  const origin = Math.floor(from.z) * layout.size + Math.floor(from.x);
  const goal = Math.floor(to.z) * layout.size + Math.floor(to.x);
  if (origin === goal) return to;
  const parents = new Int32Array(layout.cells.length).fill(-1);
  const queue = [origin];
  parents[origin] = origin;
  for (let head = 0; head < queue.length && parents[goal] === -1; head++) {
    const current = queue[head];
    const x = current % layout.size;
    const z = Math.floor(current / layout.size);
    for (const [dx, dz] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
      const nx = x + dx;
      const nz = z + dz;
      const next2 = nz * layout.size + nx;
      if (nx < 0 || nz < 0 || nx >= layout.size || nz >= layout.size || layout.cells[next2] !== 1 || isDungeonBlocked(layout, { x: nx + 0.5, z: nz + 0.5 }) || parents[next2] !== -1) continue;
      parents[next2] = current;
      queue.push(next2);
    }
  }
  if (parents[goal] === -1) return from;
  let next = goal;
  while (parents[next] !== origin) next = parents[next];
  const waypoint = { x: next % layout.size + 0.5, z: Math.floor(next / layout.size) + 0.5 };
  return hasDungeonSight(layout, from, waypoint) ? waypoint : { x: origin % layout.size + 0.5, z: Math.floor(origin / layout.size) + 0.5 };
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createDungeonLayout,
  dungeonWaypoint,
  hasDungeonRoute,
  hasDungeonSight,
  isDungeonBlocked
});
