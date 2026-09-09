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

// <stdin>
var stdin_exports = {};
__export(stdin_exports, {
  SPAWN_TIMES: () => SPAWN_TIMES,
  activateDevice: () => activateDevice,
  chooseSpawn: () => chooseSpawn,
  createDevices: () => createDevices,
  createDungeonLayout: () => createDungeonLayout,
  createHunt: () => createHunt,
  deviceTarget: () => deviceTarget,
  dungeonWaypoint: () => dungeonWaypoint,
  hasDungeonRoute: () => hasDungeonRoute,
  hasDungeonSight: () => hasDungeonSight,
  isDungeonBlocked: () => isDungeonBlocked,
  lureFor: () => lureFor,
  nearestDevice: () => nearestDevice,
  rearThreat: () => rearThreat,
  visionRange: () => visionRange
});
module.exports = __toCommonJS(stdin_exports);

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

// src/entities/maiden.ts
function createMaiden(point) {
  return { ...point, yaw: 0, mode: "wander", target: { x: point.x, z: point.z + 6 }, timer: 0, ramHits: 0 };
}
function hearNoise(maiden, event) {
  if (event.radius <= 0) return;
  if (Math.hypot(maiden.x - event.position.x, maiden.z - event.position.z) > event.radius) return;
  switch (maiden.mode) {
    case "attack":
    case "stunned":
    case "chase":
      return;
    case "wander":
    case "alert":
    case "search":
      maiden.mode = "alert";
      maiden.target = { ...event.position };
      maiden.timer = 0;
      return;
    default:
      return assertNever(maiden.mode);
  }
}
function updateMaiden(maiden, input, dt) {
  switch (maiden.mode) {
    case "stunned":
    case "attack":
      maiden.timer = Math.max(0, maiden.timer - dt);
      if (maiden.timer > 0) return false;
      maiden.mode = "search";
      maiden.timer = 20;
      break;
    case "wander":
    case "alert":
    case "chase":
    case "search":
      break;
    default:
      return assertNever(maiden.mode);
  }
  if (input.visible && input.allowChase) {
    maiden.mode = "chase";
    maiden.target = { ...input.player };
    maiden.timer = 0;
  } else if (maiden.mode === "chase") {
    maiden.mode = "search";
    maiden.timer = 20;
  }
  let speed;
  switch (maiden.mode) {
    case "wander":
      speed = 1.2;
      break;
    case "alert":
      speed = 1.8;
      break;
    case "chase":
      speed = 2.4;
      break;
    case "search":
      maiden.timer = Math.max(0, maiden.timer - dt);
      if (maiden.timer === 0) maiden.mode = "wander";
      speed = 1.2;
      break;
    default:
      return assertNever(maiden.mode);
  }
  const aim = input.waypoint ?? maiden.target;
  const dx = aim.x - maiden.x;
  const dz = aim.z - maiden.z;
  const distance = Math.hypot(dx, dz);
  if (distance > 0.01) {
    maiden.yaw = Math.atan2(dx, dz);
    const step = Math.min(distance, speed * dt);
    maiden.x += dx / distance * step;
    maiden.z += dz / distance * step;
  }
  if (maiden.mode === "chase" && Math.hypot(input.player.x - maiden.x, input.player.z - maiden.z) <= 1.4) {
    maiden.mode = "attack";
    maiden.timer = 2;
    return true;
  }
  if (Math.hypot(maiden.target.x - maiden.x, maiden.target.z - maiden.z) <= 0.01) {
    switch (maiden.mode) {
      case "alert":
        maiden.x = maiden.target.x;
        maiden.z = maiden.target.z;
        maiden.mode = "search";
        maiden.timer = 20;
        break;
      case "wander":
        maiden.yaw += Math.PI * 0.65;
        maiden.target = { x: maiden.x + Math.sin(maiden.yaw) * 6, z: maiden.z + Math.cos(maiden.yaw) * 6 };
        break;
      case "chase":
      case "search":
        break;
      default:
        return assertNever(maiden.mode);
    }
  }
  return false;
}
function assertNever(value) {
  throw new TypeError(`Unexpected maiden mode: ${value}`);
}

// src/systems/stalker.ts
function createStalker(point) {
  return { body: createMaiden(point), awakened: false, sealed: false };
}
function alertStalker(stalker, player, radius) {
  if (!stalker.sealed && radius > 0 && Math.hypot(stalker.body.x - player.x, stalker.body.z - player.z) <= radius) stalker.awakened = true;
}
function updateStalker(stalker, layout, player, dt) {
  if (stalker.sealed) return false;
  const body = stalker.body;
  const visible = Math.hypot(body.x - player.x, body.z - player.z) < 18 && hasDungeonSight(layout, body, player);
  if (visible) stalker.awakened = true;
  if (!stalker.awakened) return false;
  if (body.timer > 0) {
    body.timer = Math.max(0, body.timer - dt);
    return false;
  }
  body.mode = "chase";
  body.target = { ...player };
  const waypoint = dungeonWaypoint(layout, body, player);
  const dx = waypoint.x - body.x, dz = waypoint.z - body.z, distance = Math.hypot(dx, dz);
  if (distance > 1e-3) {
    body.yaw = Math.atan2(dx, dz);
    const step = Math.min(distance, 2.8 * dt);
    const next = { x: body.x + dx / distance * step, z: body.z + dz / distance * step };
    if (!isDungeonBlocked(layout, next)) {
      body.x = next.x;
      body.z = next.z;
    }
  }
  if (Math.hypot(body.x - player.x, body.z - player.z) <= 1.4 && hasDungeonSight(layout, body, player)) {
    body.mode = "attack";
    body.timer = 2;
    return true;
  }
  return false;
}

// src/gen/simplex.ts
var F2 = 0.5 * (Math.sqrt(3) - 1);
var G2 = (3 - Math.sqrt(3)) / 6;

// src/systems/tracks.ts
function latestTrack(tracks, input) {
  expireTracks(tracks, input.time);
  for (let index = tracks.length - 1; index >= 0; index -= 1) {
    const track = tracks[index];
    if (!track) continue;
    const distance = Math.hypot(track.point.x - input.point.x, track.point.z - input.point.z);
    if (distance > 0.5 && distance <= 6) return track.point;
  }
  return void 0;
}
function expireTracks(tracks, time) {
  let expired = 0;
  for (const track of tracks) {
    if (time - track.time < 30) break;
    expired += 1;
  }
  if (expired > 0) tracks.splice(0, expired);
}

// src/systems/hunt.ts
var SPAWN_TIMES = [25, 45, 70];
function chooseSpawn(layout, player, occupied = []) {
  for (const distance of [4.5, 5.5, 6.5]) for (const offset of [0, 0.25, -0.25, 0.5, -0.5, 0.7, -0.7]) {
    const angle = player.yaw + Math.PI + offset;
    const point = { x: player.x + Math.sin(angle) * distance, z: player.z + Math.cos(angle) * distance };
    if (!isDungeonBlocked(layout, point) && hasDungeonSight(layout, player, point) && occupied.every((q) => Math.hypot(q.x - point.x, q.z - point.z) > 3)) return point;
  }
  return void 0;
}
function rearThreat(layout, player, maidens) {
  let strength = 0;
  for (const enemy of maidens) {
    if (enemy.mode !== "chase" && enemy.mode !== "attack") continue;
    const dx = enemy.x - player.x, dz = enemy.z - player.z, distance = Math.hypot(dx, dz);
    if (distance < 12 && Math.sin(player.yaw) * dx + Math.cos(player.yaw) * dz < 0 && hasDungeonSight(layout, player, enemy)) strength = Math.max(strength, 1 - distance / 12);
  }
  return strength;
}
function createHunt(layout, normals) {
  const present = [false, false, false];
  let lastSpawn = -Infinity;
  const stalker = createStalker(layout.spawns[0]);
  const active = () => [...normals.filter((_, i) => present[i]), ...present[2] && !stalker.sealed ? [stalker.body] : []];
  return {
    present,
    stalker,
    active,
    noise(point, radius) {
      for (const maiden of normals.filter((_, i) => present[i])) hearNoise(maiden, { position: point, radius });
      if (present[2]) alertStalker(stalker, point, radius);
    },
    update(time, dt, player, tracks, lure, range) {
      let spawned = false, hits = 0;
      const slot = present.findIndex((value, i) => !value && time >= SPAWN_TIMES[i]);
      if (slot >= 0 && time - lastSpawn >= 15) {
        const point = chooseSpawn(layout, player, active());
        if (point) {
          const body = slot === 2 ? stalker.body : normals[slot];
          body.x = point.x;
          body.z = point.z;
          body.yaw = Math.atan2(player.x - point.x, player.z - point.z);
          body.target = { x: player.x, z: player.z };
          body.mode = "chase";
          if (slot === 2) stalker.awakened = true;
          present[slot] = true;
          spawned = true;
          lastSpawn = time;
        }
      }
      for (const [index, maiden] of normals.entries()) {
        if (!present[index]) continue;
        if (isDungeonBlocked(layout, maiden.target)) maiden.target = { x: maiden.x, z: maiden.z };
        if (maiden.mode === "search") {
          const track = latestTrack(tracks, { point: maiden, time });
          if (track) maiden.target = track;
        }
        const attraction = lure(maiden);
        if (attraction && maiden.mode !== "stunned") {
          maiden.target = attraction;
          maiden.mode = "alert";
        }
        const dx = player.x - maiden.x, dz = player.z - maiden.z, distance = Math.hypot(dx, dz);
        const cone = distance < 1.4 || Math.sin(maiden.yaw) * dx + Math.cos(maiden.yaw) * dz >= distance * Math.SQRT1_2;
        const visible = !attraction && distance <= range && cone && hasDungeonSight(layout, maiden, player);
        const previous = { x: maiden.x, z: maiden.z };
        const hit = updateMaiden(maiden, { player, visible, allowChase: true, waypoint: dungeonWaypoint(layout, maiden, visible ? player : maiden.target) }, dt);
        if (isDungeonBlocked(layout, maiden)) {
          maiden.x = previous.x;
          maiden.z = previous.z;
        }
        if (hit) hits++;
      }
      if (present[2] && !stalker.sealed) {
        const attraction = lure(stalker.body);
        if (attraction) stalker.awakened = true;
        const hit = updateStalker(stalker, layout, attraction ?? player, dt);
        if (hit && !attraction) hits++;
      }
      return { hits, spawned };
    }
  };
}

// src/systems/devices.ts
function createDevices(layout) {
  return (layout.sockets ?? []).map((socket) => ({ ...socket, activeUntil: 0, readyAt: 0 }));
}
function deviceTarget(device) {
  return { x: device.point.x + Math.sin(device.yaw ?? Math.PI / 2) * 1.3, z: device.point.z + Math.cos(device.yaw ?? Math.PI / 2) * 1.3 };
}
function nearestDevice(devices, player) {
  return devices.filter((d) => Math.hypot(d.point.x - player.x, d.point.z - player.z) <= 2.6).sort((a, b) => Math.hypot(a.point.x - player.x, a.point.z - player.z) - Math.hypot(b.point.x - player.x, b.point.z - player.z))[0];
}
function activateDevice(device, time) {
  if (device.kind === "switch") {
    device.lit = !device.lit;
    return device.lit ? "light-on" : "light-off";
  }
  if (time < device.readyAt) return "cooldown";
  device.activeUntil = time + 12;
  device.readyAt = time + 25;
  return "gacha";
}
function lureFor(devices, point, time) {
  const device = devices.filter((d) => d.kind === "gacha" && d.activeUntil > time && Math.hypot(d.point.x - point.x, d.point.z - point.z) < 40).sort((a, b) => b.activeUntil - a.activeUntil)[0];
  return device ? deviceTarget(device) : void 0;
}
function visionRange(layout, devices, player) {
  const index = layout.rooms.findIndex((r) => player.x >= r.x && player.x < r.x + r.width && player.z >= r.z && player.z < r.z + r.depth);
  return devices.some((d) => d.kind === "switch" && d.room === index && !d.lit) ? 7 : 18;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SPAWN_TIMES,
  activateDevice,
  chooseSpawn,
  createDevices,
  createDungeonLayout,
  createHunt,
  deviceTarget,
  dungeonWaypoint,
  hasDungeonRoute,
  hasDungeonSight,
  isDungeonBlocked,
  lureFor,
  nearestDevice,
  rearThreat,
  visionRange
});
