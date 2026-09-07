// HP와 부위 손실 시스템 (GDD B6). hp(0~3)와 lostParts 집합을 분리해 관리한다.
// 회복(사과)은 hp만 되돌리고 lostParts는 유지된다(시각적 흉터는 영구적).

export enum BodyPart {
  Tail = "tail",
  Mane = "mane",
  All = "all",
}

export const HP_MAX = 3;
export const HP_MIN = 0;

export interface HpState {
  hp: number;
  lostParts: Set<BodyPart>;
}

export function createInitialHpState(): HpState {
  return { hp: HP_MAX, lostParts: new Set() };
}

/** hp 값에 따라 새로 잃어야 할 부위를 결정한다 (GDD B6: 3=온전, 2=꼬리, 1=갈기, 0=전부). */
function partForHp(hp: number): BodyPart | undefined {
  if (hp === 2) return BodyPart.Tail;
  if (hp === 1) return BodyPart.Mane;
  if (hp <= 0) return BodyPart.All;
  return undefined;
}

/**
 * 피해를 적용한다. amount는 잃는 hp(처녀 접촉=1, 마녀 접촉=2, GDD B6).
 * hp가 낮아질 때마다 해당 구간의 부위가 lostParts에 추가된다.
 */
export function applyDamage(state: HpState, amount: number): HpState {
  const nextHp = Math.max(HP_MIN, state.hp - amount);
  const lostParts = new Set(state.lostParts);
  // amount만큼 낮아지는 동안 지나간 모든 hp 구간의 부위를 추가한다(예: 3->1은 꼬리+갈기 모두 추가).
  for (let hp = state.hp - 1; hp >= nextHp; hp--) {
    const part = partForHp(hp);
    if (part) lostParts.add(part);
  }
  return { hp: nextHp, lostParts };
}

/** 회복(사과)은 hp만 올리고 lostParts는 그대로 둔다 (GDD B6). */
export function applyHeal(state: HpState, amount: number): HpState {
  const nextHp = Math.min(HP_MAX, state.hp + amount);
  return { hp: nextHp, lostParts: new Set(state.lostParts) };
}

export function isGameOver(state: HpState): boolean {
  return state.hp <= HP_MIN;
}

/** 질주 지속시간 배율: 갈기를 잃으면 절반 (GDD B6). */
export function getGallopDurationMultiplier(state: HpState): number {
  return state.lostParts.has(BodyPart.Mane) || state.lostParts.has(BodyPart.All) ? 0.5 : 1;
}
