// 種子亂數：同一個種子永遠產生同一串亂數，用來重現隨機關卡

// 種子的範圍：剛好可以用 6 位 36 進位數字（0–9、A–Z）表示
export const SEED_RANGE = 36 ** 6;

// mulberry32 演算法：回傳一個函式，每次呼叫產生 0（含）到 1（不含）之間的亂數
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 產生一個新的隨機種子
export function randomSeed() {
  return Math.floor(Math.random() * SEED_RANGE);
}

// 依權重抽選，例如 { a: 70, b: 30 } 有 70% 機率抽到 a
export function weightedPick(rng, weights) {
  const entries = Object.entries(weights).filter(([, weight]) => weight > 0);
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = rng() * total;
  for (const [key, weight] of entries) {
    roll -= weight;
    if (roll < 0) return key;
  }
  return entries.at(-1)[0];
}
