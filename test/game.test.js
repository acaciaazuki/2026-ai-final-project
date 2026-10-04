// 遊戲邏輯測試
// 測試蛇的移動、吃食物、碰撞、加速、遊戲狀態等
// 執行：node test/game.test.js

import { Game, STATE } from '../js/game.js';
import { generateLevel } from '../js/level.js';
import { mulberry32 } from '../js/random.js';
import { DIFFICULTIES, START_LENGTH } from '../js/config.js';

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

function buildGame({ worldType = 'flat', difficulty = 'easy', seed = 12345, startLength = START_LENGTH, introMs = 0 } = {}) {
  const level = generateLevel({ worldType, difficulty, seed });
  level.obstacles = [];
  return new Game({
    level,
    startLength,
    maxQueuedInputs: 2,
    speed: DIFFICULTIES[difficulty],
    introMs,
    rng: mulberry32(seed),
  });
}

console.log('\n=== 遊戲初始化 ===');
{
  const game = buildGame();
  assertEqual(game.state, STATE.READY, '初始狀態是 READY');
  assertEqual(game.snake.length, START_LENGTH, `蛇初始長度 ${START_LENGTH}`);
  assertEqual(game.score, 0, '初始分數是 0');
  assert(game.food !== null, '產生了食物');
}

console.log('\n=== 遊戲狀態轉換 ===');
{
  const game = buildGame();
  game.start();
  assertEqual(game.state, STATE.PLAYING, 'start() 後變成 PLAYING');
  game.pause();
  assertEqual(game.state, STATE.PAUSED, 'pause() 後變成 PAUSED');
  game.resume();
  assertEqual(game.state, STATE.PLAYING, 'resume() 後回到 PLAYING');
}

console.log('\n=== INTRO 狀態 ===');
{
  const game = buildGame({ introMs: 500 });
  game.start();
  assertEqual(game.state, STATE.INTRO, 'intro 時間 > 0 時進入 INTRO');
  game.step(250);
  assertEqual(game.state, STATE.INTRO, '經過 250ms 仍在 INTRO');
  game.step(300);
  assertEqual(game.state, STATE.PLAYING, '超過 intro 時間後進入 PLAYING');
}

console.log('\n=== 基本移動 ===');
{
  const game = buildGame();
  const initialHead = { ...game.snake[0] };
  game.start();
  game.queueDirection('right');
  game.step(game.tickMs);
  assert(
    game.snake[0].x !== initialHead.x || game.snake[0].y !== initialHead.y,
    '蛇頭位置改變',
  );
  assertEqual(game.snake.length, START_LENGTH, '沒有吃食物時長度不變');
}

console.log('\n=== 轉向 / 排隊 ===');
{
  const game = buildGame();
  game.start();
  game.queueDirection('right');
  game.queueDirection('right');
  assert(game.inputQueue.length === 1, '重複方向不重複加入');

  game.inputQueue = [];
  game.direction = 'right';
  game.queueDirection('left');
  assert(game.inputQueue.length === 0, '回頭方向被忽略');

  game.pause();
  game.queueDirection('up');
  assert(game.inputQueue.length === 0, '暫停時不接受方向輸入');
}

console.log('\n=== 碰牆結束 ===');
{
  const game = buildGame({ seed: 2024 });
  game.start();
  game.snake[0] = { x: 0, y: 0 };
  game.direction = 'up';
  game.step(game.tickMs);
  assertEqual(game.state, STATE.OVER, '撞牆後遊戲結束');
}

console.log('\n=== 吃食物 ===');
{
  const game = buildGame();
  game.start();
  const beforeLength = game.snake.length;
  const beforeScore = game.score;
  const head = game.snake[0];
  const next = game.world.move(head, game.direction);
  game.food = next.cell;
  game.step(game.tickMs);
  assertEqual(game.snake.length, beforeLength + 1, '吃食物後蛇長度增加');
  assertEqual(game.score, beforeScore + 1, '分數增加 1');
}

console.log('\n=== 加速邏輯 ===');
{
  const game = buildGame({ difficulty: 'normal', seed: 77 });
  game.start();
  const before = game.tickMs;
  for (let i = 0; i < 5; i++) {
    const head = game.snake[0];
    const next = game.world.move(head, game.direction);
    game.food = next.cell;
    game.step(game.tickMs);
  }
  assert(game.tickMs < before, '普通難度吃到 5 顆後加速');
}

console.log('\n=== progress() ===');
{
  const game = buildGame();
  game.start();
  assert(game.progress() >= 0 && game.progress() <= 1, 'progress 在合理範圍內');
  game.elapsed = game.tickMs / 2;
  assert(Math.abs(game.progress() - 0.5) < 0.01, 'progress 反映整體移動進度');
  game.state = STATE.OVER;
  assertEqual(game.progress(), 1, '遊戲結束時 progress 固定為 1');
}

console.log(`\n=== 測試結果 ===`);
console.log(`✓ 通過: ${passed}`);
console.log(`✗ 失敗: ${failed}`);
console.log(`共計: ${passed + failed}`);

if (failed > 0) process.exit(1);
