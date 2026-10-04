// 世界座標與 3D 格點對齊驗證
// 測試 world.toPosition(cell) 與 3D 渲染層的一致性
// 執行：node test/world-position.test.js

import { createFlatWorld } from '../js/worlds/flat.js';
import { createPitWorld } from '../js/worlds/pit.js';
import { createCubeWorld } from '../js/worlds/cube.js';
import { WORLD_SIZES, WRAP_RULES } from '../js/config.js';

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

function assertEqual(actual, expected, message, tolerance = 0.001) {
  const match =
    typeof actual === 'object' && typeof expected === 'object'
      ? Object.keys(expected).every(
          (key) => Math.abs((actual[key] ?? 0) - expected[key]) <= tolerance,
        )
      : Math.abs(actual - expected) <= tolerance;

  if (match) {
    passed++;
    console.log(`✓ ${message}`);
  } else {
    failed++;
    console.error(`✗ ${message}`);
    console.error(`  期望: ${JSON.stringify(expected)}`);
    console.error(`  實際: ${JSON.stringify(actual)}`);
  }
}

// ============ 平面世界座標 ============
console.log('\n=== 平面世界座標系統 ===');
{
  const world = createFlatWorld({ cols: 20, rows: 20, wrap: WRAP_RULES.none });

  // 測試 1: 地圖中心 (10, 10)
  const center = world.toPosition({ x: 10, y: 10 });
  assertEqual(center.x, 0.5, '中心 x 座標：10 - 20/2 + 0.5 = 0.5');
  assertEqual(center.y, 0, '平面 y 座標固定為 0');
  assertEqual(center.z, 0.5, '中心 z 座標：10 - 20/2 + 0.5 = 0.5');
  assertEqual(center.up, { x: 0, y: 1, z: 0 }, 'up 方向朝上');

  // 測試 2: 左上角 (0, 0)
  const topLeft = world.toPosition({ x: 0, y: 0 });
  assertEqual(topLeft.x, -9.5, '左上角 x：0 - 10 + 0.5 = -9.5');
  assertEqual(topLeft.z, -9.5, '左上角 z：0 - 10 + 0.5 = -9.5');

  // 測試 3: 右下角 (19, 19)
  const bottomRight = world.toPosition({ x: 19, y: 19 });
  assertEqual(bottomRight.x, 9.5, '右下角 x：19 - 10 + 0.5 = 9.5');
  assertEqual(bottomRight.z, 9.5, '右下角 z：19 - 10 + 0.5 = 9.5');

  // 測試 4: 相鄰格子距離
  const cell1 = world.toPosition({ x: 5, y: 5 });
  const cell2 = world.toPosition({ x: 6, y: 5 });
  const distX = Math.abs(cell2.x - cell1.x);
  assertEqual(distX, 1, '相鄰格子距離為 1');

  // 測試 5: 所有格子 up 方向一致
  const cells = world.cells();
  const upVectors = cells.map((c) => world.toPosition(c).up);
  const allSame = upVectors.every((up) => up.x === 0 && up.y === 1 && up.z === 0);
  assert(allSame, '平面世界所有格子 up 方向都是 (0, 1, 0)');
}

// ============ 不同大小的平面世界 ============
console.log('\n=== 不同大小平面世界 ===');
{
  // 10x10 地圖
  const small = createFlatWorld({ cols: 10, rows: 10, wrap: WRAP_RULES.none });
  const smallCenter = small.toPosition({ x: 5, y: 5 });
  assertEqual(smallCenter.x, 0.5, '10x10 地圖中心 x = 0.5');
  assertEqual(smallCenter.z, 0.5, '10x10 地圖中心 z = 0.5');

  // 30x30 地圖
  const large = createFlatWorld({ cols: 30, rows: 30, wrap: WRAP_RULES.none });
  const largeCenter = large.toPosition({ x: 15, y: 15 });
  assertEqual(largeCenter.x, 0.5, '30x30 地圖中心 x = 0.5');
  assertEqual(largeCenter.z, 0.5, '30x30 地圖中心 z = 0.5');
}

// ============ 坑洞世界座標 ============
console.log('\n=== 坑洞世界座標系統 ===');
{
  const world = createPitWorld(WORLD_SIZES.pit);
  const { cols, rows, depth } = WORLD_SIZES.pit;

  // 測試 1: 最上層的中心
  const topCenter = world.toPosition({ x: Math.floor(cols / 2), y: Math.floor(rows / 2), z: 0 });
  assertEqual(topCenter.y, -1, '最上層 (z=0) 的 y = -(0+1) = -1');
  assertEqual(topCenter.up, { x: 0, y: 1, z: 0 }, 'up 方向朝上');

  // 測試 2: 最底層的中心
  const bottomCenter = world.toPosition({ x: Math.floor(cols / 2), y: Math.floor(rows / 2), z: depth - 1 });
  assertEqual(bottomCenter.y, -depth, `最底層 (z=${depth - 1}) 的 y = -${depth}`);

  // 測試 3: 不同層之間的距離
  const layer0 = world.toPosition({ x: 0, y: 0, z: 0 });
  const layer1 = world.toPosition({ x: 0, y: 0, z: 1 });
  const layerDist = Math.abs(layer0.y - layer1.y);
  assertEqual(layerDist, 1, '相鄰層之間 y 距離為 1');

  // 測試 4: 所有層的 up 方向一致
  const cells = world.cells();
  const upVectors = cells.map((c) => world.toPosition(c).up);
  const allSame = upVectors.every((up) => up.x === 0 && up.y === 1 && up.z === 0);
  assert(allSame, '坑洞世界所有格子 up 方向都是 (0, 1, 0)');
}

// ============ 坑洞世界邊界 ============
console.log('\n=== 坑洞世界邊界座標 ===');
{
  const world = createPitWorld(WORLD_SIZES.pit);
  const { cols, rows } = WORLD_SIZES.pit;

  // 左上角
  const topLeft = world.toPosition({ x: 0, y: 0, z: 0 });
  assertEqual(topLeft.x, -(cols / 2) + 0.5, '左上角 x 座標正確');
  assertEqual(topLeft.z, -(rows / 2) + 0.5, '左上角 z 座標正確');

  // 右下角
  const bottomRight = world.toPosition({ x: cols - 1, y: rows - 1, z: 0 });
  assertEqual(bottomRight.x, (cols / 2) - 0.5, '右下角 x 座標正確');
  assertEqual(bottomRight.z, (rows / 2) - 0.5, '右下角 z 座標正確');
}

// ============ 立方體世界座標 ============
console.log('\n=== 立方體世界座標系統 ===');
{
  const world = createCubeWorld(WORLD_SIZES.cube);
  const size = WORLD_SIZES.cube.size;

  // 測試 1: 上面的中心
  const topCenter = world.toPosition({ x: 0, y: size, z: 0 });
  assertEqual(topCenter.x, 0, '上面中心 x = 0');
  assertEqual(topCenter.y, size / 2, '上面中心 y = size/2');
  assertEqual(topCenter.z, 0, '上面中心 z = 0');
  assertEqual(topCenter.up, { x: 0, y: 1, z: 0 }, '上面朝向 (0, 1, 0)');

  // 測試 2: 下面的中心
  const bottomCenter = world.toPosition({ x: 0, y: -size, z: 0 });
  assertEqual(bottomCenter.y, -(size / 2), '下面中心 y = -size/2');
  assertEqual(bottomCenter.up, { x: 0, y: -1, z: 0 }, '下面朝向 (0, -1, 0)');

  // 測試 3: 右面的中心
  const rightCenter = world.toPosition({ x: size, y: 0, z: 0 });
  assertEqual(rightCenter.up, { x: 1, y: 0, z: 0 }, '右面朝向 (1, 0, 0)');

  // 測試 4: 相鄰格子是否保持一致距離
  const cell1 = world.toPosition({ x: 0, y: size, z: 0 });
  const cell2 = world.toPosition({ x: 2, y: size, z: 0 });
  const dist = Math.hypot(cell2.x - cell1.x, cell2.y - cell1.y, cell2.z - cell1.z);
  assertEqual(dist, 1, '相鄰格子距離為 1（座標為「半格」單位）');
}

// ============ 立方體世界所有面 ============
console.log('\n=== 立方體世界所有面 ===');
{
  const world = createCubeWorld(WORLD_SIZES.cube);
  const size = WORLD_SIZES.cube.size;
  const half = size / 2;

  const faces = [
    { name: '+x（右）', cell: { x: size, y: 0, z: 0 }, expectedUp: { x: 1, y: 0, z: 0 } },
    { name: '-x（左）', cell: { x: -size, y: 0, z: 0 }, expectedUp: { x: -1, y: 0, z: 0 } },
    { name: '+y（上）', cell: { x: 0, y: size, z: 0 }, expectedUp: { x: 0, y: 1, z: 0 } },
    { name: '-y（下）', cell: { x: 0, y: -size, z: 0 }, expectedUp: { x: 0, y: -1, z: 0 } },
    { name: '+z（前）', cell: { x: 0, y: 0, z: size }, expectedUp: { x: 0, y: 0, z: 1 } },
    { name: '-z（後）', cell: { x: 0, y: 0, z: -size }, expectedUp: { x: 0, y: 0, z: -1 } },
  ];

  for (const face of faces) {
    const pos = world.toPosition(face.cell);
    assertEqual(pos.up, face.expectedUp, `${face.name} 朝向正確`);
  }
}

// ============ 座標往返一致性 ============
console.log('\n=== 座標與格子對應 ===');
{
  const world = createFlatWorld({ cols: 20, rows: 20, wrap: WRAP_RULES.none });

  // 任意取幾個格子，確認座標轉換合理
  const testCells = [
    { x: 0, y: 0 },
    { x: 5, y: 5 },
    { x: 10, y: 10 },
    { x: 19, y: 19 },
  ];

  for (const cell of testCells) {
    const pos = world.toPosition(cell);
    assert(pos.x !== undefined && pos.y !== undefined && pos.z !== undefined, `格子 (${cell.x}, ${cell.y}) 有完整座標`);
    assert(pos.up !== undefined, `格子 (${cell.x}, ${cell.y}) 有 up 方向`);
  }
}

// ============ 總結 ============
console.log(`\n=== 測試結果 ===`);
console.log(`✓ 通過: ${passed}`);
console.log(`✗ 失敗: ${failed}`);
console.log(`共計: ${passed + failed}`);

if (failed > 0) process.exit(1);
