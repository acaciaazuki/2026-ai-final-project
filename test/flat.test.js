// 平面世界的邏輯測試
// 測試移動、穿牆、邊界、BFS 連通性等
// 執行：node test/flat.test.js

import { createFlatWorld } from '../js/worlds/flat.js';
import { WRAP_RULES } from '../js/config.js';

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

// ============ 平面世界基礎測試 ============
console.log('\n=== 平面世界：基礎移動 ===');
{
  const world = createFlatWorld({ cols: 10, rows: 10, wrap: WRAP_RULES.none });
  const spawn = world.spawn();

  assertEqual(spawn.cell, { x: 5, y: 5 }, '預設出生位置在地圖中央');
  assertEqual(spawn.direction, 'right', '預設朝向右');

  // 向右移動
  const right = world.move(spawn.cell, 'right');
  assertEqual(right.cell, { x: 6, y: 5 }, '向右移動');
  assertEqual(right.direction, 'right', '方向不變');

  // 向下移動
  const down = world.move(right.cell, 'down');
  assertEqual(down.cell, { x: 6, y: 6 }, '向下移動');
}

// ============ 平面世界：邊界（無穿牆） ============
console.log('\n=== 平面世界：邊界規則（無穿牆）===');
{
  const world = createFlatWorld({ cols: 10, rows: 10, wrap: WRAP_RULES.none });

  // 撞左邊界
  const left = world.move({ x: 0, y: 5 }, 'left');
  assert(left === null, '撞左邊界回傳 null');

  // 撞上邊界
  const up = world.move({ x: 5, y: 0 }, 'up');
  assert(up === null, '撞上邊界回傳 null');

  // 撞右邊界
  const right = world.move({ x: 9, y: 5 }, 'right');
  assert(right === null, '撞右邊界回傳 null');

  // 撞下邊界
  const down = world.move({ x: 5, y: 9 }, 'down');
  assert(down === null, '撞下邊界回傳 null');
}

// ============ 平面世界：穿牆（全部） ============
console.log('\n=== 平面世界：穿牆規則（全部）===');
{
  const world = createFlatWorld({ cols: 10, rows: 10, wrap: WRAP_RULES.both });

  // 穿左邊界
  const left = world.move({ x: 0, y: 5 }, 'left');
  assertEqual(left.cell, { x: 9, y: 5 }, '從左邊穿出到右邊');

  // 穿右邊界
  const right = world.move({ x: 9, y: 5 }, 'right');
  assertEqual(right.cell, { x: 0, y: 5 }, '從右邊穿出到左邊');

  // 穿上邊界
  const up = world.move({ x: 5, y: 0 }, 'up');
  assertEqual(up.cell, { x: 5, y: 9 }, '從上邊穿出到下邊');

  // 穿下邊界
  const down = world.move({ x: 5, y: 9 }, 'down');
  assertEqual(down.cell, { x: 5, y: 0 }, '從下邊穿出到上邊');
}

// ============ 平面世界：穿牆（只垂直） ============
console.log('\n=== 平面世界：穿牆規則（只垂直）===');
{
  const world = createFlatWorld({ cols: 10, rows: 10, wrap: WRAP_RULES.vertical });

  // 可以穿上下邊界
  const up = world.move({ x: 5, y: 0 }, 'up');
  assertEqual(up.cell, { x: 5, y: 9 }, '垂直穿牆：上到下');

  // 不能穿左右邊界
  const left = world.move({ x: 0, y: 5 }, 'left');
  assert(left === null, '垂直穿牆：左邊界擋住');

  const right = world.move({ x: 9, y: 5 }, 'right');
  assert(right === null, '垂直穿牆：右邊界擋住');
}

// ============ 平面世界：穿牆（只水平） ============
console.log('\n=== 平面世界：穿牆規則（只水平）===');
{
  const world = createFlatWorld({ cols: 10, rows: 10, wrap: WRAP_RULES.horizontal });

  // 可以穿左右邊界
  const left = world.move({ x: 0, y: 5 }, 'left');
  assertEqual(left.cell, { x: 9, y: 5 }, '水平穿牆：左到右');

  // 不能穿上下邊界
  const up = world.move({ x: 5, y: 0 }, 'up');
  assert(up === null, '水平穿牆：上邊界擋住');

  const down = world.move({ x: 5, y: 9 }, 'down');
  assert(down === null, '水平穿牆：下邊界擋住');
}

// ============ 平面世界：相對方向 ============
console.log('\n=== 平面世界：相對方向 ===');
{
  const world = createFlatWorld({ cols: 10, rows: 10, wrap: WRAP_RULES.none });

  assertEqual(world.opposite('up'), 'down', 'up 的反方向是 down');
  assertEqual(world.opposite('down'), 'up', 'down 的反方向是 up');
  assertEqual(world.opposite('left'), 'right', 'left 的反方向是 right');
  assertEqual(world.opposite('right'), 'left', 'right 的反方向是 left');
}

// ============ 平面世界：格子列表 ============
console.log('\n=== 平面世界：格子列表 ===');
{
  const world = createFlatWorld({ cols: 3, rows: 2, wrap: WRAP_RULES.none });
  const cells = world.cells();

  assertEqual(cells.length, 6, '3×2 地圖有 6 格');
  assert(cells.some(c => c.x === 0 && c.y === 0), '包含 (0,0)');
  assert(cells.some(c => c.x === 2 && c.y === 1), '包含 (2,1)');
}

// ============ 平面世界：格子索引 ============
console.log('\n=== 平面世界：格子索引 ===');
{
  const world = createFlatWorld({ cols: 10, rows: 10, wrap: WRAP_RULES.none });
  const cell1 = { x: 3, y: 4 };
  const cell2 = { x: 3, y: 4 };
  const cell3 = { x: 4, y: 3 };

  assertEqual(world.key(cell1), world.key(cell2), '相同座標的 key 相同');
  assert(world.key(cell1) !== world.key(cell3), '不同座標的 key 不同');
}

// ============ 平面世界：3D 位置 ============
console.log('\n=== 平面世界：3D 位置 ===');
{
  const world = createFlatWorld({ cols: 10, rows: 10, wrap: WRAP_RULES.none });

  // 地圖中央
  const center = world.toPosition({ x: 5, y: 5 });
  assertEqual(center.x, 0.5, '中央 x ≈ 0.5 (計算: 5 - 10/2 + 0.5)');
  assertEqual(center.y, 0, '平面 y = 0');
  assertEqual(center.z, 0.5, '中央 z ≈ 0.5');
  assertEqual(center.up, { x: 0, y: 1, z: 0 }, 'up 方向朝上');

  // 左上角
  const topLeft = world.toPosition({ x: 0, y: 0 });
  assert(topLeft.x < center.x, '左上角 x 較小');
  assert(topLeft.z < center.z, '左上角 z 較小');
}

// ============ 總結 ============
console.log(`\n=== 測試結果 ===`);
console.log(`✓ 通過: ${passed}`);
console.log(`✗ 失敗: ${failed}`);
console.log(`共計: ${passed + failed}`);

if (failed > 0) process.exit(1);
