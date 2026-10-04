// 關卡生成：建立世界、障礙物與出生位置，以及關卡代碼
// 障礙物生成與連通檢查只透過世界介面運作，三種世界共用
import {
  DIFFICULTIES,
  MAX_LEVEL_ATTEMPTS,
  SPAWN_SAFE_DISTANCE,
  START_LENGTH,
  WORLD_SIZES,
  WRAP_RULES,
} from './config.js';
import { SEED_RANGE, mulberry32, weightedPick } from './random.js';
import { createFlatWorld } from './worlds/flat.js';

const WORLD_LETTERS = { flat: 'F', pit: 'B', cube: 'C' };
const DIFFICULTY_LETTERS = { easy: 'E', normal: 'N', hard: 'H' };

const findKey = (map, value) => Object.keys(map).find((key) => map[key] === value);

// 關卡代碼格式：世界字母 + 難度字母 + 6 位 36 進位種子，例如 FN-4F7K2Q
export function encodeLevelCode(worldType, difficulty, seed) {
  const seedText = seed.toString(36).toUpperCase().padStart(6, '0');
  return `${WORLD_LETTERS[worldType]}${DIFFICULTY_LETTERS[difficulty]}-${seedText}`;
}

// 解析關卡代碼，格式不正確時回傳 null；大小寫與連字號可省略
export function decodeLevelCode(code) {
  const match = /^([FBC])([ENH])-?([0-9A-Z]{6})$/.exec(code.trim().toUpperCase());
  if (!match) return null;

  const seed = parseInt(match[3], 36);
  if (seed >= SEED_RANGE) return null;
  return {
    worldType: findKey(WORLD_LETTERS, match[1]),
    difficulty: findKey(DIFFICULTY_LETTERS, match[2]),
    seed,
  };
}

// 依世界類型建立世界；平面世界的穿牆規則由種子亂數決定
function buildWorld(worldType, config, rng) {
  switch (worldType) {
    case 'flat': {
      const wrapRule = weightedPick(rng, config.wrapWeights);
      return { world: createFlatWorld({ ...WORLD_SIZES.flat, wrap: WRAP_RULES[wrapRule] }), wrapRule };
    }
    default:
      throw new Error(`未知的世界類型：${worldType}`);
  }
}

// 產生關卡：世界、障礙物、蛇的出生位置；同一組參數永遠得到同樣的結果
export function generateLevel({ worldType, difficulty, seed }) {
  const config = DIFFICULTIES[difficulty];
  const rng = mulberry32(seed);
  const { world, wrapRule } = buildWorld(worldType, config, rng);
  const spawn = world.spawn();
  const reserved = reservedKeys(world, spawn);
  const target = Math.round(world.cells().length * config.obstacleRatio);

  // 地圖有封閉區域時重新生成；同一個種子的重試順序固定，結果仍然可以重現
  for (let attempt = 0; attempt < MAX_LEVEL_ATTEMPTS; attempt++) {
    const obstacles = placeObstacles(world, rng, target, reserved);
    if (isConnected(world, obstacles)) {
      return { worldType, difficulty, seed, world, wrapRule, obstacles, spawn };
    }
  }

  // 正常情況下不會走到這裡；萬一都失敗，就給一張沒有障礙物的地圖
  return { worldType, difficulty, seed, world, wrapRule, obstacles: [], spawn };
}

// 出生點保護：蛇身與蛇頭前方幾格不能放障礙物
function reservedKeys(world, spawn) {
  const reserved = new Set([world.key(spawn.cell)]);

  // 往後：初始蛇身
  let cell = spawn.cell;
  let back = world.opposite(spawn.direction);
  for (let i = 1; i < START_LENGTH; i++) {
    const step = world.move(cell, back);
    if (!step) break;
    ({ cell, direction: back } = step);
    reserved.add(world.key(cell));
  }

  // 往前：蛇頭前方的安全距離
  cell = spawn.cell;
  let ahead = spawn.direction;
  for (let i = 0; i < SPAWN_SAFE_DISTANCE; i++) {
    const step = world.move(cell, ahead);
    if (!step) break;
    ({ cell, direction: ahead } = step);
    reserved.add(world.key(cell));
  }
  return reserved;
}

// 放置障礙物：以 1 到 4 格長的短牆為單位，從隨機的格子往隨機方向延伸
function placeObstacles(world, rng, target, reserved) {
  const cells = world.cells();
  const placed = new Map();
  let guard = 0;

  while (placed.size < target && guard++ < target * 20) {
    let cell = cells[Math.floor(rng() * cells.length)];
    let direction = world.directions[Math.floor(rng() * world.directions.length)];
    const length = 1 + Math.floor(rng() * 4);

    for (let i = 0; i < length && placed.size < target; i++) {
      const key = world.key(cell);
      if (!reserved.has(key)) placed.set(key, cell);
      const step = world.move(cell, direction);
      if (!step) break;
      ({ cell, direction } = step);
    }
  }

  return [...placed.values()];
}

// 用 BFS 檢查所有空格是否連通；可以穿越的邊界也算相連
function isConnected(world, obstacles) {
  const blocked = new Set(obstacles.map(world.key));
  const free = world.cells().filter((cell) => !blocked.has(world.key(cell)));
  if (free.length === 0) return false;

  const visited = new Set([world.key(free[0])]);
  const queue = [free[0]];
  while (queue.length > 0) {
    const cell = queue.shift();
    for (const direction of world.directions) {
      const step = world.move(cell, direction);
      if (!step) continue;
      const key = world.key(step.cell);
      if (blocked.has(key) || visited.has(key)) continue;
      visited.add(key);
      queue.push(step.cell);
    }
  }

  return visited.size === free.length;
}
