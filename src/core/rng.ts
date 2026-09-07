// mulberry32 기반 시드 결정론 RNG.
// 같은 시드는 항상 같은 난수 시퀀스를 생성한다 (GDD B13, B16).

export type RNG = () => number;

/**
 * 문자열 시드를 32비트 정수 해시로 변환한다 (djb2 변형).
 */
export function hashSeed(seed: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * mulberry32 PRNG. 0 이상 1 미만의 실수를 반환하는 함수를 만든다.
 */
export function mulberry32(seed: number): RNG {
  let a = seed >>> 0;
  return function (): number {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 문자열 시드로부터 바로 RNG 함수를 생성하는 헬퍼.
 */
export function createRng(seed: string | number): RNG {
  const numericSeed = typeof seed === "string" ? hashSeed(seed) : seed >>> 0;
  return mulberry32(numericSeed);
}

/**
 * 두 시드를 결합해 하위 시드를 만든다 (GDD B16: hash(S, n)).
 */
export function combineSeed(seed: string, n: number): number {
  return hashSeed(`${seed}:${n}`);
}

/**
 * URL의 ?seed= 파라미터를 읽는다. 없으면 현재 시간 기반 임의 시드를 반환한다.
 */
export function seedFromUrl(defaultSeed?: string): string {
  if (typeof window === "undefined") {
    return defaultSeed ?? "default-seed";
  }
  const params = new URLSearchParams(window.location.search);
  const fromUrl = params.get("seed");
  if (fromUrl) return fromUrl;
  return defaultSeed ?? String(Date.now());
}

/** 주어진 RNG로 [min, max) 범위의 실수를 뽑는다. */
export function randRange(rng: RNG, min: number, max: number): number {
  return min + rng() * (max - min);
}

/** 주어진 RNG로 [min, max] 범위의 정수를 뽑는다. */
export function randInt(rng: RNG, min: number, max: number): number {
  return Math.floor(randRange(rng, min, max + 1));
}
