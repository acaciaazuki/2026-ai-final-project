// 遊戲狀態機：移動、碰撞、食物與加速
// 只透過世界介面操作格子，不知道也不需要知道是哪一種世界

export const STATE = {
  READY: 'ready', // 等待開始
  INTRO: 'intro', // 開局前顯示關卡規則
  PLAYING: 'playing', // 遊戲中
  PAUSED: 'paused', // 暫停
  OVER: 'over', // 遊戲結束
};

// 從出生點沿著反方向走，排出初始的蛇身（第一個元素是蛇頭）
function buildSnake(world, spawn, length) {
  const body = [spawn.cell];
  let cell = spawn.cell;
  let back = world.opposite(spawn.direction);
  for (let i = 1; i < length; i++) {
    const step = world.move(cell, back);
    cell = step.cell;
    back = step.direction;
    body.push(cell);
  }
  return body;
}

export class Game {
  // speed 的欄位說明見 config.js 的 DIFFICULTIES
  // level 由 level.js 的 generateLevel 產生，包含世界、障礙物與出生位置
  constructor({ level, startLength, maxQueuedInputs, speed, introMs = 0, rng = Math.random }) {
    this.world = level.world;
    this.wrapRule = level.wrapRule;
    this.obstacles = level.obstacles;
    this.obstacleKeys = new Set(level.obstacles.map(this.world.key));
    this.maxQueuedInputs = maxQueuedInputs;
    this.speed = speed;
    this.introMs = introMs;
    this.rng = rng;

    this.direction = level.spawn.direction;
    this.snake = buildSnake(this.world, level.spawn, startLength);
    this.inputQueue = [];
    this.score = 0;
    this.won = false;
    this.tickMs = speed.startTickMs;
    this.elapsed = 0;
    this.food = this.spawnFood();
    this.state = STATE.READY;
  }

  // 開始遊戲：有設定開局提示時間就先進入提示狀態
  start() {
    if (this.state !== STATE.READY) return;
    this.state = this.introMs > 0 ? STATE.INTRO : STATE.PLAYING;
  }

  pause() {
    if (this.state === STATE.PLAYING) this.state = STATE.PAUSED;
  }

  resume() {
    if (this.state === STATE.PAUSED) this.state = STATE.PLAYING;
  }

  // 把玩家輸入的方向放進佇列，下一次移動時才會套用
  queueDirection(direction) {
    if (this.state !== STATE.PLAYING) return;
    if (!this.world.directions.includes(direction)) return;

    // 跟佇列最後一個方向比較，而不是目前的方向，
    // 否則在同一次移動前快速按「上、左」可能會變成直接回頭
    const last = this.inputQueue.at(-1) ?? this.direction;
    if (direction === last || direction === this.world.opposite(last)) return;
    if (this.inputQueue.length >= this.maxQueuedInputs) return;

    this.inputQueue.push(direction);
  }

  // 經過 dt 毫秒：累積時間，每滿一個移動間隔就前進一格
  step(dt) {
    if (this.state === STATE.INTRO) {
      this.introMs -= dt;
      if (this.introMs <= 0) this.state = STATE.PLAYING;
      return;
    }
    if (this.state !== STATE.PLAYING) return;

    this.elapsed += dt;
    while (this.elapsed >= this.tickMs && this.state === STATE.PLAYING) {
      this.elapsed -= this.tickMs;
      this.update();
    }
  }

  // 前進一格：處理轉向、碰撞與吃食物
  update() {
    if (this.state !== STATE.PLAYING) return;

    if (this.inputQueue.length > 0) {
      this.direction = this.inputQueue.shift();
    }

    const step = this.world.move(this.snake[0], this.direction);
    if (!step || this.isObstacle(step.cell)) {
      this.state = STATE.OVER;
      return;
    }
    const head = step.cell;
    // 立方體跨面時方向會改變，以世界回傳的方向為準
    this.direction = step.direction;

    const eating = this.food && this.world.key(head) === this.world.key(this.food);

    // 沒吃到食物時尾巴會同時移走，所以移動到目前尾巴的位置不算撞到自己
    const body = eating ? this.snake : this.snake.slice(0, -1);
    if (this.occupies(body, head)) {
      this.state = STATE.OVER;
      return;
    }

    this.snake.unshift(head);
    if (!eating) {
      this.snake.pop();
      return;
    }

    this.score += 1;
    this.speedUp();
    this.food = this.spawnFood();
    if (!this.food) {
      // 蛇填滿所有空格，沒有地方可以放食物
      this.won = true;
      this.state = STATE.OVER;
    }
  }

  isObstacle(cell) {
    return this.obstacleKeys.has(this.world.key(cell));
  }

  occupies(body, cell) {
    const key = this.world.key(cell);
    return body.some((part) => this.world.key(part) === key);
  }

  // 依難度設定，每吃到一定數量的食物就縮短移動間隔
  speedUp() {
    const { speedupEvery, speedupMs, minTickMs } = this.speed;
    if (speedupEvery > 0 && this.score % speedupEvery === 0) {
      this.tickMs = Math.max(minTickMs, this.tickMs - speedupMs);
    }
  }

  // 在隨機的空格（不是蛇身也不是障礙物）放食物；沒有空格時回傳 null
  spawnFood() {
    const snakeKeys = new Set(this.snake.map(this.world.key));
    const empty = this.world
      .cells()
      .filter((cell) => !snakeKeys.has(this.world.key(cell)) && !this.isObstacle(cell));
    if (empty.length === 0) return null;
    return empty[Math.floor(this.rng() * empty.length)];
  }
}
