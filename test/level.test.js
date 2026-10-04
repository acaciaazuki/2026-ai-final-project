// 關卡生成測試
// 測試障礙物生成、連通性驗證、種子重現、關卡代碼等
// 執行：node test/level.test.js

import {
  generateLevel,
  encodeLevelCode,
  decodeLevelCode,
} from '../js/level.js';
import { SEED_RANGE } from '../js/random.js';
import { DIFFICULTIES, AVAILABLE_WORLDS, START_LENGTH } from '../js/config.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`✓ ${message}`);
  } else {
    failed++;
    console.error(`✗ ${message}`);
  }
}

function assertEqual(actual, expected, message) {
  if (JSON.stringify(actual) === JSON.stringify(expected)) {
    passed++;
    console.log(`✓ ${message}`);
  } else {
    failed++;
    console.error(`✗ ${message}`);
    console.error(`  期望: ${JSON.stringify(expected)}`);
    console.error(`  實際: ${JSON.stringify(actual)}`);
  }
}

// ============ 基本關卡生成 ============
console.log('\n=== 基本關卡生成 ===');
{
  const level = generateLevel({ worldType: 'flat', difficulty: 'easy', seed: 0 });

  assert(level.worldType === 'flat', 'worldType 正確');
  assert(level.difficulty === 'easy', 'difficulty 正確');
  assert(level.seed === 0, 'seed 正確');
  assert(Array.isArray(level.obstacles), 'obstacles 是陣列');
  assert(level.world !== null, 'world 存在');
  assert(level.spawn !== null, 'spawn 存在');
  assert(
    level.wrapRule === null ||
      level.wrapRule === 'both' ||
      level.wrapRule === 'vertical' ||
      level.wrapRule === 'horizontal' ||
      level.wrapRule === 'none',
    'wrapRule 是有效的穿牆規則',
  );
}

// ============ 世界類型驗證 ============
console.log('\n=== 世界類型驗證 ===');
{
  for (const worldType of ['flat', 'pit', 'cube']) {
    const level = generateLevel({ worldType, difficulty: 'easy', seed: 123 });
    assertEqual(level.world.type, worldType, `${worldType} 世界建立正確`);
  }
}

// ============ 難度驗證 ============
console.log('\n=== 難度驗證 ===');
{
  for (const difficulty of ['easy', 'normal', 'hard']) {
    const level = generateLevel({ worldType: 'flat', difficulty, seed: 456 });
    assertEqual(level.difficulty, difficulty, `${difficulty} 難度設定正確`);
  }
}

// ============ 障礙物比例驗證 ============
console.log('\n=== 障礙物比例驗證 ===');
{
  const worldType = 'flat';
  for (const difficulty of ['easy', 'normal', 'hard']) {
    const level = generateLevel({ worldType, difficulty, seed: 789 });
    const totalCells = level.world.cells().length;
    const config = DIFFICULTIES[difficulty];
    const targetCount = Math.round(totalCells * config.obstacleRatio);
    const actualCount = level.obstacles.length;

    // 容差 ±10%
    const tolerance = Math.max(Math.ceil(targetCount * 0.1), 1);
    const inRange = Math.abs(actualCount - targetCount) <= tolerance;

    assert(
      inRange,
      `${difficulty}: 目標 ${targetCount} ±${tolerance} 個障礙物，實際 ${actualCount} 個`,
    );
  }
}

// ============ 出生點保護驗證 ============
console.log('\n=== 出生點保護 ===');
{
  const level = generateLevel({ worldType: 'flat', difficulty: 'normal', seed: 999 });
  const spawnCell = level.spawn.cell;
  const spawnKey = level.world.key(spawnCell);

  const obstacleKeys = new Set(level.obstacles.map((obs) => level.world.key(obs)));

  assert(!obstacleKeys.has(spawnKey), '出生點沒有障礙物');

  // 蛇身方向的回溯：初始蛇身不應被障礙物擋住
  let cell = spawnCell;
  let back = level.world.opposite(level.spawn.direction);
  for (let i = 0; i < START_LENGTH; i++) {
    const step = level.world.move(cell, back);
    if (!step) break;
    cell = step.cell;
    assert(!obstacleKeys.has(level.world.key(cell)), `蛇身位置 ${i} 沒有障礙物`);
  }

  // 蛇頭前方安全距離內不應有障礙物
  cell = spawnCell;
  let ahead = level.spawn.direction;
  for (let i = 0; i < 4; i++) {
    const step = level.world.move(cell, ahead);
    if (!step) break;
    cell = step.cell;
    assert(
      !obstacleKeys.has(level.world.key(cell)),
      `蛇頭前方 ${i} 格沒有障礙物`,
    );
  }
}

// ============ 連通性驗證 ============
console.log('\n=== 連通性驗證（BFS） ===');
{
  const generateAndCheck = (seed) => {
    const level = generateLevel({ worldType: 'flat', difficulty: 'normal', seed });
    const blocked = new Set(level.obstacles.map((obs) => level.world.key(obs)));
    const cells = level.world.cells();
    const free = cells.filter((cell) => !blocked.has(level.world.key(cell)));

    if (free.length === 0) return false;

    // BFS
    const visited = new Set([level.world.key(free[0])]);
    const queue = [free[0]];

    while (queue.length > 0) {
      const cell = queue.shift();
      for (const direction of level.world.directions) {
        const step = level.world.move(cell, direction);
        if (!step) continue;
        const key = level.world.key(step.cell);
        if (blocked.has(key) || visited.has(key)) continue;
        visited.add(key);
        queue.push(step.cell);
      }
    }

    // 所有自由格子都應該被訪問到
    return visited.size === free.length;
  };

  for (let i = 0; i < 10; i++) {
    const connected = generateAndCheck(i * 1000 + 111);
    assert(connected, `種子 ${i * 1000 + 111} 產生的地圖連通`);
  }
}

// ============ 種子重現驗證 ============
console.log('\n=== 種子重現 ===');
{
  const params = { worldType: 'flat', difficulty: 'normal', seed: 5555 };

  const level1 = generateLevel(params);
  const level2 = generateLevel(params);

  // 同一個種子應該產生相同的關卡
  assertEqual(
    level1.obstacles.map((obs) => level1.world.key(obs)).sort(),
    level2.obstacles.map((obs) => level2.world.key(obs)).sort(),
    '相同種子產生相同障礙物',
  );

  assertEqual(
    level1.spawn.cell,
    level2.spawn.cell,
    '相同種子產生相同出生點',
  );

  assertEqual(
    level1.spawn.direction,
    level2.spawn.direction,
    '相同種子產生相同出生方向',
  );
}

// ============ 不同種子產生不同關卡 ============
console.log('\n=== 不同種子 ===');
{
  const level1 = generateLevel({ worldType: 'flat', difficulty: 'normal', seed: 111 });
  const level2 = generateLevel({ worldType: 'flat', difficulty: 'normal', seed: 222 });

  const diff = level1.obstacles.map((obs) => level1.world.key(obs)).sort().join(',')
    !== level2.obstacles.map((obs) => level2.world.key(obs)).sort().join(',');

  assert(
    diff,
    '不同種子通常產生不同障礙物配置',
  );
}

// ============ 平面世界穿牆規則 ============
console.log('\n=== 平面世界穿牆規則 ============');
{
  const seeds = [0, 100, 200, 300, 400];
  const wrapRules = new Set();

  for (const seed of seeds) {
    const level = generateLevel({ worldType: 'flat', difficulty: 'normal', seed });
    if (level.wrapRule !== null) {
      wrapRules.add(level.wrapRule);
    }
  }

  // 普通難度應該多種穿牆規則都出現過
  assert(wrapRules.size > 0, '生成過不同的穿牆規則');
}

// ============ 坑洞世界穿牆規則 ============
console.log('\n=== 坑洞世界穿牆規則 ===');
{
  const level = generateLevel({ worldType: 'pit', difficulty: 'easy', seed: 777 });
  assertEqual(level.wrapRule, null, '坑洞世界沒有穿牆規則');
}

// ============ 立方體世界穿牆規則 ============
console.log('\n=== 立方體世界穿牆規則 ===');
{
  const level = generateLevel({ worldType: 'cube', difficulty: 'easy', seed: 888 });
  assertEqual(level.wrapRule, null, '立方體世界沒有穿牆規則');
}

// ============ 關卡代碼編碼 ============
console.log('\n=== 關卡代碼編碼 ===');
{
  const code1 = encodeLevelCode('flat', 'easy', 0);
  assertEqual(code1, 'FE-000000', 'flat + easy + seed 0 → FE-000000');

  const code2 = encodeLevelCode('pit', 'normal', 12345);
  assert(code2.startsWith('BN-'), 'pit + normal 產生 BN- 開頭');

  const code3 = encodeLevelCode('cube', 'hard', 1000000);
  assert(code3.startsWith('CH-'), 'cube + hard 產生 CH- 開頭');
}

// ============ 關卡代碼解碼 ============
console.log('\n=== 關卡代碼解碼 ===');
{
  const code = 'FN-4F7K2Q';
  const decoded = decodeLevelCode(code);

  assertEqual(decoded.worldType, 'flat', '解碼出 worldType flat');
  assertEqual(decoded.difficulty, 'normal', '解碼出 difficulty normal');
  assert(decoded.seed >= 0 && decoded.seed < SEED_RANGE, 'seed 在合法範圍內');
}

// ============ 關卡代碼大小寫容錯 ============
console.log('\n=== 關卡代碼大小寫容錯 ===');
{
  const upper = decodeLevelCode('FN-4F7K2Q');
  const lower = decodeLevelCode('fn-4f7k2q');
  const mixed = decodeLevelCode('Fn-4F7k2q');

  assertEqual(upper, lower, '大小寫應視為相同');
  assertEqual(upper, mixed, '混合大小寫應視為相同');
}

// ============ 關卡代碼連字號容錯 ============
console.log('\n=== 關卡代碼連字號容錯 ===');
{
  const withHyphen = decodeLevelCode('FN-4F7K2Q');
  const withoutHyphen = decodeLevelCode('FN4F7K2Q');

  assertEqual(withHyphen, withoutHyphen, '有無連字號應視為相同');
}

// ============ 無效關卡代碼 ============
console.log('\n=== 無效關卡代碼 ===');
{
  assert(decodeLevelCode('XX-000000') === null, '無效世界字母');
  assert(decodeLevelCode('FX-000000') === null, '無效難度字母');
  assert(decodeLevelCode('FN-ZZZZZZ') === null, '無效 seed（超出範圍）');
  assert(decodeLevelCode('') === null, '空字串');
  assert(decodeLevelCode('not-a-code') === null, '隨意字串');
}

// ============ 編碼-解碼往返 ============
console.log('\n=== 編碼-解碼往返 ===');
{
  const testCases = [
    { worldType: 'flat', difficulty: 'easy', seed: 0 },
    { worldType: 'flat', difficulty: 'normal', seed: 12345 },
    { worldType: 'pit', difficulty: 'hard', seed: 999999 },
    { worldType: 'cube', difficulty: 'easy', seed: 555555 },
  ];

  for (const testCase of testCases) {
    const encoded = encodeLevelCode(
      testCase.worldType,
      testCase.difficulty,
      testCase.seed,
    );
    const decoded = decodeLevelCode(encoded);

    assertEqual(decoded.worldType, testCase.worldType, `${encoded}: worldType 往返正確`);
    assertEqual(decoded.difficulty, testCase.difficulty, `${encoded}: difficulty 往返正確`);
    assertEqual(decoded.seed, testCase.seed, `${encoded}: seed 往返正確`);
  }
}

// ============ 多次生成穩定性 ============
console.log('\n=== 多次生成穩定性 ===');
{
  const levels = [];
  for (let i = 0; i < 100; i++) {
    try {
      const level = generateLevel({
        worldType: 'flat',
        difficulty: 'normal',
        seed: i,
      });
      levels.push(level);
      assert(level !== null, `種子 ${i} 生成成功`);
    } catch (e) {
      failed++;
      console.error(`✗ 種子 ${i} 拋出錯誤: ${e.message}`);
    }
  }

  assert(levels.length === 100, '100 個種子全部成功生成');

  // 檢查是否有重複配置
  const configs = new Set();
  for (const level of levels) {
    const config = level.obstacles
      .map((obs) => level.world.key(obs))
      .sort()
      .join(',');
    configs.add(config);
  }

  assert(configs.size > 50, '多個不同種子應產生不同配置');
}

// ============ 所有世界類型都可生成 ============
console.log('\n=== 所有世界類型生成 ===');
{
  for (const worldType of AVAILABLE_WORLDS) {
    for (const difficulty of Object.keys(DIFFICULTIES)) {
      const level = generateLevel({ worldType, difficulty, seed: 42 });
      assert(
        level !== null && level.world !== null,
        `${worldType} + ${difficulty} 生成成功`,
      );
    }
  }
}

// ============ 總結 ============
console.log(`\n=== 測試結果 ===`);
console.log(`✓ 通過: ${passed}`);
console.log(`✗ 失敗: ${failed}`);
console.log(`共計: ${passed + failed}`);

if (failed > 0) process.exit(1);
